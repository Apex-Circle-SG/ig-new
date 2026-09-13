"""Project the verified offline mirror into inactive migration review artifacts."""
import argparse
import csv
import io
import json
import os
import re
from pathlib import Path
import mirror


def checked_prepared(root, state):
    data = json.loads((root / 'prepared/index.json').read_text())
    records = {}
    paths = set()
    for key, entry in data['records'].items():
        if not entry.get('valid'):
            continue
        source = state['records'][key]
        if entry['rawSha256'] != source['rawSha256']:
            raise ValueError('prepared_source_changed')
        checksum = entry['recordSha256']
        if not re.fullmatch('[a-f0-9]{64}', checksum):
            raise ValueError('invalid_prepared_checksum')
        raw = (root / 'prepared/records' / f'{checksum}.json').read_bytes()
        if mirror.digest(raw) != checksum:
            raise ValueError('prepared_record_checksum_failed')
        record = json.loads(raw)
        if (not key.startswith('posts:') or source['type'] != 'post'
                or record['originalUrl'] != source['sourceUrl'] or record['wpId'] != int(key.split(':')[1])
                or record['path'] != f'/insights/{source["slug"]}/'
                or entry['path'] != record['path'] or record['status'] != 'migration-preview'
                or mirror.digest(record['html'].encode()) != record['contentSha256']
                or entry['contentSha256'] != record['contentSha256']):
            raise ValueError('prepared_counterpart_mismatch')
        if source['sourceUrl'] in records or record['path'] in paths:
            raise ValueError('duplicate_prepared_counterpart')
        records[source['sourceUrl']] = (key, entry, record)
        paths.add(record['path'])
    return records


def update_rows(rows, state, prepared, live_ids):
    by_url = {record['sourceUrl']: record for record in state['records'].values()}
    for row in rows:
        if row['approved'] != 'false':
            raise ValueError('existing_approval_requires_separate_release_review')
        row.update(preservation_status='NOT_CONTENT_RECORD', raw_sha256='',
                   normalized_record_sha256='', source_published_gmt='', source_modified_gmt='',
                   captured_at='', evidence='')
        if row['kind'] == 'main-route':
            continue
        source_url = row['old_url']
        if row['kind'] == 'linked-main-legacy-article':
            source_url = source_url.replace('https://insightginie.com/', mirror.ORIGIN + '/', 1)
        source = by_url.get(source_url)
        if source:
            row.update(preservation_status='PUBLIC_BODY_PRESERVED', raw_sha256=source['rawSha256'],
                       source_published_gmt=source['publishedGmt'], source_modified_gmt=source['modifiedGmt'],
                       captured_at=source['retrievedAt'],
                       evidence='docs/audits/2026-09-13-migration-preservation/preservation-receipt.json')
        if source_url in prepared:
            key, entry, record = prepared[source_url]
            row.update(new_url='https://insightginie.com' + record['path'], proposed_status='301',
                       target_indexing='noindex_source_canonical_until_approved_cutover',
                       normalized_record_sha256=entry['recordSha256'],
                       review_status=('PREVIEW_VALIDATED_CUTOVER_BLOCKED' if int(key.split(':')[1]) in live_ids
                                      else 'PRESERVED_NORMALIZED_CUTOVER_BLOCKED'),
                       reason='Original public body/byline/dates/media metadata preserved; exact article copy normalized offline. No publishing/redirect approval; complete backup, media, restore and per-URL review still required.')
        else:
            row.update(new_url='', proposed_status='REVIEW', target_indexing='review_required',
                       review_status='PRESERVED_PAGE_REVIEW' if source else 'NO_VERIFIED_EQUIVALENT',
                       reason=('Original public page preserved with byline/dates. Page template, overlap and content review must establish a genuine replacement.'
                               if source and source['type'] == 'page' else
                               'Retain source while reviewing content/entity equivalence; no replacement target or retirement is inferred.'))
            if source and source['type'] == 'post':
                row.update(review_status='PRESERVED_NORMALIZATION_REVIEW',
                           reason='Original public article preserved; normalization needs review before proposing an exact replacement.')
    return rows


