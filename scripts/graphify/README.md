# Architecture graph refresh

Run from the repository root with the Python interpreter that has `graphifyy` installed:

```bash
"$(cat graphify-out/.graphify_python)" scripts/graphify/refresh.py
```

The first run migrates the older web-only graph to repository-relative source paths. Later runs hash the bounded code corpus and extract only changed files. No scheduler is installed for graph refresh; run this command after code changes. This developer graph is separate from the production opportunity-import schedule.

Only source files under `apps/web/src`, `apps/opportunities`, `scripts/opportunities` and `packages/seo/src` are eligible. An explicit suffix allowlist includes code plus public JSON catalogs and SQL migrations. Environment files, secrets, build output, screenshots and artifacts are excluded. Do not expand the roots to private configuration directories.

Outputs:

- `graphify-out/graph.html`: interactive architecture graph.
- `graphify-out/graph.json`: nodes and extracted relationships.
- `graphify-out/GRAPH_REPORT.md`: community report, cohesion and scope limitations.
- `graphify-out/health.json`: read-only graph diagnostic.
- `graphify-out/refresh-receipt.json`: latest run counts and timestamp.
- `graphify-out/safe-code-manifest.json`: content hashes for incremental refresh.

This is deterministic structural extraction with no LLM input/output tokens. JSON/SQL files that have no symbols get file-level provenance nodes; the tool does not pretend to understand their semantics. API calls assembled dynamically may not resolve to cross-file edges. Consult source and runtime checks before treating graph connections as production evidence.

Query the graph before digging into code:

```bash
graphify query 'linkedin publish scheduled ingest' --budget 2500
graphify reflect --if-stale
```

`health.json` can report multiple extracted relationships collapsing onto the same undirected endpoint pair. This is a graph representation limitation, not necessarily a source bug; inspect diagnostic counts before relying on call direction. There is no automatic semantic extraction, credential scan or publication in this command.
