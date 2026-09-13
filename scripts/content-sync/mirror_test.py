"""Offline preservation safety tests; no live WordPress calls."""
import copy
import gzip
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock
from datetime import datetime, timedelta, timezone
import mirror


def source(post_id=42, kind='posts'):
    return {'id': post_id, 'type': kind[:-1], 'status': 'publish', 'slug': f'original-{post_id}',
            'link': f'{mirror.ORIGIN}/original-{post_id}/', 'author': 1,
            'date_gmt': '2025-04-01T12:00:00', 'modified_gmt': '2026-03-01T12:00:00',
            'title': {'rendered': 'Original &amp; title'},
            'content': {'rendered': '<p>Original source body <img src="/wp-content/uploads/2025/chart.png" alt="Original chart"></p>', 'protected': False},
            '_embedded': {'author': [{'id': 1, 'name': 'Original Author'}]}}


def plan_for(raws):
    entities = [{'key': f'{raw["type"]}s:{raw["id"]}', 'id': raw['id'], 'kind': raw['type'] + 's',
                 'sourceUrl': raw['link'], 'slug': raw['slug'], 'modifiedGmt': raw['modified_gmt']}
                for raw in raws]
    return {'version': mirror.VERSION, 'sourceOrigin': mirror.ORIGIN,
            'planSha256': mirror.digest(mirror.encoded(entities)), 'entities': entities,
            'counts': {'posts': sum(r['type'] == 'post' for r in raws), 'pages': sum(r['type'] == 'page' for r in raws)}}


class FakeReader:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def get(self, endpoint, cap, json_response=False):
        self.calls.append((endpoint, cap, json_response))
        value = self.responses.pop(0)
        if isinstance(value, Exception):
            raise value
        data = mirror.encoded(value)
        return data, {'url': endpoint, 'sha256': mirror.digest(data), 'status': 200,
                      'retrievedAt': mirror.now(), 'contentType': 'application/json', 'bytes': len(data)}


class MirrorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.raw = source()
        self.plan = plan_for([self.raw])
        self.state = mirror.load_state(self.root, self.plan)

    def tearDown(self):
        self.temp.cleanup()

    def test_capture_preserves_exact_source_author_dates_and_resumes_without_requests(self):
        reader = FakeReader([[self.raw]])
        result = mirror.capture(self.root, self.plan, self.state, reader)
        self.assertEqual(result['preservedThisRun'], 1)
        record = self.state['records']['posts:42']
        self.assertEqual(json.loads(mirror.object_path(self.root, record['rawSha256']).read_bytes()), self.raw)
        self.assertEqual(record['author']['name'], 'Original Author')
        self.assertEqual(record['publishedGmt'], self.raw['date_gmt'])
        self.assertIn('include=42', reader.calls[0][0])
        self.assertEqual(mirror.verify(self.root, self.plan, self.state), [])
        no_network = FakeReader([])
        mirror.capture(self.root, self.plan, self.state, no_network)
        self.assertEqual(no_network.calls, [])
        self.assertFalse((self.root / 'last-good.json').exists())

    def test_pages_are_preserved_without_converting_them_to_posts(self):
        page = source(kind='pages')
        plan = plan_for([page])
        state = mirror.load_state(self.root, plan)
        mirror.capture(self.root, plan, state, FakeReader([[page]]))
        self.assertEqual(state['records']['pages:42']['type'], 'page')
        self.assertEqual(mirror.verify(self.root, plan, state), [])

    def test_rate_limit_stops_without_retry_and_retains_completed_checkpoint(self):
        second = source(43)
        plan = plan_for([self.raw, second])
        state = mirror.load_state(self.root, plan)
        reader = FakeReader([[self.raw], mirror.HaltSource('http_429', '900')])
        with self.assertRaises(mirror.HaltSource):
            mirror.capture(self.root, plan, state, reader, request_limit=2, batch_size=1)
        self.assertEqual(len(reader.calls), 2)
        self.assertEqual(len(json.loads((self.root / 'checkpoint.json').read_text())['records']), 1)
        self.assertGreaterEqual(datetime.fromisoformat(mirror.cooldown('900')),
                                datetime.now(timezone.utc) + timedelta(seconds=899))

    def test_persisted_cooldown_blocks_a_new_invocation(self):
        state = {**self.state, 'notBefore': mirror.cooldown('900')}
        mirror.atomic_json(self.root / 'checkpoint.json', state)
        persisted = mirror.load_state(self.root, self.plan)
        with self.assertRaisesRegex(ValueError, 'source_cooldown_active_no_request_made'):
            mirror.require_source_ready(persisted)
        self.assertGreaterEqual(datetime.fromisoformat(mirror.cooldown('not-a-date')),
                                datetime.now(timezone.utc) + timedelta(seconds=299))
        state['notBefore'] = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()
        mirror.require_source_ready(state)

    def test_missing_duplicate_or_protected_source_never_marks_record_complete(self):
        for payload in [[], [self.raw, self.raw], [{**self.raw, 'status': 'draft'}]]:
            with self.subTest(payload=len(payload)):
                state = mirror.load_state(self.root, self.plan)
                with self.assertRaises(ValueError):
                    mirror.capture(self.root, self.plan, state, FakeReader([payload]))
                self.assertEqual(state['records'], {})

    def test_source_host_author_and_identity_are_required(self):
        for field, value in [('link', 'https://example.com/other/'), ('id', 7), ('_embedded', {})]:
            raw = {**self.raw, field: value}
            with self.assertRaises(ValueError):
                mirror.validate_source(raw, self.plan['entities'][0])

    def test_assets_include_captions_body_variants_and_reject_external_or_traversal(self):
        raw = copy.deepcopy(self.raw)
        raw['content']['rendered'] += '<img srcset="/wp-content/uploads/small.png 320w, /wp-content/uploads/large.png 900w"><img src="https://evil.invalid/a.png"><img src="/wp-content/uploads/%2e%2e/private.png">'
        raw['_embedded']['wp:featuredmedia'] = [{'source_url': mirror.ORIGIN + '/wp-content/uploads/feature.png',
            'caption': {'rendered': '<p>Caption preserved in raw</p>'},
            'media_details': {'sizes': {'small': {'source_url': mirror.ORIGIN + '/wp-content/uploads/feature-small.png'}}}}]
        self.assertEqual(len(mirror.assets_from(raw)), 5)
        for url in mirror.assets_from(raw):
            self.assertTrue(url.startswith(mirror.ORIGIN + '/wp-content/uploads/'))
        self.assertIsNone(mirror.upload_url('http://127.0.0.1/wp-content/uploads/a.png'))

    def test_raw_corruption_fails_verification(self):
        mirror.capture(self.root, self.plan, self.state, FakeReader([[self.raw]]))
        path = mirror.object_path(self.root, self.state['records']['posts:42']['rawSha256'])
        path.write_text('{}')
        self.assertEqual(mirror.verify(self.root, self.plan, self.state)[0]['reason'], 'raw_checksum_mismatch')

    def test_response_receipt_corruption_also_fails_verification(self):
        mirror.capture(self.root, self.plan, self.state, FakeReader([[self.raw]]))
        receipt = self.state['requests'][0]
        mirror.object_path(self.root, receipt['sha256'], 'response').write_bytes(b'[]')
        self.assertEqual(mirror.verify(self.root, self.plan, self.state)[0]['reason'], 'response_checksum_mismatch')

    def test_report_archives_exact_manifest_and_distinguishes_checksum_schemes(self):
        mirror.capture(self.root, self.plan, self.state, FakeReader([[self.raw]]))
        index = self.root / 'prepared/index.json'
        mirror.atomic_json(index, {'transformationVersion': 'wordpress-public-v2', 'records': {}})
        original = index.read_bytes()
        receipt = mirror.report(self.root, self.plan, self.state, self.root / 'report')
        manifest = Path(receipt['preparedImmutableManifest'])
        self.assertEqual(manifest.read_bytes(), original)
        self.assertEqual(receipt['preparedIndexSha256'], mirror.digest(original))
        self.assertIn('file bytes', receipt['checksumSchemes']['checkpoint.records.rawSha256'])
        self.assertIn('JSON.stringify', receipt['checksumSchemes']['ContentRecord.rawSha256'])
        mirror.atomic_json(index, {'transformationVersion': 'wordpress-public-v2', 'records': {}, 'next': True})
        next_receipt = mirror.report(self.root, self.plan, self.state, self.root / 'report')
        self.assertNotEqual(receipt['preparedIndexSha256'], next_receipt['preparedIndexSha256'])
        self.assertEqual(manifest.read_bytes(), original)

    def test_plan_reuses_only_checksummed_audit_metadata(self):
        metadata = [{key: self.raw[key] for key in ['id', 'slug', 'link', 'title', 'modified_gmt']}]
        data = mirror.encoded(metadata)
        (self.root / 'sample.gz').write_bytes(gzip.compress(data))
        manifest = [{'url': mirror.ORIGIN + '/wp-json/wp/v2/posts?per_page=100', 'status': 200,
                     'snapshot_file': 'sample.gz', 'sha256': mirror.digest(data)}]
        mirror.atomic_json(self.root / 'manifest.json', manifest)
        self.assertEqual(mirror.build_plan(self.root / 'manifest.json', self.root)['counts']['posts'], 1)
        (self.root / 'sample.gz').write_bytes(gzip.compress(b'[]'))
        with self.assertRaisesRegex(ValueError, 'checksum'):
            mirror.build_plan(self.root / 'manifest.json', self.root)

    def test_reader_rejects_untrusted_hosts_oversized_and_non_json_before_preservation(self):
        opener = mock.Mock()
        reader = mirror.Reader(opener=opener)
        with self.assertRaises(ValueError):
            reader.get('https://evil.invalid/wp-json/wp/v2/posts', 100, True)
        opener.open.assert_not_called()
        for headers, expected in [({'Content-Type': 'text/html'}, 'content_type'),
                                  ({'Content-Type': 'application/json', 'Content-Length': '200'}, 'byte_limit')]:
            response = mock.MagicMock()
            response.__enter__.return_value = response
            response.status = 200
            response.headers = headers
            response.read.return_value = b'[]'
            opener.open.return_value = response
            reader.last = 0
            with self.assertRaisesRegex(mirror.HaltSource, expected):
                reader.get(mirror.ORIGIN + '/wp-json/wp/v2/posts', 100, True)
        with self.assertRaisesRegex(mirror.HaltSource, 'redirect'):
            mirror.NoRedirect().redirect_request(None, None, 302, None, {}, 'https://evil.invalid/')

    def test_exclusive_lock_and_immutable_objects(self):
        with mirror.lock(self.root):
            with self.assertRaises(FileExistsError):
                with mirror.lock(self.root):
                    pass
        self.assertFalse((self.root / '.mirror.lock').exists())
        path = self.root / 'object'
        mirror.immutable(path, b'one')
        mirror.immutable(path, b'one')
        with self.assertRaises(ValueError):
            mirror.immutable(path, b'two')


if __name__ == '__main__':
    unittest.main()
