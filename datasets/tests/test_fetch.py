import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

FETCH = Path(__file__).parents[1] / "fetch.py"
SPEC = importlib.util.spec_from_file_location("dataset_fetch", FETCH)
dataset_fetch = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(dataset_fetch)


class Response(io.BytesIO):
    headers = {"Content-Length": "3"}

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


class FetchTest(unittest.TestCase):
    def test_fetch_writes_data_and_receipt(self):
        item = {
            "id": "fixture",
            "fetch_enabled": True,
            "url": "https://example.test/fixture",
            "output": "raw/catalog/fixture.txt",
            "max_bytes": 10,
            "sha256": None,
            "purpose": "test",
            "license_or_attribution": "test",
        }
        with tempfile.TemporaryDirectory() as directory, patch.object(dataset_fetch, "urlopen", return_value=Response(b"abc")):
            receipt = dataset_fetch.fetch(item, Path(directory))
            self.assertEqual(receipt["bytes"], 3)
            self.assertEqual((Path(directory) / item["output"]).read_bytes(), b"abc")
            self.assertEqual(json.loads((Path(directory) / "raw/catalog/fixture.txt.receipt.json").read_text())["source_id"], "fixture")


if __name__ == "__main__":
    unittest.main()
