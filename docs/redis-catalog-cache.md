# Redis catalog cache

TiDB is authoritative after the [runtime migration](tidb-runtime-migration.md). The Cloudflare catalog Worker caches successful public stats, opportunity listing/search pages, earning methods, ideas and platforms in Upstash Redis for at most 600 seconds. Job detail lookups, health, automation status, admin endpoints and all LinkedIn execution/state stay on SQL. All existing catalogue callers share the Worker cache. The website also caches public library rows in Redis for five minutes, with a 30-second isolate cache and React request memoization. Consent-dependent HTML remains private and uncached.

Redis uses HTTPS REST with secret Worker bindings `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, loaded by the deployment script from the owner's private root `.env`. Tokens are never sent to browsers or used in URL query strings. Keys use a dedicated versioned namespace and SHA-256 hashes rather than plaintext search terms. Cache payloads contain only the existing public API response. Existing unrelated Redis keys are never flushed.

Every successful import, method-check batch and cleanup rotates a generation key. In-flight old-generation writes cannot repopulate the current generation. Old entries disappear through TTL. If invalidation fails, old public results expire within ten minutes. Listing TTL is additionally capped at the earliest returned job expiry/stale deadline. Public stats may lag by ten minutes; downstream Next fetch caching can add its existing two minutes. Cache headers expose HIT/MISS for verification. Errors are never cached. Unknown/overlong listing parameters bypass caching. Redis commands time out after 1.5 seconds and failures fall back to TiDB; an outage therefore increases TiDB usage. Concurrent misses coalesce within one Worker isolate, not globally. Multiple isolates can still refill the same expired key. Redis uses one atomic EVAL per request plus SET on a miss; monitor its own usage. Request-rate limits also use atomic Redis counters and fail closed on cache errors. Durable spending/posting state stays in SQL.

Stats derive the total from the already-required grouped category counts, removing a second expensive eligibility/dedup scan. Imports fetch only the current 25-record batch's existing rows and compare every normalized field except last-seen time. Identical records receive one batched last-seen update, avoiding the content-column FTS update trigger. Changed/new/reappearing records still use full upserts. Complete-board removal, seven-day stale rules, failed-feed retention, cursor rotation and LinkedIn safeguards remain intact. Full feed fetching remains necessary for complete-snapshot absence checks; this is not an incremental upstream API contract.

Deploy just the Worker without reseeding SQL:

```bash
set +x
source /root/.config/insightginie/cloudflare.env
node scripts/opportunities/deploy.mjs --worker-only
```

Normal deployment still runs migrations/seeds. Both modes require Redis configuration. To disable caching without changing SQL, remove the Redis secret bindings or roll back the Worker to its previous version; do not reset posting ledgers or credential state. Current release verification and rollback limitations are recorded in the runtime migration report. No paid plan changes were made.

REST implementation follows [Upstash's documented POST command format](https://upstash.com/docs/redis/features/restapi). Cost reduction must be measured against subsequent Cloudflare daily aggregates; cache hit verification is not a measured daily reduction percentage.
