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
