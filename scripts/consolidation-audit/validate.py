"""Read-only consistency checks for the Phase 1 audit artifacts."""
import csv,gzip,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/audits/2026-09-13-consolidation'
def validate_map_rows(rows):
 urls=[r['old_url'] for r in rows]
 assert len(set(urls))==len(urls), 'Duplicate source URLs'
 assert all(r['approved']=='false' for r in rows), 'Review artifacts cannot approve publishing'
 for row in rows:
  status,target=row['proposed_status'],row['new_url']
  assert status in ('301','KEEP','REVIEW'), 'Unknown candidate disposition'
  if status=='REVIEW':
   assert not target, 'Unverified equivalence must not invent a target'
   continue
  from urllib.parse import urlsplit
  url=urlsplit(target)
  assert url.scheme=='https' and url.netloc=='insightginie.com' and not url.username and not url.password and not url.fragment, 'Wrong canonical target'
  assert not (target=='https://insightginie.com/' and row['old_url'].startswith('https://blog.')), 'Blanket homepage destination'
  if status=='KEEP':
   assert row['old_url']==target, 'KEEP must retain the same working URL'
 redirects={r['old_url']:r['new_url'] for r in rows if r['proposed_status']=='301'}
 assert not any(target in redirects for target in redirects.values()), 'Redirect chain in candidate map'
 return set(urls)

def main():
 with (ROOT/'MIGRATION_MAP.csv').open() as f: rows=list(csv.DictReader(f))
 urls=validate_map_rows(rows)
 with gzip.open(OUT/'blog-inventory/url-inventory.csv.gz','rt') as f:known={r['url'] for r in csv.DictReader(f)}
 assert known<=urls, 'Discovered URL missing from map'
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

if __name__=='__main__':
 main()
