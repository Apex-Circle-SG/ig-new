#!/usr/bin/env python3
"""Validate a reviewed migration map; never apply it to a server or CDN."""
from __future__ import annotations

import argparse
import csv
import gzip
import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit


def read_rows(path: Path):
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def validate(rows, origin="https://insightginie.com", require_approved=False):
    errors, approved = [], []
    seen = set()
    host = urlsplit(origin).hostname
    canonical_host = urlsplit(origin).netloc
    for index, row in enumerate(rows, start=2):
        label = f"row {index}"
        source = row.get("url", "")
        try:
            parsed = urlsplit(source)
            valid_source = (parsed.hostname == host and parsed.scheme in {"http", "https"}
                            and not parsed.username and not parsed.password and not parsed.fragment
                            and parsed.port in {None, 80, 443})
        except ValueError:
            valid_source = False
        if not valid_source:
            errors.append(f"{label}: invalid source URL")
        if source in seen:
            errors.append(f"{label}: duplicate source URL")
        seen.add(source)
        action = row.get("proposed_action")
        if action not in {"KEEP", "REDIRECT", "410"}:
            errors.append(f"{label}: invalid action")
        target = row.get("target_url", "")
        if action == "REDIRECT":
            try:
                dest = urlsplit(target)
                valid_target = (dest.scheme == "https" and dest.netloc == canonical_host
                                and not dest.username and not dest.password and not dest.query
                                and not dest.fragment and dest.path not in {"", "/"})
            except ValueError:
                valid_target = False
            if not valid_target:
                errors.append(f"{label}: redirect target must be a canonical HTTPS page, never the homepage")
            if source.rstrip("/") == target.rstrip("/"):
                errors.append(f"{label}: self redirect")
            if not row.get("equivalence_evidence", "").strip():
                errors.append(f"{label}: redirect needs genuine-equivalence evidence")
        elif target:
            errors.append(f"{label}: non-redirect action has a target")
        approved_value = row.get("approved", "false").lower()
        if approved_value not in {"true", "false"}:
            errors.append(f"{label}: approved must be true or false")
        if approved_value == "true":
            approved.append(row)
            for field in ["approved_by", "approved_at", "evidence_reference", "backup_manifest"]:
                if not row.get(field, "").strip():
                    errors.append(f"{label}: approved action requires {field}")
            if row.get("review_status") != "APPROVED":
                errors.append(f"{label}: approved row must have APPROVED review status")
            if row.get("approved_at"):
                try:
                    parsed_date = datetime.fromisoformat(row["approved_at"].replace("Z", "+00:00"))
                    if parsed_date.tzinfo is None:
                        raise ValueError("timezone missing")
                except ValueError:
                    errors.append(f"{label}: approved_at must be an ISO timestamp with timezone")
    approved_by_source = {row["url"]: row for row in approved}
    for row in approved:
        if row["proposed_action"] != "REDIRECT":
            continue
        destination = approved_by_source.get(row["target_url"])
        if destination and destination["proposed_action"] in {"REDIRECT", "410"}:
            errors.append(f"{row['url']}: target is redirected or gone; direct equivalent 200 target required")
    if require_approved and not approved:
        errors.append("No approved rows. Inventory must not be used as an enforcement map.")
    elif require_approved and len(approved) != len(rows):
        errors.append("Enforcement map contains unapproved rows. Export only reviewed, approved decisions.")
    return {"valid": not errors, "rows": len(rows), "approved_rows": len(approved), "errors": errors}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("map", type=Path)
    parser.add_argument("--origin", default="https://insightginie.com")
    parser.add_argument("--require-approved", action="store_true")
    args = parser.parse_args()
    result = validate(read_rows(args.map), args.origin, args.require_approved)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["valid"] else 1)


if __name__ == "__main__":
    main()
