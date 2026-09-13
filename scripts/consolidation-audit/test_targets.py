import unittest
from validate import validate_map_rows


def row(source='https://blog.insightginie.com/article/', target='https://insightginie.com/insights/article/', status='301'):
    return {'old_url': source, 'new_url': target, 'proposed_status': status, 'approved': 'false'}


class CandidateTargetTests(unittest.TestCase):
    def test_exact_candidates_working_keep_and_unmapped_review(self):
        validate_map_rows([row(), row('https://insightginie.com/', 'https://insightginie.com/', 'KEEP'),
                           row('https://blog.insightginie.com/tag/unmapped/', '', 'REVIEW')])

    def test_reviews_cannot_invent_destinations_and_redirects_need_targets(self):
        for sample in [row(status='REVIEW'), row(target=''), row(status='410'), row(target='https://evil.invalid/')]:
            with self.assertRaises(AssertionError):
                validate_map_rows([sample])

    def test_no_approval_homepage_redirects_or_chains(self):
        for rows in [[{**row(), 'approved': 'true'}], [row(target='https://insightginie.com/')],
                     [row(), row('https://insightginie.com/insights/article/', 'https://insightginie.com/insights/other/')]]:
            with self.assertRaises(AssertionError):
                validate_map_rows(rows)

    def test_no_duplicate_source_or_wrong_host_credentials(self):
        for rows in [[row(), row()], [row(target='https://insightginie.com.evil.invalid/a/')],
                     [row(target='https://user@insightginie.com/a/')]]:
            with self.assertRaises(AssertionError):
                validate_map_rows(rows)


if __name__ == '__main__':
    unittest.main()
