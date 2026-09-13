# Search discovery operations

`submit-discovery.mjs` validates the live canonical sitemap and sends discovery
notifications only with `--submit`. It needs Node 22+ and the root workspace's
installed dependencies. It reads `.env` without logging its values.

```sh
node --test scripts/seo/discovery.test.mjs
node scripts/seo/submit-discovery.mjs --dry-run
node scripts/seo/submit-discovery.mjs --submit
```

Use `--receipt docs/offsite-seo/another-receipt.json` to keep each release's
receipt. Submission should follow a verified content release, not an hourly
resubmission schedule. All URLs currently in the sitemap are submitted in this
small launch implementation; recurring changed-URL selection is a future
optimization.

Before any provider receives a notification, the script checks:

- The live sitemap is nonempty; sitemap indexes resolve without cycles.
- Every URL uses `https://insightginie.com`, with no query, fragment, private
  route or duplicate canonical entry.
- Googlebot and Bingbot are allowed by the live robots rules.
- Each page responds with 200 HTML without redirects, has exactly one matching
  canonical link, and has no `noindex` header or robots metadata.

IndexNow requires `INDEXNOW_KEY` in both the web service environment and this
CLI's environment. `/indexnow-key.txt` serves the ownership value from the
runtime environment. The route returns 404 when configuration is missing or
invalid. The script checks the public file before submitting any URLs. Each
request contains at most 10,000 URLs and includes `keyLocation` so the fixed
verification filename is valid. [Protocol](https://www.indexnow.org/documentation),
[global endpoint](https://www.indexnow.org/faq).

Optional authenticated sitemap submissions:

| Environment variable                 | Purpose                                                                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `GOOGLE_SEARCH_CONSOLE_ACCESS_TOKEN` | Current OAuth access token with the `https://www.googleapis.com/auth/webmasters` scope and access to the verified property. |
| `GOOGLE_SEARCH_CONSOLE_PROPERTY`     | Defaults to `sc-domain:insightginie.com`; the exact HTTPS URL-prefix property is also supported.                            |
| `BING_WEBMASTER_API_KEY`             | Key from an account where `https://insightginie.com` is verified.                                                           |

This CLI accepts an already issued Google access token. It does not automatically
exchange service-account JSON or refresh OAuth tokens. The master project's
`GOOGLE_SEARCH_CONSOLE_CREDENTIALS` placeholder is not consumed by this script.
Do not put an access token in the ownership-key file or a `NEXT_PUBLIC_` variable.
The [Google sitemap endpoint](https://developers.google.com/webmaster-tools/v1/sitemaps/submit)
uses PUT; the [Bing JSON SubmitFeed endpoint](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.submitfeed?view=bing-webmaster-dotnet)
uses POST. Deprecated anonymous sitemap ping URLs are not used.

Missing credentials are recorded as `skipped`. Dry-run credentials are only
marked configured; dry-run does not claim account authentication succeeded.
Receipts store URL lists, timestamps, checksums, safe status codes and reasons;
they omit keys, tokens, raw API bodies and credential-bearing request URLs.
Network errors are sanitized. Failed validation or a failed configured provider
returns a nonzero exit status. A 429 is recorded and not retried automatically.

`received` means the engine accepted the request. IndexNow 202 means ownership
validation is still pending. Neither response proves indexing or ranking.
Inspect indexing and search performance in the respective webmaster dashboards.

Operational guardrails: validation caps this launch tool at 50,000 total URLs
and 100 sitemap files. Larger publishing needs a reviewed changed-URL pipeline,
not bypassing the page-quality gate. There is no automatic social posting,
outreach, backlink buying or background publishing service in these scripts.
