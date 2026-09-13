#!/usr/bin/env python3
"""Build honest, versioned audit records and a proposed, inactive migration map."""
import csv,gzip,io,json,re
from collections import Counter,defaultdict
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import urlsplit, parse_qs, urlencode
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/audits/2026-09-13-consolidation'

def read_json(path,default=None):return json.loads(path.read_text()) if path.exists() else default

def main():
 with gzip.open(OUT/'blog-inventory/url-inventory.csv.gz','rt') as f: inventory=list(csv.DictReader(f))
 crawl=read_json(OUT/'blog-inventory/crawl-summary.json',{})
 measured={}
 if (OUT/'measured-source.jsonl.gz').exists():
  with gzip.open(OUT/'measured-source.jsonl.gz','rt') as f:
   measured={r['url']:r for r in map(json.loads,f)}
 browser=read_json(OUT/'browser-audit.json',{'records':[]})
 browser_index=defaultdict(list)
 for i,r in enumerate(browser['records']):browser_index[r['url']].append(i)
 linked=read_json(OUT/'known-linked-url-checks.json',[])
 linked_index={r['url']:r for r in linked}
 inlinks=defaultdict(set);dupes=defaultdict(list)
 for url,r in measured.items():
  for link in r.get('internal_outlinks',[]):inlinks[link].add(url)
  if r.get('content_sha256') and r.get('status')==200:dupes[r['content_sha256']].append(url)
 items={r['url']:r for r in inventory}
 for url in measured:items.setdefault(url,{'url':url,'kind':'main-route','title':''})
 for r in browser['records']:items.setdefault(r['url'],{'url':r['url'],'kind':'rendered-probe','title':''})
 for r in linked:items.setdefault(r['url'],{'url':r['url'],'kind':'linked-legacy-article','title':''})
 map_rows=[];records=[]
 for url,item in sorted(items.items()):
  source=measured.get(url);path=urlsplit(url).path;kind=item['kind'];blog=urlsplit(url).hostname=='blog.insightginie.com'
  row={key:None for key in ['status','initial_status','redirect_chain','canonical','robots_meta','title','description','h1','schema','language','word_count','content_sha256','images']}
  row.update(url=url,kind=kind,source_status='MEASURED' if source else 'NOT_MEASURED',source_gap=None if source else 'Full per-URL source crawl paused after observed blog HTTP 429 responses; no status inferred from REST publication.',sitemap_membership=[v for v in item.get('sources','').split(' | ') if v.endswith('.xml')],rest_title=item.get('title'),rest_modified=item.get('last_modified') or None,observed_internal_inlinks=sorted(inlinks[url]),inlink_coverage='Measured source subset only; absence does not establish an orphan.',rendered_report_indices=browser_index.get(url,[]),rendered_status='MEASURED_SAMPLE' if url in browser_index else 'NOT_MEASURED',internal_outlinks=None,external_outlinks=None)
  if source:
   row.update(source)
   if blog:row['sitemap_membership']=[v for v in item.get('sources','').split(' | ') if v.endswith('.xml')]
  elif url in linked_index:
   row['status']=linked_index[url].get('status');row['status_evidence']='known-linked-url-checks.json'
  elif url in browser_index:
   row['status']=browser['records'][browser_index[url][0]].get('status');row['status_evidence']='browser-audit.json'
  records.append(row)
  if not blog:
   if urlsplit(url).query:continue
   if source and source.get('status')==200 and '/sitemap.' not in path and path!='/robots.txt':
    map_rows.append(dict(old_url=url,new_url=url,kind=kind,proposed_status='KEEP',target_indexing='retain_current',review_status='KEEP_WORKING_MAIN_URL',approved='false',reason='Working main-domain route; no performance-based movement decision without GSC evidence.'))
   continue
  if 's' in parse_qs(urlsplit(url).query):target='/insights/search/?'+urlencode({'q':parse_qs(urlsplit(url).query)['s'][0]});indexing='noindex_follow';reason='Equivalent search request; preserve the explicitly audited search term and prevent query indexation.'
  elif kind=='post':target='/insights/'+path.strip('/')+'/';indexing='retain_pending_editorial_review';reason='Exact article counterpart; preserve body, author, dates, media and sources.'
  elif kind=='homepage':target='/insights/';indexing='index';reason='Editorial homepage counterpart.'
  elif kind in {'tag','category'}:target='/insights/archive'+path;indexing='noindex_follow';reason='Proposed corresponding archive, not a redirect to an unrelated finance hub. Validate membership and empty archives; no thin archive indexation.'
  elif kind=='author':target='/insights/authors/'+path.strip('/').split('/')[-1]+'/';indexing='noindex_until_author_review';reason='Preserve actual byline relationships; identity/credentials require verification.'
  elif kind=='page':
   policy={'/about/':'/about/','/contact/':'/contact/','/privacy-policy/':'/privacy/','/editorial-policy/':'/editorial-policy/'}
   target=policy.get(path,'/insights/'+path.strip('/')+'/');indexing='review_required';reason='Preserve page content; overlapping policies need an explicit content-merge/legal review before redirect.'
  elif re.fullmatch(r'/page/\d+/',path):target='/insights'+path;indexing='noindex_follow';reason='Equivalent editorial pagination; preserve page membership and avoid page-one canonical collapse.'
  else:target='/insights/archive'+path;indexing='noindex_follow';reason='Candidate date/archive counterpart; verify type and content before approval.'
  map_rows.append(dict(old_url=url,new_url='https://insightginie.com'+target,kind=kind,proposed_status='301',target_indexing=indexing,review_status='CANDIDATE_NOT_IMPLEMENTED',approved='false',reason=reason))
 for r in linked:
  if urlsplit(r['url']).hostname=='insightginie.com' and r.get('status')==404:
   path=urlsplit(r['url']).path
   map_rows.append(dict(old_url=r['url'],new_url='https://insightginie.com/insights'+path,kind='linked-main-legacy-article',proposed_status='301',target_indexing='retain_pending_editorial_review',review_status='PRIORITY_EXACT_CONTENT_RESTORE',approved='false',reason='Existing external reference; matching blog article returns 200. Restore exact content before either host redirects. Traffic remains unknown.'))
 fields=['old_url','new_url','kind','proposed_status','target_indexing','review_status','approved','reason']
 with (ROOT/'MIGRATION_MAP.csv').open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields,lineterminator="\n");w.writeheader();w.writerows(map_rows)
 for offset in range(0,len(records),10000):
  with gzip.open(OUT/f'url-records-{offset:05d}.jsonl.gz','wt') as f:
   for row in records[offset:offset+10000]:f.write(json.dumps(row,separators=(',',':'))+'\n')
 duplicate_groups=[{'sha256':h,'urls':urls} for h,urls in dupes.items() if len(urls)>1]
 (OUT/'duplicate-groups.json').write_text(json.dumps({'scope':'Measured 200 source documents only; no cross-host duplicate absence claim.','groups':duplicate_groups},indent=2)+'\n')
 issues=[
  {'id':'HOST-01','classification':'VERIFIED_DEFECT','finding':'Blog homepage and sampled articles remain 200 with blog-host self canonicals; single canonical-host consolidation is not implemented.','evidence':'browser-audit.json'},
  {'id':'LINK-01','classification':'VERIFIED_DEFECT','finding':'Two externally referenced main-domain articles return 404 while exact blog counterparts return 200.','evidence':'known-linked-url-checks.json'},
  {'id':'MOBILE-01','classification':'VERIFIED_DEFECT','finding':'Sampled DougDoug article overflows the 390px viewport.','evidence':'browser-audit.json'},
  {'id':'ROUTE-01','classification':'VERIFIED_DEFECT','finding':'Requested /insights/, /tools/, /research/ and /ask/ hubs are absent. /tools/income/ is an existing private calculator frame and must not be broken.','evidence':'infrastructure.json and measured-source.jsonl.gz'},
  {'id':'RATE-01','classification':'UNAVAILABLE_EVIDENCE','finding':'Blog pagination and search browser probes returned HTTP 429; further blog crawl paused. Their error-page accessibility results do not describe the underlying templates.','evidence':'browser-audit.json'},
  {'id':'SEARCH-01','classification':'UNAVAILABLE_EVIDENCE','finding':'No GSC/GA4/backlink/server-log export; no organic traffic, rankings, revenue or performance-based grandfathering baseline claimed.','evidence':'available-analytics.json'},
  {'id':'CONTENT-01','classification':'INFERRED_RISK','finding':'32,033 tag URLs and unrelated legacy topics suggest archive dilution and inconsistent finance positioning. Counts do not establish low traffic or justify deletion.','evidence':'blog-inventory/crawl-summary.json'},
  {'id':'BACKUP-01','classification':'UNAVAILABLE_EVIDENCE','finding':'Public metadata/HTML snapshots do not constitute a restorable WordPress database/media/configuration backup.','evidence':'MANUAL_REQUIRED.md'},
  {'id':'AI-01','classification':'UNAVAILABLE_EVIDENCE','finding':'Bits Agent Builder documents workflow execution, but account entitlement, public-inference support and prompt-retention controls are unverified.','evidence':'docs/datadog-bits-requirements.md'},
 ]
 summary={'audit_version':'consolidation-audit-v1','generated_at':datetime.now(timezone.utc).isoformat(),'phase':'1 — inspection only','phase1_complete':False,'application_modified':False,'production_deployed':False,'inventory':{'blog_distinct_urls':len(inventory),'blog_kinds':dict(Counter(r['kind'] for r in inventory)),'sitemap_documents':len(crawl.get('sitemaps',[])),'rest_collections':{k:{field:v.get(field) for field in ['reported_total','fetched_items','fetched_pages']} for k,v in crawl.get('rest_collections',{}).items()}},'coverage':{'total_url_records':len(records),'measured_source_documents':len(measured),'browser_checks':len(browser['records']),'browser_successful_200_checks':sum(r.get('status')==200 for r in browser['records']),'rendered_blog_urls':'Explicit template sample only','full_source_crawl':'Paused after observed HTTP 429, incomplete','unknown_urls':'Unlinked, parameter combinations, attachments and server-log-only URLs require additional discovery; no exhaustive all-URL claim.'},'reports':[str(p.relative_to(ROOT)) for p in sorted(OUT.glob('url-records-*.jsonl.gz'))],'migration_map':'MIGRATION_MAP.csv','migration':{'rows':len(map_rows),'approved_redirects':0,'deployed_redirects':0,'note':'Candidates are not authorization to publish unreviewed archives or delete content.'},'findings':issues,'blocked_acceptance':['Full source/rendered crawl and internal-link completeness','Restorable WordPress backup and headless sync','Direct blog-host redirects and private backend','New finance products, reviewed editorial trust metadata and assistant','Datadog monitoring/inference account validation','Field Core Web Vitals and organic/revenue baselines']}
 (ROOT/'SEO_AUDIT.json').write_text(json.dumps(summary,indent=2)+'\n')
 (OUT/'SEO_AUDIT.json').write_text(json.dumps(summary,indent=2)+'\n')
 print(json.dumps(summary['coverage']));print('Migration candidates:',len(map_rows),'approved: 0')
if __name__=='__main__':main()
