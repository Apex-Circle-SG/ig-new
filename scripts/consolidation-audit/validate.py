"""Read-only consistency checks for the Phase 1 audit artifacts."""
import csv,gzip,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/audits/2026-09-13-consolidation'
with (ROOT/'MIGRATION_MAP.csv').open() as f: rows=list(csv.DictReader(f))
urls=[r['old_url'] for r in rows]
assert len(set(urls))==len(urls), 'Duplicate source URLs'
with gzip.open(OUT/'blog-inventory/url-inventory.csv.gz','rt') as f:known={r['url'] for r in csv.DictReader(f)}
assert known<=set(urls), 'Discovered URL missing from map'
assert all(r['approved']=='false' for r in rows), 'Inspection phase must not approve publishing'
assert all(r['new_url'].startswith('https://insightginie.com/') for r in rows), 'Wrong canonical host'
assert not any(r['new_url']=='https://insightginie.com/' for r in rows if r['old_url'].startswith('https://blog.')), 'Blanket homepage destination'
redirects={r['old_url']:r['new_url'] for r in rows if r['proposed_status']!='KEEP'}
assert not any(target in redirects for target in redirects.values()), 'Redirect chain in candidate map'
count=0;seen=set()
for file in sorted(OUT.glob('url-records-*.jsonl.gz')):
 with gzip.open(file,'rt') as f:
  for line in f:
   r=json.loads(line);count+=1
   assert r['url'] not in seen,'Duplicate audit URL';seen.add(r['url'])
   assert all(k in r for k in ['url','status','canonical','robots_meta','title','description','h1','schema','language','word_count','content_sha256','images','sitemap_membership','rendered_status']), 'Missing required evidence field'
assert known<=seen,'Missing URL evidence record'
summary=json.loads((ROOT/'SEO_AUDIT.json').read_text())
assert summary['coverage']['total_url_records']==count
assert summary['phase1_complete'] is False
assert summary['migration']['approved_redirects']==0
print(f'Validated {len(rows)} inactive map rows and {count} explicitly scoped URL records.')
