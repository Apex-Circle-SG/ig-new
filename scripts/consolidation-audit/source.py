#!/usr/bin/env python3
"""Read-only public SEO audit. Every missing measurement remains explicitly null.

No publishing, redirects, authentication changes, analytics or ad requests.
HTML snapshots are local evidence, not a restorable WordPress backup.
"""
import argparse, concurrent.futures, csv, gzip, hashlib, io, json, re, time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import requests
from lxml import html, etree

HOSTS = {'insightginie.com', 'blog.insightginie.com', 'www.insightginie.com'}
UA = 'InsightGinieOwnerSEOAudit/2.0 (+https://insightginie.com/contact/)'
STOPPED_HOSTS = set()

def now(): return datetime.now(timezone.utc).isoformat()
def normalize(url, base):
    try:
        p=urlsplit(urljoin(base,url))
        if p.scheme not in {'http','https'} or p.hostname not in HOSTS or p.username or p.password or p.port not in {None,80,443}: return None
        return urlunsplit((p.scheme,p.netloc.lower(),p.path or '/',p.query,''))
    except ValueError: return None

def clean(text): return re.sub(r'\s+',' ',text or '').strip()
def digest(text): return hashlib.sha256(text.encode()).hexdigest()

def extract(body, url):
    tree=html.fromstring(body,base_url=url)
    def text(xpath): return [clean(' '.join(x.itertext())) for x in tree.xpath(xpath)]
    metas=defaultdict(list)
    for el in tree.xpath('//meta[@name or @property]'):
        metas[(el.get('name') or el.get('property')).lower()].append(el.get('content',''))
    schemas=[];schema_errors=[]
    for el in tree.xpath('//script[@type="application/ld+json"]'):
        try: schemas.append(json.loads(el.text or ''))
        except ValueError as e: schema_errors.append(type(e).__name__)
    internal=set();external=set()
    for el in tree.xpath('//a[@href]'):
        href=urljoin(url,el.get('href'))
        if href.startswith(('http://','https://')):
            found=normalize(href,url)
            (internal if found else external).add(found or href.split('#')[0])
    images=[{'src':urljoin(url,el.get('src','')),'srcset':el.get('srcset'),'alt':el.get('alt'),'width':el.get('width'),'height':el.get('height'),'loading':el.get('loading'),'naturalWidth':None,'naturalHeight':None} for el in tree.xpath('//img')]
    for el in tree.xpath('//script|//style|//noscript|//template'):
        el.drop_tree()
    main=tree.xpath('//article') or tree.xpath('//main') or tree.xpath('//body') or [tree]
    content=clean(' '.join(' '.join(el.itertext()) for el in main))
    types=[]
    def find_types(value):
        if isinstance(value,dict):
            t=value.get('@type',[]);types.extend(t if isinstance(t,list) else [t])
            for child in value.values(): find_types(child)
        elif isinstance(value,list):
            for child in value: find_types(child)
    find_types(schemas)
    return {'title':text('//title'),'description':metas.get('description',[]),'h1':text('//h1'),'canonical':tree.xpath('//link[contains(concat(" ",normalize-space(@rel)," ")," canonical ")]/@href'),'robots_meta':metas.get('robots',[]),'language':tree.get('lang'),'word_count':len(content.split()),'content_sha256':digest(content),'schema':schemas,'schema_types':sorted(set(types)),'schema_errors':schema_errors,'internal_outlinks':sorted(internal),'external_outlinks':sorted(external),'images':images,'static_accessibility':{'h1_count':len(tree.xpath('//h1')),'images_without_alt':sum(x['alt'] is None for x in images),'images_without_dimensions':sum(not x['width'] or not x['height'] for x in images)},'rendered':{'status':'NOT_MEASURED','reason':'See separate browser audit coverage; source HTML does not establish rendered accessibility.'}}


def fetch(url, snapshots, timeout=15):
    started=now(); current=url; chain=[]; seen=set()
    headers={'User-Agent':UA,'Accept':'text/html,application/xhtml+xml,application/xml,text/plain;q=0.8','Accept-Encoding':'gzip, deflate'}
    record={'url':url,'fetched_at':started,'status':None,'redirect_chain':chain,'final_url':None,'error':None}
    if urlsplit(url).hostname in STOPPED_HOSTS:
        return {**record,'error':'host_paused_after_429','rendered':{'status':'UNAVAILABLE','reason':'Respecting origin rate limit'}}
    try:
        for _ in range(11):
            if current in seen: raise ValueError('redirect_loop')
            seen.add(current)
            with requests.get(current,headers=headers,timeout=timeout,allow_redirects=False,stream=True) as response:
                chain.append({'url':current,'status':response.status_code,'location':response.headers.get('location')})
                record['initial_status']=chain[0]['status']
                if response.status_code == 429:
                    STOPPED_HOSTS.add(urlsplit(current).hostname)
                    record['retry_after']=response.headers.get('retry-after')
                if response.status_code in {301,302,303,307,308}:
                    next_url=normalize(response.headers.get('location',''),current)
                    if not next_url: raise ValueError('redirect_outside_audit_hosts')
                    current=next_url;continue
                parts=[];length=0
                for chunk in response.iter_content(65536):
                    length+=len(chunk)
                    if length>3_000_000: raise ValueError('response_byte_limit')
                    parts.append(chunk)
                body=b''.join(parts)
                record.update(status=response.status_code,final_url=current,content_type=response.headers.get('content-type',''),headers={key:response.headers[key] for key in ['server','x-robots-tag','cache-control','content-security-policy','x-frame-options','last-modified','link','content-language'] if key in response.headers},bytes=len(body),body_sha256=hashlib.sha256(body).hexdigest())
                name=digest(url)+'.html.gz'
                (snapshots/name).write_bytes(gzip.compress(body,mtime=0))
                record['snapshot']=name
                if 'text/html' in record['content_type']:
                    record.update(extract(body,current))
                else:
                    record.update(title=None,description=None,h1=None,canonical=None,robots_meta=None,language=None,word_count=None,content_sha256=None,schema=None,internal_outlinks=[],external_outlinks=[],images=[],rendered={'status':'NOT_APPLICABLE','reason':'Non-HTML response'})
                return record
        raise ValueError('redirect_limit')
    except Exception as e:
        record['error']=str(e)[:300]
        record.setdefault('rendered',{'status':'UNAVAILABLE','reason':'Source fetch failed'})
        return record
    finally: time.sleep(0.12)


