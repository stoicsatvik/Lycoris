# Scientific datasets

Purpose: maintain a traceable boundary between external measurements and Lycoris modeling assumptions.

## Stages

- `catalog/` — source registry, discovery notes, data-product metadata, and acquisition requirements.
- `raw/` — original immutable source files; large source archives stay with their official host.
- `normalized/` — coordinate-, unit-, and time-normalized derivative copies.
- `derived/` — calculated products such as slope fields, route graphs, and sampled environmental context.
- `validation/` — independent reference fixtures, quality audits, and source-comparison records.

## Fetching

`python3 datasets/fetch.py --all` fetches only the two small, allow-listed catalog indexes in `catalog/sources.json`. A receipt beside each fetched file records its URL, retrieval hash, byte count, attribution, and purpose.

Raw RAD/REMS products and Mars terrain imagery are deliberately disabled until an exact product URL, product ID/version, checksum, QA plan, and permitted-use record are added to the manifest. This prevents an accidental bulk copy of NASA/USGS archives.

## Mandatory provenance

Record mission, instrument, exact product ID/version, source URL, acquisition and processing time, coordinate frame, geospatial extent, spatial and temporal resolution, units, missing-data flags, quality measures, checksum, license/attribution, uncertainty, and permitted uses.

Do not label historical observations as current conditions or consider visualization tiles equivalent to quantitative terrain data.


## One-time extraction and compression

`python3 datasets/prepare.py --all` creates reproducible `.gz` derivatives without altering any original file:

- CSV, JSON, Markdown, XML, HTML and text files are compressed under `normalized/compressed/`.
- PDFs with embedded text are extracted with local `pdftotext`; scanned PDFs use `ocrmypdf`/Tesseract when available.
- PNG, JPEG and TIFF images use local Tesseract OCR.
- Every derivative has a receipt containing input/output hashes, byte counts and the extraction method.

OCR is intentionally never applied to numeric scientific tables. It is only for documents and scanned imagery; preserve source products unchanged.
