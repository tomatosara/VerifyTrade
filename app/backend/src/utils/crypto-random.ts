import crypto from 'crypto';

// Centralized, cryptographically secure randomness helpers for security-sensitive code paths.

/** Returns a cryptographically secure random byte buffer. */
export function secureRandomBytes(length: number): Buffer {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('length must be a positive integer');
  }
  return crypto.randomBytes(length);
}

/** Returns a cryptographically secure random integer in [0, maxExclusive). */
export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('maxExclusive must be a positive integer');
  }
  if (!Number.isSafeInteger(maxExclusive)) {
    throw new Error('maxExclusive must be a safe integer');
  }

  if (typeof crypto.randomInt === 'function') {
    return crypto.randomInt(0, maxExclusive);
  }

  // Fallback using rejection sampling to avoid modulo bias when randomInt is unavailable.
  const byteLength = Math.max(1, Math.ceil(Math.log2(maxExclusive) / 8));
  const maxGenerated = 2n ** (BigInt(byteLength) * 8n);
  const limit = maxGenerated - (maxGenerated % BigInt(maxExclusive));

  let candidate: bigint;
  do {
    const bytes = crypto.randomBytes(byteLength);
    candidate = bytes.reduce(
      (acc, value) => (acc << 8n) + BigInt(value),
      0n
    );
  } while (candidate >= limit);

  return Number(candidate % BigInt(maxExclusive));
}

/** Returns a hex token built from cryptographically secure random bytes. */
export function secureRandomToken(byteLength = 32): string {
  return secureRandomBytes(byteLength).toString('hex');
}