def load_inventory(path):
    if not path.exists(): return []
    with gzip.open(path,'rt') as f: return list(csv.DictReader(f))

def run(args):
    output=Path(args.output);output.mkdir(parents=True,exist_ok=True)
    snapshots=Path(args.snapshots);snapshots.mkdir(parents=True,exist_ok=True)
    inventory=load_inventory(Path(args.inventory))
    origins=['https://insightginie.com','https://blog.insightginie.com']
    registry={r['url']:{'sources':r.get('sources',''),'kind':r.get('kind','unknown'),'last_modified':r.get('last_modified',''),'sitemap_membership':[source for source in r.get('sources','').split(' | ') if source.endswith('.xml')]} for r in inventory}
    sitemap_records=[]
    todo=[origin+path for origin in origins for path in ['/sitemap.xml','/sitemap_index.xml','/wp-sitemap.xml']];seen=set()
    while todo:
        url=todo.pop()
        if url in seen:continue
        seen.add(url)
        r=fetch(url,snapshots);sitemap_records.append(r)
        if r.get('status')!=200:continue
        try:
            body=gzip.decompress((snapshots/r['snapshot']).read_bytes())
            root=etree.fromstring(body,parser=etree.XMLParser(resolve_entities=False,no_network=True))
            for entry in root:
                loc=entry.find('{*}loc');lastmod=entry.find('{*}lastmod')
                if loc is None or not loc.text:continue
                found=normalize(loc.text,url)
                if not found:continue
                if root.tag.endswith('sitemapindex'):todo.append(found)
                elif root.tag.endswith('urlset'):
                    row=registry.setdefault(found,{'sources':'','kind':'sitemap','last_modified':''})
                    row['sitemap_membership']=sorted(set(row.get('sitemap_membership',[])+[url]))
                    if lastmod is not None:row['last_modified']=lastmod.text
        except (etree.XMLSyntaxError,ValueError):pass
    for origin in origins:
        for path in ['/','/robots.txt','/feed/','/atom/','/wp-json/','/wp-admin/','/?s=income','/?utm_source=owner-audit','/?preview=true','/page/2/','/author/admin/','/category/finance/','/tag/finance/','/search/','/insights/','/tools/','/research/','/ask/','/staging/','/api/health/','/does-not-exist-owner-audit/']:
            registry.setdefault(origin+path,{'sources':'explicit-routing-probe','kind':'probe'})
    for url in ['http://insightginie.com/','https://www.insightginie.com/','http://blog.insightginie.com/']:
        registry.setdefault(url,{'sources':'canonical-host-probe','kind':'probe'})
    (output/'discovery.json').write_text(json.dumps({'version':'seo-source-audit-v2','started_at':now(),'known_urls':len(registry),'sitemaps':sitemap_records,'scope':'Known sitemap/REST URLs plus explicit routing probes. Unknown server-log-only URLs and infinite query variants are not enumerable.'},indent=2))
    (output/'discovered-urls.json').write_text(json.dumps(registry,indent=2))
    done=set()
    for file in sorted(output.glob('source-*.jsonl.gz')):
        with gzip.open(file,'rt') as f:
            for line in f:
                row=json.loads(line)
                if row.get('status') not in {None,429} and not row.get('error'):done.add(row['url'])
    pending=sorted(set(registry)-done,key=lambda u:(urlsplit(u).hostname!='insightginie.com',registry[u].get('kind') not in ['post','page','probe'],u))
    print(f'Known URLs: {len(registry)}; complete source records: {len(done)}; remaining: {len(pending)}',flush=True)
    errors=0;statuses=Counter();count=0;started=now()
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        for offset in range(0,len(pending),250):
            batch=pending[offset:offset+250]
            filename=output/f'source-{len(done)+offset:06d}.jsonl.gz'
            with gzip.open(filename,'wt') as f:
                for r in pool.map(lambda u:fetch(u,snapshots),batch):
                    r.update(registry[r['url']]);r['sitemap_membership']=r.get('sitemap_membership',[])
                    f.write(json.dumps(r,separators=(',',':'))+'\n');count+=1;statuses[str(r['status'])]+=1
                    if r.get('error'):errors+=1
            progress={'started_at':started,'updated_at':now(),'known_urls':len(registry),'source_records':len(done)+count,'remaining':len(pending)-count,'errors_this_run':errors,'statuses_this_run':dict(statuses),'rendered_coverage':'separate browser report','complete':count==len(pending)}
            (output/'progress.json').write_text(json.dumps(progress,indent=2)+'\n')
            print(json.dumps(progress),flush=True)
            if STOPPED_HOSTS:
                print('Paused after rate-limit responses; resume only after origin cooldown.',flush=True);return
            if args.limit and count>=args.limit:return

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--inventory',required=True);p.add_argument('--output',required=True);p.add_argument('--snapshots',required=True);p.add_argument('--workers',type=int,choices=range(1,5),default=3);p.add_argument('--limit',type=int,default=0)
    run(p.parse_args())
