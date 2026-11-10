#!/usr/bin/env bash
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
work="${1:?Supply an empty build directory}"
mkdir -p "$work"
if [[ -n "$(ls -A "$work")" ]]; then printf '%s\n' 'Build directory must be empty.' >&2; exit 1; fi
work="$(cd "$work" && pwd)"
git -C "$root" archive HEAD | tar -x -C "$work"
cp "$root/package.json" "$work/package.json"
git -C "$work" apply --check "$root/scripts/cloudflare/worker.patch"
git -C "$work" apply "$root/scripts/cloudflare/worker.patch"
mkdir -p "$work/apps/web/src/lib/cloudflare"
cp "$root/scripts/cloudflare/library.ts" "$work/apps/web/src/lib/library/index.ts"
cp "$root/apps/web/src/lib/cloudflare/"*.ts "$work/apps/web/src/lib/cloudflare/"
mkdir -p "$work/scripts/storage"
cp "$root/scripts/storage/"*.mjs "$root/scripts/storage/"*.mts "$work/scripts/storage/"
cp "$root/scripts/cloudflare/cloudflare-workers.d.ts" "$work/apps/web/src/cloudflare-workers.d.ts"
cp "$root/scripts/cloudflare/cloudflare.config.ts" "$root/scripts/cloudflare/vite.config.ts" "$work/apps/web/"
cp "$root/scripts/cloudflare/package-lock.json" "$work/package-lock.json"
(cd "$work"
 npm ci --no-audit --no-fund
 node scripts/build-all-embeds.mjs
 if [[ "${IG_CLOUDFLARE_TARGET:-stage}" == production ]]; then
   SITE_INDEXABLE=true NEXT_PUBLIC_ADS_ENABLED=true npm run build:vinext --workspace @insightginie/web
 else
   npm run build:vinext --workspace @insightginie/web
 fi
)
