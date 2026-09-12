import { readFileSync } from 'node:fs';

import {
  SYM_HEADER,
  payloadToSymbols,
  symsToBytes,
  symsToHeader,
} from './crypto_core.js';

const input = JSON.parse(readFileSync(0, 'utf8'));

if (input.operation === 'decode') {
  const length = symsToHeader(input.symbols.slice(0, SYM_HEADER));
  const payload = symsToBytes(input.symbols.slice(SYM_HEADER), length);
  process.stdout.write(JSON.stringify({ length, payload: [...payload] }));
} else if (input.operation === 'encode') {
  process.stdout.write(JSON.stringify({
    symbols: payloadToSymbols(Uint8Array.from(input.payload)),
  }));
} else {
  throw new Error(`Operation d'interopérabilité inconnue : ${input.operation}`);
}
