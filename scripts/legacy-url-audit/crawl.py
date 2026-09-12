#!/usr/bin/env python3
"""Read-only, bounded WordPress URL inventory. Uses only Python's standard library.

This exports public metadata, not a restorable WordPress backup. All migration
decisions are provisional. No request writes to the site or changes its config.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import csv
import gzip
import hashlib
import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree

VERSION = "legacy-inventory-v1"
USER_AGENT = "InsightGinieMigrationAudit/1.0 (+https://insightginie.com)"
SAFE_HEADERS = {
    "content-type", "server", "platform", "panel", "x-litespeed-cache",
    "x-turbo-charged-by", "content-security-policy", "strict-transport-security",
    "x-content-type-options", "x-frame-options", "referrer-policy", "x-robots-tag",
    "x-wp-total", "x-wp-totalpages", "location", "link", "cache-control",
}


def normalize_url(url: str, origin: str) -> str | None:
    """Preserve distinct paths/queries; strip fragments and restrict to this host."""
    try:
        parsed = urllib.parse.urlsplit(urllib.parse.urljoin(origin, unescape(url)))
        expected = urllib.parse.urlsplit(origin)
        valid = (parsed.scheme in {"https", "http"} and parsed.hostname == expected.hostname
                 and not parsed.username and not parsed.password and parsed.port in {None, 80, 443})
    except ValueError:
        return None
    if not valid:
        return None
    return urllib.parse.urlunsplit((parsed.scheme, parsed.netloc.lower(), parsed.path or "/", parsed.query, ""))


class LocalRedirects(urllib.request.HTTPRedirectHandler):
    def __init__(self, origin: str):
        self.origin = origin
        super().__init__()

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not normalize_url(newurl, self.origin):
            raise urllib.error.HTTPError(req.full_url, code, "Cross-host redirect refused", headers, fp)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


class PageMetadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
        self.canonical = ""
        self.robots = ""
        self.generator = ""
        self.generators = []
        self.title = ""
        self.in_title = False

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "a" and data.get("href"):
            self.links.add(data["href"])
        if tag == "link" and "canonical" in (data.get("rel") or "").split():
            self.canonical = data.get("href", "")
        if tag == "meta" and data.get("name") in {"robots", "generator"}:
            setattr(self, data["name"], data.get("content", ""))
            if data["name"] == "generator":
                self.generators.append(data.get("content", ""))
        if tag == "title":
            self.in_title = True

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def provisional_classification(url: str, kind: str) -> tuple[str, str]:
    path = urllib.parse.urlsplit(url).path
    if path == "/":
        return "KEEP", "Retain site entry URL; replace homepage with new product."
    if path.rstrip("/") in {
        "/about", "/about-us", "/contact", "/privacy", "/privacy-policy",
        "/terms", "/terms-and-conditions", "/editorial-policy",
    }:
        return "KEEP", "Trust/policy route: content and true-equivalence review required."
    return "410", f"Provisional: legacy {kind}; no equivalent product page demonstrated. Review traffic/backlinks first."


class Crawler:
    def __init__(self, args):
        self.args = args
        self.origin = args.origin.rstrip("/")
        self.output = Path(args.output)
        self.backup = Path(args.backup)
        self.output.mkdir(parents=True, exist_ok=True)
        self.backup.mkdir(parents=True, exist_ok=True)
        self.rows = {}
        self.requests = []
        self.sitemaps = []
        self.rest = {}
        self.started = datetime.now(timezone.utc).isoformat()
        self.cached_requests = {}
        previous_manifest = self.backup / "manifest.json"
        if args.reuse_snapshots and previous_manifest.exists():
            self.cached_requests = {row["url"]: row for row in json.loads(previous_manifest.read_text()) if row.get("status") == 200 and row.get("snapshot_file")}

    def fetch(self, url: str) -> dict:
        if not normalize_url(url, self.origin):
            return {"url": url, "status": None, "error": "Off-host URL refused", "body": b"", "headers": {}}
        if url in self.cached_requests:
            cached = self.cached_requests[url]
            try:
                snapshot = self.backup / cached["snapshot_file"]
                body = gzip.decompress(snapshot.read_bytes())
                if hashlib.sha256(body).hexdigest() == cached["sha256"]:
                    return {**cached, "reused_snapshot": True, "body": body}
            except (OSError, ValueError, KeyError):
                pass
        record = {"url": url, "retrieved_at": datetime.now(timezone.utc).isoformat()}
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Encoding": "identity"})
            opener = urllib.request.build_opener(LocalRedirects(self.origin))
            with opener.open(request, timeout=self.args.timeout) as response:
                body = response.read(self.args.max_response_bytes + 1)
                if len(body) > self.args.max_response_bytes:
                    raise ValueError("Response exceeded configured byte limit")
                record.update(status=response.status, final_url=response.url,
                              headers={k.lower(): v for k, v in response.headers.items() if k.lower() in SAFE_HEADERS})
            record["sha256"] = hashlib.sha256(body).hexdigest()
            record["bytes"] = len(body)
            filename = hashlib.sha256(url.encode()).hexdigest()[:20] + ".gz"
            (self.backup / filename).write_bytes(gzip.compress(body, mtime=0))
            record["snapshot_file"] = filename
        except (urllib.error.URLError, ValueError, TimeoutError, OSError) as error:
            body = b""
            record.update(status=getattr(error, "code", None), error=str(error), headers={})
        time.sleep(self.args.delay)
        return {**record, "body": body}

    def fetch_many(self, urls):
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.args.concurrency) as pool:
            for response in pool.map(self.fetch, urls):
                self.requests.append({k: v for k, v in response.items() if k != "body"})
                yield response

    def add(self, url: str, source: str, kind="unknown", **fields):
        url = normalize_url(url, self.origin)
        if not url:
            return
        if url not in self.rows:
            decision, reason = provisional_classification(url, kind)
            self.rows[url] = {
                "url": url, "kind": kind, "title": "", "last_modified": "", "sources": set(),
                "proposed_action": decision, "target_url": "", "reason": reason,
                "review_status": "PENDING_EVIDENCE_REVIEW", "approved": "false",
                "gsc_clicks": "", "gsc_impressions": "", "referring_domains": "",
                "published_item_count": "",
            }
        row = self.rows[url]
        row["sources"].add(source)
        if urllib.parse.urlsplit(url).path == "/" and not urllib.parse.urlsplit(url).query:
            row["kind"] = "homepage"
        elif kind != "unknown":
            row["kind"] = kind
        row.update({k: v for k, v in fields.items() if v is not None and v != ""})

    def crawl_sitemaps(self, roots):
        pending, seen = set(roots), set()
        namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        while pending:
            batch = sorted(pending - seen)
            pending.clear()
            if not batch:
                break
            if len(seen) + len(batch) > self.args.max_sitemaps:
                raise ValueError("Sitemap safety limit exceeded; inspect index and increase --max-sitemaps explicitly")
            seen.update(batch)
            for response in self.fetch_many(batch):
                summary = {"url": response["url"], "status": response["status"], "entries": 0}
                try:
                    root = ElementTree.fromstring(response["body"])
                    if root.tag.endswith("sitemapindex"):
                        for loc in root.findall("s:sitemap/s:loc", namespace):
                            url = normalize_url(loc.text or "", self.origin)
                            if url:
                                pending.add(url)
                    elif root.tag.endswith("urlset"):
                        filename = urllib.parse.urlsplit(response["url"]).path
                        kind = "tag" if "post_tag" in filename else "category" if "category" in filename else "page" if "page-sitemap" in filename else "post" if "post-sitemap" in filename else "author" if "author-sitemap" in filename else "unknown"
                        for entry in root.findall("s:url", namespace):
                            loc = entry.find("s:loc", namespace)
                            modified = entry.find("s:lastmod", namespace)
                            if loc is not None and loc.text:
                                self.add(loc.text, response["url"], kind, last_modified=modified.text if modified is not None else "")
                                summary["entries"] += 1
                    else:
                        summary["error"] = "Unexpected XML root"
                except ElementTree.ParseError as error:
                    summary["error"] = str(error)
                self.sitemaps.append(summary)
            print(f"Sitemaps read: {len(seen)}; distinct URLs: {len(self.rows)}", flush=True)

    def rest_url(self, collection, page=1):
        query = urllib.parse.urlencode({"per_page": 100, "page": page, "orderby": "id", "order": "asc", "_fields": "id,link,title,modified_gmt,slug,count"})
        return f"{self.origin}/wp-json/wp/v2/{collection}?{query}"

    def crawl_rest(self):
        # Posts/pages cover public content omitted by indexability filters. Taxonomy
        # counts identify gaps without hundreds of redundant tag requests.
        for collection in ["posts", "pages", "categories", "tags"]:
            first = next(self.fetch_many([self.rest_url(collection)]))
            headers = first.get("headers", {})
            total = int(headers.get("x-wp-total", 0))
            pages = int(headers.get("x-wp-totalpages", 0))
            summary = {"reported_total": total, "reported_pages": pages, "fetched_pages": 0, "fetched_items": 0, "enumeration": "complete"}
            self.rest[collection] = summary
            entity_links = {}
            pages_to_fetch = pages if collection in {"posts", "pages", "categories"} else (pages if self.args.all_taxonomies else min(pages, 1))
            pages_to_fetch = min(pages_to_fetch, self.args.max_rest_pages)
            if pages_to_fetch < pages:
                summary["enumeration"] = "partial; remaining URLs rely on sitemaps"

            def consume(response):
                try:
                    items = json.loads(response["body"])
                    if not isinstance(items, list):
                        raise ValueError("REST response is not an array")
                    summary["fetched_pages"] += 1
                    summary["fetched_items"] += len(items)
                    kind = {"posts": "post", "pages": "page", "categories": "category", "tags": "tag"}[collection]
                    for item in items:
                        if item.get("link"):
                            entity_links.setdefault(item["link"], []).append({"id": item.get("id"), "published_item_count": item.get("count")})
                            self.add(item["link"], f"wp-rest:{collection}", kind,
                                     title=unescape(item.get("title", {}).get("rendered", "")),
                                     last_modified=item.get("modified_gmt", ""),
                                     published_item_count=item.get("count"))
                except (ValueError, TypeError, AttributeError) as error:
                    summary.setdefault("errors", []).append(str(error))
                    summary["enumeration"] = "incomplete; request or parse failed"

            consume(first)
            for response in self.fetch_many([self.rest_url(collection, page) for page in range(2, pages_to_fetch + 1)]):
                consume(response)
            summary["duplicate_links"] = [{"url": url, "entities": entities} for url, entities in entity_links.items() if len(entities) > 1]
            for duplicate in summary["duplicate_links"]:
                key = normalize_url(duplicate["url"], self.origin)
                if key in self.rows:
                    self.rows[key]["published_item_count"] = "ambiguous: duplicate entity IDs"
            print(f"REST {collection}: {summary['fetched_items']}/{total} items; distinct URLs: {len(self.rows)}", flush=True)

    def run(self):
        home, robots, rest_index = list(self.fetch_many([self.origin + "/", self.origin + "/robots.txt", self.origin + "/wp-json/"]))
        parser = PageMetadata()
        parser.feed(home["body"].decode("utf-8", "replace"))
        self.add(self.origin + "/", "homepage", "homepage", title=parser.title)
        for link in parser.links:
            self.add(link, "homepage-link")
        robots_text = robots["body"].decode("utf-8", "replace")
        roots = {self.origin + "/sitemap_index.xml"}
        roots.update(re.findall(r"(?im)^Sitemap:\s*(\S+)", robots_text))
        roots = [u for u in roots if normalize_url(u, self.origin)]
        self.crawl_sitemaps(roots)
        self.crawl_rest()
        self.write(home, robots_text, rest_index, parser)

    def write(self, home, robots_text, rest_index, parser):
        rows = sorted(self.rows.values(), key=lambda row: row["url"])
        buffer = io.StringIO(newline="")
        writer = csv.DictWriter(buffer, fieldnames=list(rows[0]))
        writer.writeheader()
        for row in rows:
            writer.writerow({**row, "sources": " | ".join(sorted(row["sources"]))})
        (self.output / "url-inventory.csv.gz").write_bytes(gzip.compress(buffer.getvalue().encode(), mtime=0))
        try:
            index = json.loads(rest_index["body"])
        except (ValueError, TypeError):
            index = {}
        summary = {
            "audit_version": VERSION, "started_at": self.started,
            "finished_at": datetime.now(timezone.utc).isoformat(), "origin": self.origin,
            "url_count": len(rows), "kinds": dict(Counter(r["kind"] for r in rows)),
            "provisional_actions": dict(Counter(r["proposed_action"] for r in rows)),
            "empty_taxonomies": sum(1 for r in rows if r["kind"] in {"tag", "category"} and r.get("published_item_count") == 0),
            "approved_actions": 0, "sitemaps": self.sitemaps, "rest_collections": self.rest,
            "http_requests": len(self.requests), "request_errors": [r for r in self.requests if r.get("error")],
            "reused_snapshots": sum(1 for r in self.requests if r.get("reused_snapshot")),
            "homepage": {"title": parser.title, "canonical": parser.canonical, "robots": parser.robots,
                         "generators": parser.generators, "headers": home.get("headers", {})},
            "wordpress": {k: index.get(k) for k in ["name", "description", "url", "home", "show_on_front", "namespaces"]},
            "coverage": {
                "sitemap_url_inventory": "Complete only if every listed sitemap succeeded; see sitemaps entries and errors.",
                "public_content_metadata": "Posts/pages REST pagination bounded by --max-rest-pages; counts are recorded.",
                "html_crawl": "Homepage links only; individual article HTML was not fetched.",
                "unknown_urls": "Server logs, Search Console, private/draft content, pagination, attachment variants, alternate hosts and unlinked URLs require host/export access.",
                "full_wordpress_backup": False,
            },
            "blockers": ["No WordPress admin/host access: database, media, plugins, themes, configuration and scheduled publisher backups unavailable.",
                         "No Search Console export or credentials supplied to crawler.", "No backlink export supplied to crawler.",
                         "All URL decisions need evidence review and approval before enforcement."],
        }
        (self.output / "crawl-summary.json").write_text(json.dumps(summary, indent=2) + "\n")
        (self.output / "robots.snapshot.txt").write_text(robots_text)
        (self.output / "request-manifest.json").write_text(json.dumps(self.requests, indent=2) + "\n")
        (self.backup / "manifest.json").write_text(json.dumps(self.requests, indent=2) + "\n")
        print(json.dumps({"url_count": len(rows), "kinds": summary["kinds"], "errors": len(summary["request_errors"]), "output": str(self.output)}), flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--origin", default="https://insightginie.com")
    parser.add_argument("--output", default="docs/legacy")
    parser.add_argument("--backup", default="backups/legacy")
    parser.add_argument("--concurrency", type=int, choices=range(1, 5), default=3)
    parser.add_argument("--timeout", type=float, default=30)
    parser.add_argument("--delay", type=float, default=0.15)
    parser.add_argument("--max-sitemaps", type=int, default=200)
    parser.add_argument("--max-rest-pages", type=int, default=150)
    parser.add_argument("--max-response-bytes", type=int, default=16 * 1024 * 1024)
    parser.add_argument("--all-taxonomies", action="store_true", help="Also paginate all REST tags; may require hundreds of requests")
    parser.add_argument("--reuse-snapshots", action="store_true", help="Reuse checksum-verified responses from the existing local backup manifest; retains original retrieval timestamps")
    args = parser.parse_args()
    if not normalize_url(args.origin, args.origin):
        parser.error("Origin must be an HTTP(S) URL without credentials")
    Crawler(args).run()


if __name__ == "__main__":
    main()
