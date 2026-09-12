import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALPHA_LEN,
  SYM_HEADER,
  decrypt,
  encrypt,
  headerToSyms,
  payloadToSymbols,
  symsToHeader,
} from './crypto_core.js';

const key = new Uint8Array(32).fill(7);

test('N1 header keeps its length while covering all 44 low symbols', () => {
  const counts = [
    new Array(ALPHA_LEN).fill(0),
    new Array(ALPHA_LEN).fill(0),
  ];
  const sampleCount = 120_000;
  for (let index = 0; index < sampleCount; index++) {
    const header = headerToSyms(12_345);
    assert.equal(header.length, SYM_HEADER);
    assert.equal(symsToHeader(header), 12_345);
    counts[0][header[0]]++;
    counts[1][header[1]]++;
  }
  for (const frequency of counts) {
    assert.equal(frequency.filter(Boolean).length, ALPHA_LEN);
    const expected = sampleCount / ALPHA_LEN;
    const chiSquare = frequency.reduce(
      (sum, count) => sum + ((count - expected) ** 2 / expected), 0,
    );
    assert.ok(chiSquare < 100, `distribution non uniforme: χ²=${chiSquare}`);
  }
});

test('Carter transport handles an empty payload and its largest legal header', () => {
  const empty = payloadToSymbols(new Uint8Array());
  assert.equal(symsToHeader(empty.slice(0, SYM_HEADER)), 0);

  const largest = headerToSyms(0xffffffff);
  assert.equal(symsToHeader(largest), 0xffffffff);
});

test('authentication rejects a wrong key and one corrupted Carter symbol', async () => {
  const payload = await encrypt('', key);
  const symbols = payloadToSymbols(payload);

  await assert.rejects(() => decrypt(symbols, new Uint8Array(32).fill(8)));

  const corrupted = [...symbols];
  corrupted[SYM_HEADER] = (corrupted[SYM_HEADER] + 1) % ALPHA_LEN;
  await assert.rejects(() => decrypt(corrupted, key));
});
