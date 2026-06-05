// Mock for the 'uncrypto' package used by @upstash/redis
// Provides the same API surface expected by the library using Node's built‑in crypto.
const crypto = require('crypto');

module.exports = {
  // default export (the crypto module itself)
  default: crypto,
  // getRandomValues mimics the Web Crypto API using Node's randomFillSync
  getRandomValues: (typedArray) => crypto.randomFillSync(typedArray),
  // randomUUID uses Node's built‑in implementation (available in recent Node versions)
  randomUUID: () => crypto.randomUUID(),
  // subtle provides the Web Crypto SubtleCrypto interface (via Node's webcrypto)
  subtle: crypto.webcrypto.subtle,
};
