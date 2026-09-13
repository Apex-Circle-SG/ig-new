import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('promote', Path(__file__).with_name('promote.py'))
promote = importlib.util.module_from_spec(spec)
spec.loader.exec_module(promote)


class ReleaseBoundaries(unittest.TestCase):
    def test_public_provider_copy_is_opt_in_and_allowlisted(self):
        local = {'ASK_DATADOG_ENABLED': 'true', 'DD_API_KEY': 'a' * 32,
                 'DD_APP_KEY': 'b' * 40, 'DD_REGION': 'AP1',
                 'DD_AGENT_ID': '11111111-1111-4111-8111-111111111111',
                 'DD_BITS_WORKFLOW_ID': '22222222-2222-4222-8222-222222222222',
                 'GH_PAT': 'must-not-copy', 'CMS_PASSWORD': 'must-not-copy'}
        runtime = {}
        promote.configure_ask_datadog(runtime, local)
        self.assertEqual(runtime['ASK_DATADOG_ENABLED'], 'true')
        self.assertEqual(runtime['ASK_DATADOG_MAX_MONTHLY_RUNS'], '120')
        self.assertNotIn('GH_PAT', runtime)
        self.assertNotIn('CMS_PASSWORD', runtime)
        local['DD_REGION'] = 'ap1.datadoghq.com'
        promote.configure_ask_datadog(runtime, local)
        self.assertEqual(runtime['DD_REGION'], 'ap1.datadoghq.com')
        with self.assertRaises(RuntimeError):
            promote.configure_ask_datadog({}, {**local, 'DD_REGION': 'datadoghq.com.attacker.test'})
        promote.configure_ask_datadog(runtime, {})
        self.assertEqual(runtime['ASK_DATADOG_ENABLED'], 'false')
        self.assertNotIn('DD_API_KEY', runtime)
        self.assertNotIn('DD_APP_KEY', runtime)

    def test_public_provider_invalid_credentials_do_not_activate(self):
        with self.assertRaises(RuntimeError):
            promote.configure_ask_datadog({}, {'ASK_DATADOG_ENABLED': 'true'})

    def test_general_provider_requires_review_bound_to_the_current_agent(self):
        local = {'ASK_DATADOG_ENABLED': 'true', 'DD_API_KEY': 'a' * 32,
                 'DD_APP_KEY': 'b' * 40, 'DD_REGION': 'AP1',
                 'DD_AGENT_ID': '11111111-1111-4111-8111-111111111111',
                 'DD_BITS_WORKFLOW_ID': '22222222-2222-4222-8222-222222222222'}
        runtime = {}
        promote.configure_ask_datadog(runtime, local)
        self.assertEqual(runtime['ASK_DATADOG_GENERAL_ENABLED'], 'false')
        for reviewed in [None, local['DD_BITS_WORKFLOW_ID']]:
            with self.assertRaises(RuntimeError):
                promote.configure_ask_datadog({}, {**local, 'ASK_DATADOG_GENERAL_ENABLED': 'true',
                                                  'ASK_DATADOG_TOOL_FREE_AGENT_ID': reviewed})
        promote.configure_ask_datadog(runtime, {**local, 'ASK_DATADOG_GENERAL_ENABLED': 'true',
                                              'ASK_DATADOG_TOOL_FREE_AGENT_ID': local['DD_AGENT_ID']})
        self.assertEqual(runtime['ASK_DATADOG_GENERAL_ENABLED'], 'true')
        promote.configure_ask_datadog(runtime, local)
        self.assertEqual(runtime['ASK_DATADOG_GENERAL_ENABLED'], 'false')
        self.assertNotIn('ASK_DATADOG_TOOL_FREE_AGENT_ID', runtime)

    def test_environment_values_roundtrip_with_private_permissions(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'runtime.env'
            values = {'ADMIN_ACCESS_KEY': 'test-only generated value', 'APP_SITE_ORIGIN': 'https://insightginie.com'}
            promote.write_env(path, values)
            self.assertEqual(promote.env_values(path), values)
            self.assertEqual(os.stat(path).st_mode & 0o777, 0o600)
            self.assertEqual(list(Path(directory).iterdir()), [path])

    def test_newline_injection_cannot_replace_runtime_configuration(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'runtime.env'
            path.write_text('APP_SITE_ORIGIN=https://insightginie.com\n')
            with self.assertRaises(ValueError):
                promote.write_env(path, {'ADMIN_ACCESS_KEY': 'test\nANOTHER_KEY=injected'})
            self.assertEqual(promote.env_values(path), {'APP_SITE_ORIGIN': 'https://insightginie.com'})

    def test_only_the_exact_accepted_build_can_be_promoted(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            candidate = root / 'candidate'
            candidate.mkdir()
            (candidate / 'BUILD_ID').write_text('candidate-a')
            (root / 'artifacts').mkdir()
            receipt = root / 'artifacts/candidate-acceptance.json'
            with patch.object(promote, 'ROOT', root), patch.object(promote, 'CANDIDATE', candidate):
                for evidence in [{'buildId': 'candidate-b', 'status': 'passed'}, {'buildId': 'candidate-a', 'status': 'failed'}]:
                    receipt.write_text(json.dumps(evidence))
                    with self.assertRaises(RuntimeError):
                        promote.verify_candidate()
                receipt.write_text(json.dumps({'buildId': 'candidate-a', 'status': 'passed'}))
                self.assertEqual(promote.verify_candidate(), 'candidate-a')


if __name__ == '__main__':
    unittest.main()
