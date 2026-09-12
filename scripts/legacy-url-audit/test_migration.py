"""Migration protection tests: an incorrect redirect/410 can destroy useful URLs."""
import unittest
from crawl import normalize_url, provisional_classification
from validate import validate

ORIGIN = "https://insightginie.com"


def reviewed_row(**overrides):
    return {
        "url": ORIGIN + "/legacy/", "proposed_action": "REDIRECT",
        "target_url": ORIGIN + "/equivalent/", "approved": "true", "review_status": "APPROVED",
        "approved_by": "migration-owner", "approved_at": "2026-09-12T00:00:00+00:00",
        "evidence_reference": "review/legacy.md", "backup_manifest": "verified-backup-manifest.json",
        "equivalence_evidence": "Reviewed both pages; identical entity, intent and relevant information.",
        **overrides,
    }


class MigrationTests(unittest.TestCase):
    def test_all_unreviewed_decisions_fail_enforcement_gate(self):
        row = reviewed_row(approved="false", review_status="PENDING_EVIDENCE_REVIEW")
        self.assertFalse(validate([row], require_approved=True)["valid"])

    def test_equivalent_reviewed_redirect_valid(self):
        self.assertTrue(validate([reviewed_row()], require_approved=True)["valid"])

    def test_partial_approval_does_not_authorize_whole_map(self):
        unreviewed = reviewed_row(url=ORIGIN + "/another/", approved="false", review_status="PENDING_EVIDENCE_REVIEW")
        self.assertFalse(validate([reviewed_row(), unreviewed], require_approved=True)["valid"])

    def test_homepage_redirect_refused(self):
        self.assertFalse(validate([reviewed_row(target_url=ORIGIN + "/")])["valid"])

    def test_missing_equivalence_refused(self):
        self.assertFalse(validate([reviewed_row(equivalence_evidence="")])["valid"])

    def test_missing_backup_refused(self):
        self.assertFalse(validate([reviewed_row(backup_manifest="")])["valid"])

    def test_self_redirect_refused(self):
        self.assertFalse(validate([reviewed_row(target_url=ORIGIN + "/legacy/")])["valid"])

    def test_duplicate_source_refused(self):
        self.assertFalse(validate([reviewed_row(), reviewed_row()])["valid"])

    def test_redirect_cycle_and_chain_refused(self):
        other = reviewed_row(url=ORIGIN + "/equivalent/", target_url=ORIGIN + "/legacy/")
        self.assertFalse(validate([reviewed_row(), other])["valid"])

    def test_redirect_to_retired_page_refused(self):
        other = reviewed_row(url=ORIGIN + "/equivalent/", proposed_action="410", target_url="")
        self.assertFalse(validate([reviewed_row(), other])["valid"])

    def test_offsite_redirect_refused(self):
        self.assertFalse(validate([reviewed_row(target_url="https://example.com/equivalent/")])["valid"])

    def test_noncanonical_port_refused(self):
        self.assertFalse(validate([reviewed_row(target_url="https://insightginie.com:8443/equivalent/")])["valid"])

    def test_malformed_urls_report_errors(self):
        self.assertFalse(validate([reviewed_row(url="https://[invalid/")])["valid"])
        self.assertFalse(validate([reviewed_row(target_url="https://[invalid/")])["valid"])

    def test_url_boundaries(self):
        self.assertEqual(normalize_url("/post/#section", ORIGIN), ORIGIN + "/post/")
        self.assertEqual(normalize_url("/?p=123", ORIGIN), ORIGIN + "/?p=123")
        self.assertIsNone(normalize_url("https://evil.example/post/", ORIGIN))
        self.assertIsNone(normalize_url("https://secret@insightginie.com/post/", ORIGIN))
        self.assertIsNone(normalize_url("javascript:alert(1)", ORIGIN))
        self.assertIsNone(normalize_url("https://[invalid/", ORIGIN))
        self.assertIsNone(normalize_url("https://insightginie.com:broken/", ORIGIN))

    def test_classification_never_invents_redirects(self):
        self.assertEqual(provisional_classification(ORIGIN + "/", "homepage")[0], "KEEP")
        self.assertEqual(provisional_classification(ORIGIN + "/about/", "page")[0], "KEEP")
        self.assertEqual(provisional_classification(ORIGIN + "/unrelated-ai-post/", "post")[0], "410")


if __name__ == "__main__":
    unittest.main()
