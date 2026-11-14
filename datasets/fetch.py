#!/usr/bin/env python3
"""Fetch only the small, explicitly allow-listed dataset catalog artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "catalog" / "sources.json"
CHUNK_BYTES = 64 * 1024


def load_sources() -> list[dict]:
    return json.loads(MANIFEST.read_text(encoding="utf-8"))["sources"]


def validate(item: dict) -> Path:
    if not item.get("fetch_enabled"):
        raise ValueError(f"{item['id']} is not approved for automated fetching")
    parsed = urlparse(item["url"])
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError(f"{item['id']} must use an HTTPS URL")
    relative = Path(item["output"])
    if relative.is_absolute() or ".." in relative.parts:
        raise ValueError(f"{item['id']} has an unsafe output path")
    return relative


def fetch(item: dict, destination_root: Path, overwrite: bool = False) -> dict:
    relative = validate(item)
    target = destination_root / relative
    if target.exists() and not overwrite:
        raise FileExistsError(f"{target} exists; pass --overwrite to replace it")
    target.parent.mkdir(parents=True, exist_ok=True)

    limit = int(item["max_bytes"])
    digest = hashlib.sha256()
    written = 0
    temporary = NamedTemporaryFile(dir=target.parent, delete=False)
    temporary_path = Path(temporary.name)
    try:
        with temporary, urlopen(Request(item["url"], headers={"User-Agent": "Lycoris-dataset-fetch/1.0"}), timeout=30) as response:
            length = response.headers.get("Content-Length")
            if length and int(length) > limit:
                raise ValueError(f"{item['id']} exceeds its {limit}-byte limit")
            while chunk := response.read(CHUNK_BYTES):
                written += len(chunk)
                if written > limit:
                    raise ValueError(f"{item['id']} exceeded its {limit}-byte limit")
                digest.update(chunk)
                temporary.write(chunk)
        expected = item.get("sha256")
        if expected and digest.hexdigest() != expected:
            raise ValueError(f"{item['id']} checksum mismatch")
        os.replace(temporary_path, target)
    except Exception:
        temporary_path.unlink(missing_ok=True)
        raise

    receipt = {
        "source_id": item["id"],
        "url": item["url"],
        "sha256": digest.hexdigest(),
        "bytes": written,
        "license_or_attribution": item["license_or_attribution"],
        "purpose": item["purpose"],
    }
    target.with_suffix(target.suffix + ".receipt.json").write_text(
        json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
    )
    return receipt


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--id", help="fetch one source ID")
    parser.add_argument("--all", action="store_true", help="fetch every allow-listed source")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    if bool(args.id) == args.all:
        parser.error("choose exactly one of --id or --all")

    sources = load_sources()
    selected = [item for item in sources if item["id"] == args.id] if args.id else [item for item in sources if item["fetch_enabled"]]
    if not selected:
        parser.error("no matching source")
    for item in selected:
        print(json.dumps(fetch(item, ROOT, args.overwrite), sort_keys=True))


if __name__ == "__main__":
    main()
