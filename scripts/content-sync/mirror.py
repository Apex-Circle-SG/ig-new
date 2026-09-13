"""Resumable public WordPress preservation. Never publishes or mutates WordPress."""
import argparse
import csv
import gzip
import hashlib
import io
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path

ORIGIN = 'https://blog.insightginie.com'
VERSION = 'wordpress-public-mirror-v1'
AGENT = 'InsightGinie-ReadOnly-Preservation/1.0 (+https://insightginie.com/about/)'


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f'.{path.name}-{os.getpid()}.tmp')
    with temporary.open('xb') as handle:
        handle.write(encoded(value))
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def immutable(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with path.open('xb') as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
    except FileExistsError:
        if path.read_bytes() != data:
            raise ValueError('immutable_object_mismatch')


@contextmanager
def lock(root):
    root.mkdir(parents=True, exist_ok=True)
    path = root / '.mirror.lock'
    with path.open('x') as handle:
        handle.write(str(os.getpid()))
    try:
        yield
    finally:
        path.unlink()


def safe_source(value):
    url = urllib.parse.urlsplit(value)
    if (url.scheme + '://' + url.netloc != ORIGIN or url.query or url.fragment
            or not url.path.startswith('/') or not url.path.endswith('/')
            or re.search(r'[\x00-\x20\\]', value)):
        raise ValueError('unsafe_source_url')
    return value


def object_path(root, checksum, suffix='json'):
    if not re.fullmatch('[a-f0-9]{64}', checksum):
        raise ValueError('invalid_object_checksum')
    return root / 'objects' / f'{checksum}.{suffix}'


def build_plan(manifest_path, snapshots):
    manifest_bytes = manifest_path.read_bytes()
    manifest = json.loads(manifest_bytes)
    entities = {}
    counts = {'posts': 0, 'pages': 0}
    for request in manifest:
        parsed = urllib.parse.urlsplit(request['url'])
        kind = parsed.path.rsplit('/', 1)[-1]
        if parsed.scheme + '://' + parsed.netloc != ORIGIN or kind not in counts:
            continue
        if parsed.path != f'/wp-json/wp/v2/{kind}' or request['status'] != 200:
            continue
        filename = request['snapshot_file']
        if Path(filename).name != filename:
            raise ValueError('unsafe_audit_snapshot_name')
        raw = gzip.decompress((snapshots / filename).read_bytes())
        if digest(raw) != request['sha256']:
            raise ValueError('audit_snapshot_checksum_mismatch')
        for item in json.loads(raw):
            if type(item['id']) is not int or item['id'] <= 0:
                raise ValueError('invalid_audited_id')
            key = f'{kind}:{item["id"]}'
            entity = {
                'key': key, 'kind': kind, 'id': item['id'],
                'sourceUrl': safe_source(item['link']), 'slug': item['slug'],
                'titleHtml': item['title']['rendered'], 'modifiedGmt': item['modified_gmt'],
                'auditResponseSha256': request['sha256'],
            }
            if key in entities and entities[key] != entity:
                raise ValueError('conflicting_audit_identity')
            entities[key] = entity
    if not entities:
        raise ValueError('empty_audit_plan')
    ordered = sorted(entities.values(), key=lambda item: (item['kind'], item['id']))
    if len({item['sourceUrl'] for item in ordered}) != len(ordered):
        raise ValueError('duplicate_source_urls')
    for item in ordered:
        counts[item['kind']] += 1
    return {'version': VERSION, 'sourceOrigin': ORIGIN, 'createdAt': now(),
            'manifestSha256': digest(manifest_bytes), 'planSha256': digest(encoded(ordered)),
            'counts': counts, 'entities': ordered}


def load_plan(root):
    plan = json.loads((root / 'plan.json').read_text())
    if (plan['version'] != VERSION or plan['sourceOrigin'] != ORIGIN
            or plan['planSha256'] != digest(encoded(plan['entities']))):
        raise ValueError('plan_integrity_failed')
    for item in plan['entities']:
        if (item['kind'] not in ('posts', 'pages') or type(item['id']) is not int
                or item['id'] <= 0 or item['key'] != f'{item["kind"]}:{item["id"]}'):
            raise ValueError('invalid_plan_identity')
        safe_source(item['sourceUrl'])
    return plan


def load_state(root, plan):
    path = root / 'checkpoint.json'
    if path.exists():
        state = json.loads(path.read_text())
        if state['planSha256'] != plan['planSha256'] or state['version'] != VERSION:
            raise ValueError('checkpoint_plan_mismatch')
        return state
    return {'version': VERSION, 'planSha256': plan['planSha256'], 'records': {},
            'assets': {}, 'requests': [], 'notBefore': None, 'lastRun': None}


class HaltSource(Exception):
    def __init__(self, code, retry_after=None):
        super().__init__(code)
        self.retry_after = retry_after


def cooldown(retry_after, minimum_seconds=300):
    current = datetime.now(timezone.utc)
    seconds = minimum_seconds
    if retry_after:
        try:
            seconds = max(seconds, int(retry_after))
        except ValueError:
            try:
                seconds = max(seconds, (parsedate_to_datetime(retry_after) - current).total_seconds())
            except (ValueError, TypeError, OverflowError):
                pass
    return (current + timedelta(seconds=seconds)).isoformat()


def require_source_ready(state):
    if state['notBefore'] and datetime.fromisoformat(state['notBefore']) > datetime.now(timezone.utc):
        raise ValueError('source_cooldown_active_no_request_made')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise HaltSource(f'redirect_{code}_not_followed')


class Reader:
    def __init__(self, interval=5, opener=None):
        if interval < 2:
            raise ValueError('minimum_request_interval_is_two_seconds')
        self.interval = interval
        self.last = 0.0
        self.opener = opener or urllib.request.build_opener(NoRedirect())

    def get(self, url, cap, json_response=False):
        parsed = urllib.parse.urlsplit(url)
        allowed = (parsed.path in ('/wp-json/wp/v2/posts', '/wp-json/wp/v2/pages')
                   if json_response else upload_url(url) == url)
        if parsed.scheme + '://' + parsed.netloc != ORIGIN or not allowed:
            raise ValueError('request_outside_fixed_source_allowlist')
        remaining = self.interval - (time.monotonic() - self.last)
        if remaining > 0:
            time.sleep(remaining)
        self.last = time.monotonic()
        request = urllib.request.Request(url, method='GET', headers={
            'User-Agent': AGENT, 'Accept': 'application/json' if json_response else '*/*',
            'Accept-Encoding': 'identity',
        })
        try:
            response = self.opener.open(request, timeout=45)
        except urllib.error.HTTPError as error:
            retry = error.headers.get('Retry-After')
            error.close()
            raise HaltSource(f'http_{error.code}', retry) from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise HaltSource('source_network_failure') from None
        with response:
            content_type = response.headers.get('Content-Type', '')
            if response.status != 200:
                raise HaltSource(f'http_{response.status}')
            if json_response and 'application/json' not in content_type.lower():
                raise HaltSource('unexpected_response_content_type')
            if not json_response and not re.match(r'^(image/|audio/|video/|application/pdf)', content_type, re.I):
                raise HaltSource('unexpected_media_content_type')
            length = response.headers.get('Content-Length')
            if length and int(length) > cap:
                raise HaltSource('response_exceeds_byte_limit')
            data = response.read(cap + 1)
            if len(data) > cap:
                raise HaltSource('response_exceeds_byte_limit')
            return data, {'url': url, 'status': 200, 'retrievedAt': now(),
                          'contentType': content_type, 'bytes': len(data),
                          'sha256': digest(data), 'etag': response.headers.get('ETag')}


def upload_url(value):
    try:
        value = urllib.parse.urljoin(ORIGIN, value)
        url = urllib.parse.urlsplit(value)
        if (url.scheme + '://' + url.netloc != ORIGIN or url.query or url.fragment
                or not url.path.startswith('/wp-content/uploads/')
                or re.search(r'[\x00-\x20\\]', value)
                or any(part in ('.', '..') for part in urllib.parse.unquote(url.path).split('/'))):
            return None
        return value
    except ValueError:
        return None


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.urls = set()

    def handle_starttag(self, tag, attrs):
        if tag not in ('img', 'source', 'audio', 'video', 'a'):
            return
        attributes = dict(attrs)
        values = [attributes.get(key) or '' for key in ('src', 'poster', 'href')]
        values += [part.strip().split(' ')[0] for part in (attributes.get('srcset') or '').split(',')]
        for value in values:
            if candidate := upload_url(value):
                self.urls.add(candidate)


def assets_from(raw):
    parser = AssetParser()
    parser.feed(raw.get('content', {}).get('rendered', ''))
    for media in raw.get('_embedded', {}).get('wp:featuredmedia', []):
        if candidate := upload_url(media.get('source_url', '')):
            parser.urls.add(candidate)
        for size in media.get('media_details', {}).get('sizes', {}).values():
            if candidate := upload_url(size.get('source_url', '')):
                parser.urls.add(candidate)
    return sorted(parser.urls)


def validate_source(raw, entity):
    if (raw.get('id') != entity['id'] or raw.get('type') != entity['kind'][:-1]
            or raw.get('status') != 'publish' or raw.get('link') != entity['sourceUrl']
            or raw.get('slug') != entity['slug'] or raw.get('content', {}).get('protected')):
        raise ValueError('source_identity_or_publication_changed')
    for field in ('date_gmt', 'modified_gmt'):
        datetime.fromisoformat(raw[field])
    if not isinstance(raw['content']['rendered'], str) or not raw['title']['rendered']:
        raise ValueError('source_body_or_title_missing')
    author = next((a for a in raw.get('_embedded', {}).get('author', []) if a.get('id') == raw.get('author')), None)
    if not author or not author.get('name'):
        raise ValueError('source_author_missing')
    return author


def capture(root, plan, state, reader, request_limit=1, batch_size=100):
    if not 1 <= batch_size <= 100 or not 1 <= request_limit <= 200:
        raise ValueError('invalid_bounded_batch_size')
    run = {'startedAt': now(), 'mode': 'public-content-capture', 'httpRequests': 0,
           'preservedThisRun': 0, 'status': 'running'}
    for kind in ('pages', 'posts'):
        pending = [item for item in plan['entities'] if item['kind'] == kind and item['key'] not in state['records']]
        for start in range(0, len(pending), batch_size):
            if run['httpRequests'] >= request_limit:
                run['status'] = 'bounded_batch_complete'
                return run
            group = pending[start:start + batch_size]
            params = urllib.parse.urlencode({'include': ','.join(str(item['id']) for item in group),
                'per_page': len(group), 'orderby': 'id', 'order': 'asc', 'context': 'view',
                'status': 'publish', '_embed': 'author,wp:featuredmedia,wp:term'})
            endpoint = f'{ORIGIN}/wp-json/wp/v2/{kind}?{params}'
            run['httpRequests'] += 1
            data, receipt = reader.get(endpoint, 24_000_000, True)
            immutable(object_path(root, receipt['sha256'], 'response'), data)
            state['requests'].append(receipt)
            payload = json.loads(data)
            if not isinstance(payload, list) or any(not isinstance(item, dict) for item in payload):
                raise ValueError('source_batch_is_not_array')
            expected = {item['id']: item for item in group}
            if len({item.get('id') for item in payload}) != len(payload):
                raise ValueError('duplicate_response_ids')
            if set(expected) != {item.get('id') for item in payload}:
                raise ValueError('source_inventory_changed_missing_or_unexpected_ids')
            staged = {}
            for raw in payload:
                entity = expected[raw['id']]
                author = validate_source(raw, entity)
                body = encoded(raw)
                checksum = digest(body)
                immutable(object_path(root, checksum), body)
                staged[entity['key']] = {
                    'rawSha256': checksum, 'responseSha256': receipt['sha256'],
                    'sourceUrl': raw['link'], 'type': raw['type'], 'slug': raw['slug'],
                    'publishedGmt': raw['date_gmt'], 'modifiedGmt': raw['modified_gmt'],
                    'author': {'id': author['id'], 'name': author['name']},
                    'bodySha256': digest(raw['content']['rendered'].encode()),
                    'retrievedAt': receipt['retrievedAt'], 'mediaUrls': assets_from(raw),
                    'changedSinceAudit': raw['modified_gmt'] != entity['modifiedGmt'],
                }
            state['records'].update(staged)
            run['preservedThisRun'] += len(staged)
            state['lastRun'] = dict(run)
            atomic_json(root / 'checkpoint.json', state)
            print(json.dumps({'preserved': len(state['records']), 'planned': len(plan['entities']),
                              'requestsThisRun': run['httpRequests']}), flush=True)
    run['status'] = 'audited_public_content_captured'
    return run


def capture_media(root, state, reader, request_limit=25):
    if not 1 <= request_limit <= 100:
        raise ValueError('media_request_limit_must_be_1_to_100')
    urls = sorted({url for record in state['records'].values() for url in record['mediaUrls']})
    pending = [url for url in urls if url not in state['assets']][:request_limit]
    run = {'startedAt': now(), 'mode': 'public-media-capture', 'httpRequests': 0,
           'preservedThisRun': 0, 'status': 'running'}
    for url in pending:
        run['httpRequests'] += 1
        data, receipt = reader.get(url, 32_000_000)
        immutable(object_path(root, receipt['sha256'], 'media'), data)
        state['assets'][url] = receipt
        run['preservedThisRun'] += 1
        state['lastRun'] = dict(run)
        atomic_json(root / 'checkpoint.json', state)
    run['status'] = 'bounded_batch_complete' if len(state['assets']) < len(urls) else 'referenced_media_captured'
    return run


def verify(root, plan, state):
    planned = {item['key']: item for item in plan['entities']}
    failures = []
    for request in state['requests']:
        try:
            data = object_path(root, request['sha256'], 'response').read_bytes()
            if digest(data) != request['sha256'] or len(data) != request['bytes']:
                raise ValueError('response_checksum_mismatch')
        except (ValueError, KeyError, OSError) as error:
            failures.append({'url': request.get('url'), 'reason': str(error)[:160]})
    for key, record in state['records'].items():
        try:
            data = object_path(root, record['rawSha256']).read_bytes()
            if digest(data) != record['rawSha256']:
                raise ValueError('raw_checksum_mismatch')
            raw = json.loads(data)
            author = validate_source(raw, planned[key])
            if (digest(raw['content']['rendered'].encode()) != record['bodySha256']
                    or author['id'] != record['author']['id'] or author['name'] != record['author']['name']
                    or raw['date_gmt'] != record['publishedGmt'] or raw['modified_gmt'] != record['modifiedGmt']
                    or assets_from(raw) != record['mediaUrls']):
                raise ValueError('preservation_record_mismatch')
        except (ValueError, KeyError, OSError) as error:
            failures.append({'key': key, 'reason': str(error)[:160]})
    for url, asset in state['assets'].items():
        if digest(object_path(root, asset['sha256'], 'media').read_bytes()) != asset['sha256']:
            failures.append({'url': url, 'reason': 'media_checksum_mismatch'})
    return failures


def report(root, plan, state, destination):
    failures = verify(root, plan, state)
    urls = {url for record in state['records'].values() for url in record['mediaUrls']}
    receipt = {'version': VERSION, 'generatedAt': now(), 'sourceOrigin': ORIGIN,
               'storage': str(root), 'planned': plan['counts'],
               'preserved': {kind: sum(k.startswith(kind + ':') for k in state['records']) for kind in ('posts', 'pages')},
               'referencedUploadUrls': len(urls), 'mediaFilesCopied': len(state['assets']),
               'successfulHttpRequests': len(state['requests']) + len(state['assets']),
               'lastRun': state['lastRun'], 'notBefore': state['notBefore'],
               'integrityFailures': failures, 'publicContentComplete': len(state['records']) == len(plan['entities']) and not failures,
               'fullWordPressBackup': False, 'restoreTestPerformed': False,
               'publicationChanged': False, 'redirectsApplied': False,
               'remainingAccess': ['WordPress/hosting database, configuration, plugins/themes, private content and complete uploads export',
                                   'Isolated restore target and hosting/Cloudflare redirect administration'],
               'scope': 'Public rendered content and referenced upload copies only; no database, private posts, plugin configuration or complete media-library backup.'}
    destination.mkdir(parents=True, exist_ok=True)
    prepared_path = root / 'prepared' / 'index.json'
    prepared_bytes = prepared_path.read_bytes() if prepared_path.exists() else None
    prepared_document = json.loads(prepared_bytes) if prepared_bytes else {}
    prepared = prepared_document.get('records', {})
    if prepared_bytes:
        manifest_path = root / 'prepared' / 'manifests' / f'{digest(prepared_bytes)}.json'
        immutable(manifest_path, prepared_bytes)
        receipt['preparedImmutableManifest'] = str(manifest_path)
        receipt['preparedTransformationVersion'] = prepared_document.get('transformationVersion')
        receipt['normalizationSourceHashes'] = prepared_document.get('normalizationSourceHashes')
    receipt['checksumSchemes'] = {
        'checkpoint.records.rawSha256': 'SHA-256 of the stored UTF-8 individual source JSON file bytes (pretty JSON).',
        'prepared.index.records.rawSha256': 'The same mirror source-file byte checksum; links each derived record to its immutable raw object.',
        'prepared.index.records.recordSha256': 'SHA-256 of the stored UTF-8 normalized record file bytes.',
        'ContentRecord.rawSha256': 'SHA-256 of JavaScript JSON.stringify(parsedSourceObject), as UTF-8; compact serialization, not RFC 8785 canonical JSON.',
        'ContentRecord.contentSha256': 'SHA-256 of the sanitized HTML string, as UTF-8.',
        'preparedIndexSha256': 'SHA-256 of the complete prepared manifest file bytes; the immutable filename has the same checksum.',
    }
    receipt['httpRequestCountScope'] = 'Successful responses durably recorded in the checkpoint only; interrupted in-flight attempts may not be counted.'
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['source_url', 'kind', 'wp_id', 'body_preserved', 'raw_sha256', 'body_sha256',
                     'candidate_target', 'target_live_verified', 'approved', 'active', 'review_status'])
    for entity in plan['entities']:
        record = state['records'].get(entity['key'], {})
        derived = prepared.get(entity['key'], {})
        target = f'https://insightginie.com{derived["path"]}' if derived.get('valid') else ''
        writer.writerow([entity['sourceUrl'], entity['kind'], entity['id'], bool(record),
                         record.get('rawSha256', ''), record.get('bodySha256', ''), target,
                         False, False, False, 'EXACT_CONTENT_CANDIDATE_REQUIRES_CUTOVER' if target else 'PRESERVE_AND_REVIEW'])
    map_name = f'content-migration-map-{digest(output.getvalue().encode())[:12]}.csv.gz'
    immutable(destination / map_name,
              gzip.compress(output.getvalue().encode(), mtime=0))
    receipt['migrationMapFile'] = map_name
    receipt['migrationMapRows'] = len(plan['entities'])
    receipt['relatedFullUrlInventory'] = 'docs/audits/2026-09-13-consolidation/blog-inventory/url-inventory.csv.gz'
    receipt['preparedPostCandidates'] = sum(entry.get('valid', False) for entry in prepared.values())
    receipt['changedSinceAudit'] = sum(record['changedSinceAudit'] for record in state['records'].values())
    receipt['planSha256'] = plan['planSha256']
    receipt['checkpointSha256'] = digest((root / 'checkpoint.json').read_bytes())
    receipt['preparedIndexSha256'] = digest(prepared_bytes) if prepared_bytes else None
    receipt['sourceObjects'] = len(state['records'])
    receipt['responseObjects'] = len(state['requests'])
    atomic_json(destination / 'preservation-receipt.json', receipt)
    summary = f'''# Public WordPress preservation

Generated {receipt['generatedAt']}.

Preserved **{receipt['preserved']['posts']:,} of {plan['counts']['posts']:,} audited posts**
and **{receipt['preserved']['pages']} of {plan['counts']['pages']} public pages** from
the original blog. Immutable source records preserve original rendered bodies,
bylines, dates, media metadata, captions and source links. Integrity failures:
**{len(failures)}**. Sources changed since the metadata audit: **{receipt['changedSinceAudit']}**.

Prepared **{receipt['preparedPostCandidates']:,} sanitized article candidates** in
ignored storage. These candidates have no publishing approval and do not change
the deployed two-article preview, its source canonicals or noindex controls.
The copied pages retain their original page type and await template/content review.

Copied **{len(state['assets']):,} binary files** from **{len(urls):,} distinct referenced
blog-host upload URLs**. Raw source records retain media references even where
the binary has not been copied. This covers referenced public uploads only;
private, unlinked and external-host media are outside this binary mirror.

- [Machine-readable receipt](preservation-receipt.json)
- [Migration handover and remaining access](handover.md)
- [Inactive content migration map]({map_name}): {len(plan['entities']):,} rows;
  proposed destinations only for successfully normalized article copies.
- [Original full URL inventory](../2026-09-13-consolidation/blog-inventory/url-inventory.csv.gz):
  the wider 41,211-URL discovery, including taxonomies and archives.
- [Reproduction and safety controls](../../../../scripts/content-sync/README.md)

Local preservation store: `{root}`. It is ignored by Git and is not an off-host
backup. The capture is resumable by audited ID; each completed batch is durable.
Source requests stop on errors and persist a cooldown without automatic retry.
Current run status: **{(state['lastRun'] or {}).get('status', 'not_started')}**.
Recorded successful source responses: **{receipt['successfulHttpRequests']}**;
interrupted in-flight attempts are not included in that count.

The prepared index is also retained as an immutable hash-named manifest. The
index's `rawSha256` hashes the stored source file bytes and links to
`recordSha256`, the normalized file's byte hash. The normalized record's own
`rawSha256` instead hashes JavaScript `JSON.stringify(parsedSourceObject)`.
These serialization hashes intentionally differ; neither is silently substituted
for the other. See the receipt's `checksumSchemes` for the complete definitions.

**No remote WordPress mutation, DNS change, redirect activation, source deletion,
application snapshot replacement or new article publication occurred.** Public
rendered snapshots cannot restore WordPress. Final cutover still needs a complete
database/uploads/plugins/themes/configuration export, a verified isolated restore,
publishing freeze and delta reconciliation, per-URL review, and blog-host redirect
authority. Local checksums establish preservation integrity; they do not establish
editorial correctness, licensing or completed browser review for every article.
'''
    temporary = destination / f'.README-{os.getpid()}.tmp'
    temporary.write_text(summary)
    os.replace(temporary, destination / 'README.md')
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['plan', 'capture', 'media', 'verify'])
    parser.add_argument('--output', default='backups/wordpress-mirror-2026-09-13')
    parser.add_argument('--manifest', default='docs/audits/2026-09-13-consolidation/blog-inventory/request-manifest.json')
    parser.add_argument('--snapshots', default='backups/consolidation-2026-09-13/blog')
    parser.add_argument('--report', default='docs/audits/2026-09-13-migration-preservation')
    parser.add_argument('--requests', type=int, default=1)
    parser.add_argument('--batch-size', type=int, default=100)
    parser.add_argument('--interval', type=float, default=5)
    args = parser.parse_args()
    root = Path(args.output).resolve()
    if not root.is_relative_to(Path('backups').resolve()):
        parser.error('Preservation storage must stay under ignored backups/.')
    with lock(root):
        if args.command == 'plan':
            plan = build_plan(Path(args.manifest), Path(args.snapshots))
            if (root / 'plan.json').exists():
                if load_plan(root)['planSha256'] != plan['planSha256']:
                    raise ValueError('existing_plan_differs_use_new_storage_directory')
            else:
                atomic_json(root / 'plan.json', plan)
            print(json.dumps({'planned': plan['counts'], 'httpRequests': 0, 'planSha256': plan['planSha256']}))
            return
        plan = load_plan(root)
        state = load_state(root, plan)
        if args.command != 'verify':
            require_source_ready(state)
            try:
                run = (capture(root, plan, state, Reader(args.interval), args.requests, args.batch_size)
                       if args.command == 'capture' else capture_media(root, state, Reader(args.interval), args.requests))
                state['lastRun'] = {**run, 'finishedAt': now()}
                state['notBefore'] = None
            except (HaltSource, ValueError, KeyError, TypeError, AttributeError, OSError) as error:
                retry = error.retry_after if isinstance(error, HaltSource) else None
                state['notBefore'] = cooldown(retry)
                state['lastRun'] = {'finishedAt': now(), 'status': 'stopped_no_automatic_retry',
                                    'reason': str(error)[:160], 'retryAfter': retry}
            atomic_json(root / 'checkpoint.json', state)
        receipt = report(root, plan, state, Path(args.report))
        print(json.dumps(receipt, indent=2))
        if receipt['integrityFailures'] or (state['lastRun'] or {}).get('status') == 'stopped_no_automatic_retry':
            raise SystemExit(1)


if __name__ == '__main__':
    main()
