// Centralized helpers for cryptographically secure randomness in the browser.

const getCrypto = () => {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure randomness unavailable: crypto.getRandomValues is required');
  }
  return crypto;
};

/** Returns a cryptographically secure random number in [0, 1). */
export function secureRandomFloat(): number {
  const webCrypto = getCrypto();
  const array = new Uint32Array(1);
  webCrypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

const fillBytes = (buffer: Uint8Array): Uint8Array => {
  const webCrypto = getCrypto();
  return webCrypto.getRandomValues(buffer);
};

/** Returns cryptographically secure random bytes. */
export function secureRandomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('length must be a positive integer');
  }
  const buffer = new Uint8Array(length);
  return fillBytes(buffer);
}

/** Returns a cryptographically secure random integer in [0, maxExclusive). */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer');
  }
  if (!Number.isSafeInteger(maxExclusive)) {
    throw new Error('maxExclusive must be a safe integer');
  }

  const byteLength = Math.max(1, Math.ceil(Math.log2(maxExclusive) / 8));
  const maxGenerated = 2n ** (BigInt(byteLength) * 8n);
  const limit = maxGenerated - (maxGenerated % BigInt(maxExclusive));

  let candidate: bigint;
  do {
    const bytes = fillBytes(new Uint8Array(byteLength));
    candidate = bytes.reduce(
      (acc, value) => (acc << 8n) + BigInt(value),
      0n
    );
  } while (candidate >= limit);

  return Number(candidate % BigInt(maxExclusive));
}

/** Returns a hex token built from cryptographically secure random bytes. */
export function secureRandomToken(byteLength = 32): string {
  return Array.from(secureRandomBytes(byteLength))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}
