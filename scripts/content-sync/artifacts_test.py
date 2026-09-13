import copy
import json
import tempfile
import unittest
from pathlib import Path
import mirror
from update_migration_artifacts import checked_prepared, update_rows, redirect_artifact


class MigrationArtifactTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        source = {'sourceUrl': mirror.ORIGIN + '/original/', 'slug': 'original', 'type': 'post',
                  'rawSha256': 'a' * 64, 'publishedGmt': '2025-01-01T00:00:00',
                  'modifiedGmt': '2026-01-01T00:00:00', 'retrievedAt': mirror.now()}
        self.state = {'records': {'posts:42': source}}
        record = {'originalUrl': source['sourceUrl'], 'wpId': 42, 'path': '/insights/original/',
                  'status': 'migration-preview', 'html': '<p>Original preserved body.</p>'}
        record['contentSha256'] = mirror.digest(record['html'].encode())
        data = mirror.encoded(record)
        checksum = mirror.digest(data)
        self.entry = {'valid': True, 'rawSha256': source['rawSha256'], 'recordSha256': checksum,
                      'path': record['path'], 'contentSha256': record['contentSha256']}
        mirror.immutable(self.root / 'prepared/records' / f'{checksum}.json', data)
        mirror.atomic_json(self.root / 'prepared/index.json', {'records': {'posts:42': self.entry}})

    def tearDown(self):
        self.temp.cleanup()

    def test_only_verified_exact_posts_receive_unapproved_targets(self):
        prepared = checked_prepared(self.root, self.state)
        rows = [{'old_url': mirror.ORIGIN + '/original/', 'new_url': '', 'kind': 'post', 'approved': 'false'},
                {'old_url': mirror.ORIGIN + '/tag/invented/', 'new_url': 'https://insightginie.com/insights/tag/invented/',
                 'kind': 'tag', 'approved': 'false'}]
        result = update_rows(rows, self.state, prepared, {42})
        self.assertEqual(result[0]['new_url'], 'https://insightginie.com/insights/original/')
        self.assertEqual(result[0]['review_status'], 'PREVIEW_VALIDATED_CUTOVER_BLOCKED')
        self.assertEqual(result[1]['new_url'], '')
        self.assertEqual(result[1]['proposed_status'], 'REVIEW')
        self.assertTrue(all(row['approved'] == 'false' for row in result))

    def test_original_pages_are_preserved_without_invented_equivalence(self):
        state = copy.deepcopy(self.state)
        state['records']['pages:50'] = {**state['records']['posts:42'], 'sourceUrl': mirror.ORIGIN + '/about/', 'type': 'page'}
        rows = [{'old_url': mirror.ORIGIN + '/about/', 'new_url': 'https://insightginie.com/about/',
                 'kind': 'page', 'approved': 'false'}]
        result = update_rows(rows, state, checked_prepared(self.root, self.state), set())
        self.assertEqual(result[0]['review_status'], 'PRESERVED_PAGE_REVIEW')
        self.assertEqual(result[0]['new_url'], '')

    def test_tampered_prepared_copy_fails_integrity(self):
        (self.root / 'prepared/records' / f'{self.entry["recordSha256"]}.json').write_text('{}')
        with self.assertRaisesRegex(ValueError, 'checksum'):
            checked_prepared(self.root, self.state)

    def test_duplicate_counterparts_fail_instead_of_silent_overwrite(self):
        state = copy.deepcopy(self.state)
        state['records']['posts:43'] = copy.deepcopy(state['records']['posts:42'])
        entry = copy.deepcopy(self.entry)
        raw = json.loads((self.root / 'prepared/records' / f'{entry["recordSha256"]}.json').read_text())
        raw['wpId'] = 43
        data = mirror.encoded(raw)
        entry['recordSha256'] = mirror.digest(data)
        mirror.immutable(self.root / 'prepared/records' / f'{entry["recordSha256"]}.json', data)
        mirror.atomic_json(self.root / 'prepared/index.json', {'records': {'posts:42': self.entry, 'posts:43': entry}})
        with self.assertRaisesRegex(ValueError, 'duplicate_prepared_counterpart'):
            checked_prepared(self.root, state)

    def test_existing_approval_cannot_be_rewritten_by_review_tool(self):
        with self.assertRaisesRegex(ValueError, 'existing_approval'):
            update_rows([{'approved': 'true'}], self.state, {}, set())

    def test_redirect_csv_is_exact_escaped_and_inactive(self):
        import csv
        prepared = checked_prepared(self.root, self.state)
        summary = redirect_artifact(self.root, prepared, {'fullBackupVerified': False})
        with Path(summary['artifact']).open() as handle:
            rows = list(csv.reader(handle))
        aliases = [mirror.ORIGIN + '/original/', 'http://blog.insightginie.com/original/',
                   mirror.ORIGIN + '/original', 'http://blog.insightginie.com/original']
        self.assertEqual(rows, [[source, 'https://insightginie.com/insights/original/',
                                 '301', 'FALSE', 'FALSE', 'FALSE', 'FALSE'] for source in aliases])
        self.assertFalse(summary['eligibleForActivation'])
        self.assertEqual(summary['approvedRows'], 0)
        self.assertEqual(summary['rowsVerifiedAgainstNormalizedRecords'], 4)
        self.assertEqual(summary['contentDestinations'], 1)
        self.assertEqual(summary['explicitAliasRows'], 3)

    def test_redirect_csv_rejects_injected_paths(self):
        prepared = checked_prepared(self.root, self.state)
        key = next(iter(prepared))
        prepared[key][2]['path'] = '/insights/bad/\nmalicious'
        with self.assertRaisesRegex(ValueError, 'unsafe_redirect_path'):
            redirect_artifact(self.root, prepared, {})


if __name__ == '__main__':
    unittest.main()
