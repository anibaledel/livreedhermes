"""Vecteurs croisés du format de transport Carter Python ↔ JavaScript."""

import json
from pathlib import Path
import subprocess
import unittest

from crypto_core import (
    _SYM_HEADER,
    _syms_to_bytes,
    _syms_to_header,
    max_payload_for,
    payload_to_symbols,
)


ROOT = Path(__file__).resolve().parent.parent
JS_VECTOR = ROOT / 'js' / 'test_interop_transport.mjs'


def run_js(vector):
    result = subprocess.run(
        ['node', '--experimental-default-type=module', str(JS_VECTOR)],
        input=json.dumps(vector), text=True, capture_output=True,
        cwd=ROOT, check=True,
    )
    return json.loads(result.stdout)


class TestJavaScriptTransportInterop(unittest.TestCase):
    def test_python_to_js_preserves_empty_and_capacity_limit_payloads(self):
        """Le JS relit l'en-tête N1 et les symboles produits par Python."""
        capacity = max_payload_for(200)
        for payload in (b'', bytes(range(capacity))):
            with self.subTest(payload_len=len(payload)):
                symbols = payload_to_symbols(payload)
                decoded = run_js({'operation': 'decode', 'symbols': symbols})
                self.assertEqual(decoded['length'], len(payload))
                self.assertEqual(bytes(decoded['payload']), payload)

    def test_js_to_python_preserves_empty_and_capacity_limit_payloads(self):
        """Python relit l'en-tête N1 et les symboles produits par le JS."""
        capacity = max_payload_for(200)
        for payload in (b'', bytes(range(capacity))):
            with self.subTest(payload_len=len(payload)):
                encoded = run_js({'operation': 'encode', 'payload': list(payload)})
                symbols = encoded['symbols']
                length = _syms_to_header(symbols[:_SYM_HEADER])
                self.assertEqual(length, len(payload))
                self.assertEqual(
                    _syms_to_bytes(symbols[_SYM_HEADER:], length), payload
                )


if __name__ == '__main__':
    unittest.main()
