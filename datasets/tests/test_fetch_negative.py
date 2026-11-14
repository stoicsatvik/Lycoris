"""Negative-path tests for the allow-listed dataset fetch boundary.

All requests are mocked: these tests never download mission products.
"""
import hashlib
import importlib.util
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

FETCH = Path(__file__).parents[1] / "fetch.py"
SPEC = importlib.util.spec_from_file_location("dataset_fetch_negative", FETCH)
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class Response(io.BytesIO):
    def __init__(self, body, reported_length=None):
        super().__init__(body)
        self.headers = {} if reported_length is None else {"Content-Length": str(reported_length)}


def fixture(**changes):
    item = {
        "id": "fixture",
        "fetch_enabled": True,
        "url": "https://example.test/fixture",
        "output": "raw/catalog/fixture.txt",
        "max_bytes": 10,
        "sha256": None,
        "purpose": "offline fixture",
        "license_or_attribution": "test",
    }
    item.update(changes)
    return item


class NegativeFetchTests(unittest.TestCase):
    def test_disabled_source_rejected_without_network(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(module, "urlopen") as network:
            with self.assertRaisesRegex(ValueError, "not approved"):
                module.fetch(fixture(fetch_enabled=False), Path(tmp))
            network.assert_not_called()

    def test_http_and_parent_traversal_rejected_without_network(self):
        for changes in ({"url": "http://example.test/file"}, {"output": "../escape.txt"}):
            with self.subTest(changes=changes), tempfile.TemporaryDirectory() as tmp:
                with patch.object(module, "urlopen") as network:
                    with self.assertRaises(ValueError):
                        module.fetch(fixture(**changes), Path(tmp))
                    network.assert_not_called()

    def test_header_size_limit_rejects_without_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(module, "urlopen", return_value=Response(b"abc", reported_length=11)):
                with self.assertRaisesRegex(ValueError, "exceeds"):
                    module.fetch(fixture(), Path(tmp))
            self.assertFalse((Path(tmp) / "raw/catalog/fixture.txt").exists())

    def test_stream_size_limit_rejects_without_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(module, "urlopen", return_value=Response(b"eleven bytes")):
                with self.assertRaisesRegex(ValueError, "exceeded"):
                    module.fetch(fixture(), Path(tmp))
            self.assertFalse((Path(tmp) / "raw/catalog/fixture.txt").exists())

    def test_checksum_mismatch_preserves_existing_target(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "raw/catalog/fixture.txt"
            target.parent.mkdir(parents=True)
            target.write_bytes(b"original")
            with patch.object(module, "urlopen", return_value=Response(b"abc")):
                with self.assertRaisesRegex(ValueError, "checksum mismatch"):
                    module.fetch(fixture(sha256=hashlib.sha256(b"different").hexdigest()), Path(tmp), overwrite=True)
            self.assertEqual(target.read_bytes(), b"original")
            self.assertFalse(target.with_suffix(".txt.receipt.json").exists())

    def test_existing_target_requires_explicit_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "raw/catalog/fixture.txt"
            target.parent.mkdir(parents=True)
            target.write_bytes(b"original")
            with patch.object(module, "urlopen") as network:
                with self.assertRaises(FileExistsError):
                    module.fetch(fixture(), Path(tmp))
                network.assert_not_called()
            self.assertEqual(target.read_bytes(), b"original")


if __name__ == "__main__":
    unittest.main()
