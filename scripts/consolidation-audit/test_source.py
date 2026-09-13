import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('audit_source',Path(__file__).with_name('source.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class AuditTests(unittest.TestCase):
 def test_host_boundary(self):
  self.assertIsNone(module.normalize('https://evil.example/x','https://insightginie.com/'))
  self.assertIsNone(module.normalize('https://user:secret@insightginie.com/','https://insightginie.com/'))
  self.assertEqual(module.normalize('/x/?page=2#top','https://blog.insightginie.com/'),'https://blog.insightginie.com/x/?page=2')
 def test_source_measurements_are_not_rendered_claims(self):
  r=module.extract(b'<html lang="en-US"><head><title>Example</title><meta name="robots" content="noindex"><link rel="canonical" href="https://insightginie.com/example/"><script type="application/ld+json">{"@type":"Article"}</script></head><body><article><h1>A heading</h1><p>Two words</p><img src="/photo.png" width="400"><a href="/about/">About</a></article></body></html>','https://insightginie.com/example/')
  self.assertEqual(r['title'],['Example']);self.assertEqual(r['h1'],['A heading'])
  self.assertEqual(r['robots_meta'],['noindex']);self.assertEqual(r['schema_types'],['Article'])
  self.assertEqual(r['internal_outlinks'],['https://insightginie.com/about/'])
  self.assertEqual(r['static_accessibility']['images_without_alt'],1)
  self.assertEqual(r['rendered']['status'],'NOT_MEASURED')
  self.assertIsNone(r['images'][0]['naturalWidth'])
 def test_duplicate_hash_ignores_script_payloads(self):
  a=module.extract(b'<html><body><main><h1>Article</h1><script>secret1</script><p>Body here.</p></main></body></html>','https://insightginie.com/')
  b=module.extract(b'<html><body><main><h1>Article</h1><script>secret2</script><p>Body  here.</p></main></body></html>','https://insightginie.com/')
  self.assertEqual(a['content_sha256'],b['content_sha256'])
 def test_invalid_schema_is_not_validated(self):
  r=module.extract(b'<html><script type="application/ld+json">bad</script><body>Body</body></html>','https://insightginie.com/')
  self.assertEqual(r['schema'],[]);self.assertEqual(r['schema_errors'],['JSONDecodeError'])

class RateLimitTests(unittest.TestCase):
 def test_no_more_requests_to_rate_limited_host(self):
  from unittest.mock import patch
  module.STOPPED_HOSTS.add('blog.insightginie.com')
  try:
   with patch.object(module.requests,'get') as request:
    result=module.fetch('https://blog.insightginie.com/example/',Path('/unused'))
    request.assert_not_called()
   self.assertEqual(result['error'],'host_paused_after_429')
   self.assertIsNone(result['status'])
  finally:module.STOPPED_HOSTS.clear()

if __name__=='__main__':unittest.main()
