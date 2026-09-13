"""Reuse existing public REST metadata snapshots; performs no HTTP requests."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--manifest', default='docs/audits/2026-09-13-consolidation/blog-inventory/request-manifest.json')
parser.add_argument('--snapshots', default='backups/consolidation-2026-09-13/blog')
parser.add_argument('--output', default='content/wordpress/inventory-plan.json')
args = parser.parse_args()
manifest_path = Path(args.manifest)
manifest = json.loads(manifest_path.read_text())
posts = {}
for request in manifest:
    if not request['url'].startswith('https://blog.insightginie.com/wp-json/wp/v2/posts?'):
        continue
    snapshot_name = request['snapshot_file']
    if Path(snapshot_name).name != snapshot_name:
        raise ValueError('Unsafe snapshot filename')
    with gzip.open(Path(args.snapshots) / snapshot_name, 'rb') as handle:
        raw = handle.read()
    if hashlib.sha256(raw).hexdigest() != request['sha256']:
        raise ValueError('Audit snapshot checksum mismatch')
    for post in json.loads(raw):
        if not isinstance(post.get('id'), int) or post['id'] <= 0:
            raise ValueError('Invalid public post ID')
        previous = posts.get(post['id'])
        if previous and previous != post['link']:
            raise ValueError('Duplicate source ID')
        posts[post['id']] = post['link']
if not posts:
    raise ValueError('No audited public post metadata')
output = Path(args.output)
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({
    'sourceOrigin': 'https://blog.insightginie.com',
    'manifestSha256': hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
    'scope': 'Audited public post IDs only; metadata inventory is not a full WordPress backup.',
    'postIds': sorted(posts),
}, indent=2) + '\n')
print(json.dumps({'metadataPosts': len(posts), 'output': str(output), 'httpRequests': 0}))
