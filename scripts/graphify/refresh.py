#!/usr/bin/env python3
"""Refresh a bounded, code-only architecture graph. Run with graphify's Python."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from graphify.analyze import god_nodes, suggest_questions, surprising_connections
from graphify.build import build_from_json, build_merge
from graphify.cluster import cluster, score_all
from graphify.detect import detect
from graphify.diagnostics import diagnose_extraction
from graphify.export import to_html, to_json
from graphify.extract import extract
from graphify.report import generate

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'graphify-out'
ROOTS = ['apps/web/src', 'apps/opportunities', 'scripts/opportunities', 'packages/seo/src']
OUT.mkdir(exist_ok=True)
files = []
for directory in ROOTS:
    detected = detect(ROOT / directory)
    files.extend(Path(f) for f in detected['files'].get('code', []))
# Explicit suffix allowlist; never follow unknown files, env files, build outputs or secrets.
files = sorted(set(p for p in files if p.suffix in {'.ts', '.tsx', '.js', '.mjs', '.json', '.sql'} and not p.is_symlink()))
hashes = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
manifest_path = OUT / 'safe-code-manifest.json'
previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
changed = [p for p in files if previous.get(str(p.relative_to(ROOT))) != hashes[str(p.relative_to(ROOT))]]
deleted = set(previous) - set(hashes)
full = not previous or not (OUT / 'graph.json').exists()
if not full and not changed and not deleted:
    print('No safe code files changed; graph is current.')
    raise SystemExit(0)
result = extract(files if full else changed, cache_root=ROOT, root=ROOT)
# JSON and SQL file nodes preserve catalog/schema provenance when AST has no symbols.
known = {n.get('source_file') for n in result['nodes']}
for p in (files if full else changed):
    relative = str(p.relative_to(ROOT))
    if p.suffix in {'.json', '.sql'} and relative not in known and str(p) not in known:
        result['nodes'].append({'id': relative, 'label': p.name, 'source_file': relative, 'source_location': 'L1', 'file_type': 'data', 'provenance': 'EXTRACTED'})
G = build_from_json(result, root=str(ROOT)) if full else build_merge([result], graph_path=str(OUT / 'graph.json'), prune_sources=list(deleted) or None, root=str(ROOT))
if not G.number_of_nodes():
    raise SystemExit('Refusing to overwrite graph with empty extraction.')
communities = cluster(G)
cohesion = score_all(G, communities)
labels = {}
for cid, members in communities.items():
    paths = [G.nodes[n].get('source_file', '') for n in members]
    if any('linkedin' in p for p in paths):
        label = 'LinkedIn publishing automation'
    elif any('apps/opportunities' in p or 'scripts/opportunities' in p for p in paths):
        label = 'Opportunity ingestion and catalog'
    elif any('opportunities' in p or '/ideas/' in p or '/platforms/' in p for p in paths):
        label = 'Opportunity discovery pages'
    elif any('analytics' in p or 'advertis' in p or 'adsense' in p for p in paths):
        label = 'Analytics and advertising'
    elif any('/embed/' in p or 'calculator' in p for p in paths):
        label = 'Private financial calculators'
    elif any('/ask/' in p or 'ginie' in p for p in paths):
        label = 'Ginie assistant routes'
    elif any('/seo/' in p or 'sitemap' in p or 'robots' in p for p in paths):
        label = 'SEO and route inventory'
    else:
        label = 'Website pages and components'
    labels[cid] = label
if not to_json(G, communities, str(OUT / 'graph.json'), community_labels=labels):
    raise SystemExit('Graph shrink guard refused write; inspect deletions manually.')
gods = god_nodes(G)
surprises = surprising_connections(G, communities)
questions = suggest_questions(G, communities, labels)
detection = {'total_files': len(files), 'total_words': sum(len(p.read_text().split()) for p in files), 'files': {'code': [str(p) for p in files]}}
report = generate(G, communities, cohesion, labels, gods, surprises, detection, {'input': 0, 'output': 0}, str(ROOT), suggested_questions=questions)
preamble = ('\n## Scope and honesty\n\nDeterministic AST graph only; no semantic extraction or LLM token usage. '
            'Allowlisted roots: ' + ', '.join(ROOTS) + '. Public JSON catalogs and SQL migrations are file-level provenance nodes when no AST symbols are available. '
            'No credentials, environment files, artifacts, screenshots or generated build directories are scanned. '
            'Calls/imports/contains edges come from extraction; absence of an edge is not evidence that a runtime integration is absent. '
            'Community names are human-readable heuristics. Migration from the older web-only graph intentionally expands source paths to repository-relative names.\n')
(OUT / 'GRAPH_REPORT.md').write_text(report + preamble)
if G.number_of_nodes() > 5000:
    print('Graph exceeds 5,000 nodes; HTML must be generated manually after review.')
else:
    to_html(G, communities, str(OUT / 'graph.html'), community_labels=labels)
serialized = {'nodes': [{'id': n, **d} for n, d in G.nodes(data=True)], 'edges': [{'source': u, 'target': v, **d} for u, v, d in G.edges(data=True)]}
health = diagnose_extraction(result, directed=False, root=str(ROOT))
health['scope'] = 'fresh extraction before graph build; changed files only on incremental runs'
health['merged_graph_nodes'] = G.number_of_nodes()
health['merged_graph_edges'] = G.number_of_edges()
(OUT / 'health.json').write_text(json.dumps(health, indent=2))
flags = {k: health.get(k, 0) for k in ('dangling_endpoint_edges', 'missing_endpoint_edges', 'self_loop_edges', 'undirected_same_endpoint_collapsed_edges') if health.get(k, 0)}
if flags:
    with (OUT / 'GRAPH_REPORT.md').open('a') as handle:
        handle.write('\n## Graph health warning\n\nRaw extraction diagnostic: ' + ', '.join(f'{key}={value}' for key, value in flags.items()) + '. Unresolved external references and relationships collapsed into the undirected representation can make the graph incomplete. Read health.json before relying on a path.\n')
manifest_path.write_text(json.dumps(hashes, indent=2) + '\n')
(OUT / '.graphify_root').write_text(str(ROOT))
(OUT / 'refresh-receipt.json').write_text(json.dumps({'timestamp': datetime.now(timezone.utc).isoformat(), 'mode': 'full-safe-root-migration' if full else 'incremental', 'source_files': len(files), 'changed_files': len(changed), 'deleted_files': len(deleted), 'nodes': G.number_of_nodes(), 'edges': G.number_of_edges(), 'communities': len(communities), 'input_tokens': 0, 'output_tokens': 0, 'semantic_extraction': False}, indent=2) + '\n')
print(f'Graph refreshed: {len(files)} source files, {G.number_of_nodes()} nodes, {G.number_of_edges()} edges, {len(communities)} communities.')
print('Health:', json.dumps(health))
