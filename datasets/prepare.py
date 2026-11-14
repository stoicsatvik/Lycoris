#!/usr/bin/env python3
"""Extract searchable text where appropriate, then create reproducible gzip derivatives."""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized" / "compressed"
DERIVED = ROOT / "derived" / "text"
TEXT_SUFFIXES = {".csv", ".json", ".jsonl", ".md", ".txt", ".xml", ".html"}
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".tif", ".tiff"}


def relative_to_raw(path: Path) -> Path:
    resolved = path.resolve()
    try:
        return resolved.relative_to(RAW.resolve())
    except ValueError as error:
        raise ValueError(f"{path} is outside {RAW}") from error


def gzip_file(source: Path, target: Path) -> tuple[int, str]:
    target.parent.mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256()
    with source.open("rb") as input_file, target.open("wb") as output_file:
        with gzip.GzipFile(filename="", mode="wb", fileobj=output_file, mtime=0) as archive:
            while chunk := input_file.read(64 * 1024):
                digest.update(chunk)
                archive.write(chunk)
    return source.stat().st_size, digest.hexdigest()


def extracted_text(source: Path, temporary: Path) -> str:
    if source.suffix.lower() in TEXT_SUFFIXES:
        shutil.copyfile(source, temporary)
        return "native-text"
    if source.suffix.lower() in IMAGE_SUFFIXES:
        if not shutil.which("tesseract"):
            raise RuntimeError("image OCR needs local tesseract; install it, then rerun")
        subprocess.run(["tesseract", str(source), str(temporary.with_suffix(""))], check=True)
        return "tesseract"
    if source.suffix.lower() == ".pdf":
        if not shutil.which("pdftotext"):
            raise RuntimeError("PDF text extraction needs local pdftotext; install Poppler, then rerun")
        subprocess.run(["pdftotext", "-layout", str(source), str(temporary)], check=True)
        if temporary.read_text(encoding="utf-8", errors="ignore").strip():
            return "pdftotext"
        if not shutil.which("ocrmypdf"):
            raise RuntimeError("scanned PDF needs local ocrmypdf plus Tesseract; install them, then rerun")
        searchable = temporary.with_suffix(".searchable.pdf")
        subprocess.run(["ocrmypdf", "--skip-text", str(source), str(searchable)], check=True)
        subprocess.run(["pdftotext", "-layout", str(searchable), str(temporary)], check=True)
        return "ocrmypdf+tesseract"
    raise ValueError(f"unsupported file type: {source.suffix}")


def prepare(source: Path, overwrite: bool = False) -> dict:
    relative = relative_to_raw(source)
    text_like = source.suffix.lower() in TEXT_SUFFIXES
    target_base = (NORMALIZED / relative) if text_like else (DERIVED / relative.with_suffix(relative.suffix + ".txt"))
    target = target_base.with_suffix(target_base.suffix + ".gz")
    receipt = target.with_suffix(target.suffix + ".receipt.json")
    if (target.exists() or receipt.exists()) and not overwrite:
        raise FileExistsError(f"{target} exists; pass --overwrite to replace it")

    with tempfile.TemporaryDirectory() as directory:
        extracted = Path(directory) / "extracted.txt"
        extractor = extracted_text(source, extracted)
        original_bytes, sha256 = gzip_file(extracted, target)
    evidence = {
        "source_path": str(relative),
        "output_path": str(target.relative_to(ROOT)),
        "source_sha256": hashlib.file_digest(source.open("rb"), "sha256").hexdigest(),
        "extracted_sha256": sha256,
        "source_bytes": source.stat().st_size,
        "extracted_bytes": original_bytes,
        "compressed_bytes": target.stat().st_size,
        "extractor": extractor,
    }
    receipt.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    return evidence


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="one file beneath datasets/raw")
    parser.add_argument("--all", action="store_true", help="prepare supported files beneath datasets/raw")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()
    if bool(args.input) == args.all:
        parser.error("choose exactly one of --input or --all")
    inputs = [args.input] if args.input else [path for path in RAW.rglob("*") if path.is_file()]
    for source in inputs:
        try:
            print(json.dumps(prepare(source, args.overwrite), sort_keys=True))
        except ValueError as error:
            if args.all and str(error).startswith("unsupported file type"):
                continue
            raise


if __name__ == "__main__":
    main()