def redirect_artifact(root, prepared, gate):
    """Cloudflare-compatible CSV, deliberately outside live configuration."""
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL, lineterminator='\n')
    bindings = []
    for source, (_, entry, record) in sorted(prepared.items()):
        mirror.safe_source(source)
        if (not re.fullmatch(r'/insights/(?:[a-z0-9]|%[a-f0-9]{2})[a-z0-9_%\-]*/', record['path'])
                or entry['path'] != record['path']):
            raise ValueError('unsafe_redirect_path')
        target = 'https://insightginie.com' + record['path']
        aliases = [source, source.replace('https://', 'http://', 1),
                   source[:-1], source.replace('https://', 'http://', 1)[:-1]]
        for alias in aliases:
            binding = [alias, target, '301', 'FALSE', 'FALSE', 'FALSE', 'FALSE']
            bindings.append(binding)
            writer.writerow(binding)
    text = output.getvalue()
    if list(csv.reader(io.StringIO(text))) != bindings:
        raise ValueError('redirect_csv_roundtrip_failed')
    if len({row[0] for row in bindings}) != len(bindings):
        raise ValueError('duplicate_redirect_sources')
    path = root / 'prepared/cloudflare-bulk-redirects.review-only.csv'
    temporary = path.with_name(f'.redirects-{os.getpid()}.tmp')
    temporary.write_text(text)
    os.replace(temporary, path)
    summary = {
        'format': 'Cloudflare Bulk Redirects CSV (no header, all seven columns explicit)',
        'documentation': 'https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/reference/csv-file-format/',
        'status': 'REVIEW_ONLY_DO_NOT_IMPORT', 'artifact': str(path), 'sha256': mirror.digest(text.encode()),
        'rows': len(bindings), 'contentDestinations': len(prepared),
        'canonicalSourceRows': len(prepared), 'explicitAliasRows': len(bindings) - len(prepared),
        'aliases': 'Explicit HTTP/HTTPS and trailing-slash/slashless variants; no wildcard matching.',
        'rowsVerifiedAgainstNormalizedRecords': len(bindings),
        'includeSubdomains': False, 'subpathMatching': False, 'preservePathSuffix': False,
        'preserveQueryString': False, 'statusCode': 301, 'sourceOrigin': mirror.ORIGIN,
        'targetOrigin': 'https://insightginie.com', 'eligibleForActivation': False,
        'approvedRows': 0, 'liveTargetChecksPerformed': 0, 'uploadedToCloudflare': False,
        'edgeOrderingVerified': False, 'accountBulkRedirectQuotaVerified': False,
        'fullBackupVerified': bool(gate.get('fullBackupVerified')),
        'restoreTestVerified': bool(gate.get('restoreTestVerified')),
        'requiredBeforeActivation': [
            'Complete restorable hosting backup, uploads mirror and isolated restore verification',
            'Per-record editorial and cutover approvals tied to the actual content hashes',
            'Every target deployed with verified 200, correct canonical and approved indexing state',
            'Scoped blog-host redirect authority, account capacity check and explicit activation review',
            'Cloudflare edge trace of HTTP/HTTPS and both slash forms to prevent HTTPS/slash normalization before the direct redirect',
        ],
    }
    mirror.atomic_json(root / 'prepared/redirect-review.json', summary)
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mirror', default='backups/wordpress-mirror-2026-09-13')
    parser.add_argument('--map', default='MIGRATION_MAP.csv')
    parser.add_argument('--audit', default='SEO_AUDIT.json')
    args = parser.parse_args()
    root = Path(args.mirror)
    plan = mirror.load_plan(root)
    state = mirror.load_state(root, plan)
    if mirror.verify(root, plan, state):
        raise ValueError('mirror_integrity_failed_no_artifact_update')
    prepared = checked_prepared(root, state)
    gate = json.loads(Path('content/wordpress/cutover-gate.json').read_text())
    redirect_review = redirect_artifact(root, prepared, gate)
    live = json.loads(Path('content/wordpress/last-good.json').read_text())
    live_ids = {record['wpId'] for record in live['records']}
    target = Path(args.map)
    with target.open() as handle:
        rows = list(csv.DictReader(handle))
    updated = update_rows(rows, state, prepared, live_ids)
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(updated[0]), lineterminator='\n')
    writer.writeheader()
    writer.writerows(updated)
    temporary = target.with_name(f'.{target.name}-{os.getpid()}.tmp')
    temporary.write_text(output.getvalue())
    os.replace(temporary, target)
    receipt_path = Path('docs/audits/2026-09-13-migration-preservation/preservation-receipt.json')
    receipt = json.loads(receipt_path.read_text())
    receipt['redirectReview'] = redirect_review
    prepared_index = json.loads((root / 'prepared/index.json').read_text())
    receipt['preparedTransformationVersion'] = prepared_index.get('transformationVersion')
    receipt['normalizationSourceHashes'] = prepared_index.get('normalizationSourceHashes')
    totals_path = receipt_path.parent / 'public-totals-check.json'
    if totals_path.exists():
        receipt['freshPublicTotalsCheck'] = json.loads(totals_path.read_text())
    mirror.atomic_json(receipt_path, receipt)
    mirror.atomic_json(receipt_path.parent / 'redirect-review.json', redirect_review)
    audit_path = Path(args.audit)
    audit = json.loads(audit_path.read_text())
    audit['generated_at'] = mirror.now()
    audit['coverage']['public_content_preservation'] = {
        'posts': receipt['preserved']['posts'], 'pages': receipt['preserved']['pages'],
        'scope': 'Audited public REST bodies; separate from incomplete rendered-URL crawl.',
        'receipt': str(receipt_path),
    }
    audit['migration'].update(rows=len(updated), approved_redirects=0, deployed_redirects=0,
        exact_normalized_article_candidates=len(prepared),
        preserved_public_posts=receipt['preserved']['posts'], preserved_public_pages=receipt['preserved']['pages'],
        review_without_target=sum(row['proposed_status'] == 'REVIEW' for row in updated),
        note='Exact article candidates are staged outside the application. All dispositions remain unapproved; no speculative taxonomy/archive/page destinations. Full backup, media, restore, editorial and redirect authority remain required.')
    audit['implementation'].update(wordpress_previews=len(live_ids),
        wordpress_mirrored_posts=receipt['preserved']['posts'], wordpress_mirrored_pages=receipt['preserved']['pages'],
        wordpress_normalized_candidates=len(prepared), wordpress_redirects_activated=0)
    audit['migration_preservation'] = receipt
    audit['blocked_acceptance'] = [
        'Restorable WordPress backup, complete uploads export and isolated restore verification'
        if item == 'Restorable WordPress backup and headless sync' else item
        for item in audit['blocked_acceptance']]
    if str(receipt_path) not in audit['implementation_reports']:
        audit['implementation_reports'].append(str(receipt_path))
    mirror.atomic_json(audit_path, audit)
    print(json.dumps({'rows': len(updated), 'normalizedArticleCandidates': len(prepared),
                      'reviewWithoutTarget': audit['migration']['review_without_target'],
                      'approved': 0, 'published': 0, 'livePreviews': len(live_ids)}))


if __name__ == '__main__':
    main()
