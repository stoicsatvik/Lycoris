import importlib.util
import gzip
import json
import tempfile
import unittest
from pathlib import Path

PREPARE = Path(__file__).parents[1] / "prepare.py"
SPEC = importlib.util.spec_from_file_location("dataset_prepare", PREPARE)
dataset_prepare = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(dataset_prepare)


class PrepareTest(unittest.TestCase):
    def test_text_file_is_reproducibly_compressed_with_receipt(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            raw = root / "raw"
            source = raw / "sample.csv"
            source.parent.mkdir()
            source.write_text("sol,pressure_pa\n1,700\n", encoding="utf-8")
            original = (dataset_prepare.ROOT, dataset_prepare.RAW, dataset_prepare.NORMALIZED, dataset_prepare.DERIVED)
            try:
                dataset_prepare.ROOT = root
                dataset_prepare.RAW = raw
                dataset_prepare.NORMALIZED = root / "normalized/compressed"
                dataset_prepare.DERIVED = root / "derived/text"
                receipt = dataset_prepare.prepare(source)
                output = root / receipt["output_path"]
                self.assertEqual(gzip.decompress(output.read_bytes()), source.read_bytes())
                self.assertEqual(json.loads(output.with_suffix(".gz.receipt.json").read_text())["extractor"], "native-text")
            finally:
                dataset_prepare.ROOT, dataset_prepare.RAW, dataset_prepare.NORMALIZED, dataset_prepare.DERIVED = original


if __name__ == "__main__":
    unittest.main()
