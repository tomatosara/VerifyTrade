import crypto from 'crypto';
import { secureRandomBytes, secureRandomInt, secureRandomToken } from './crypto-random';

describe('secure randomness helpers', () => {
  describe('secureRandomBytes', () => {
    it('returns a Buffer of the requested length', () => {
      const bytes = secureRandomBytes(16);
      expect(Buffer.isBuffer(bytes)).toBe(true);
      expect(bytes).toHaveLength(16);
    });

    it('rejects invalid lengths', () => {
      expect(() => secureRandomBytes(0)).toThrow();
      expect(() => secureRandomBytes(-1)).toThrow();
      expect(() => secureRandomBytes(1.5)).toThrow();
    });
  });

  describe('secureRandomInt', () => {
    it('delegates to crypto.randomInt when available', () => {
      const spy = jest.spyOn(crypto, 'randomInt');
      const value = secureRandomInt(10);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(10);
      expect(spy).toHaveBeenCalledWith(0, 10);
      spy.mockRestore();
    });

    it('produces unbiased values when randomInt is unavailable', () => {
      const original = crypto.randomInt;
      // @ts-expect-error - simulate runtime without randomInt
      crypto.randomInt = undefined;

      const values = new Set<number>();
      for (let i = 0; i < 100; i += 1) {
        const value = secureRandomInt(5);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(5);
        values.add(value);
      }

      // Expect multiple distinct outputs to ensure rejection sampling exercised.
      expect(values.size).toBeGreaterThan(1);
      crypto.randomInt = original;
    });

    it('rejects invalid bounds', () => {
      expect(() => secureRandomInt(0)).toThrow();
      expect(() => secureRandomInt(-1)).toThrow();
      expect(() => secureRandomInt(1.2)).toThrow();
    });
  });

  describe('secureRandomToken', () => {
    it('returns a hex token of the expected length', () => {
      const token = secureRandomToken(12);
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(24);
    });
  });
});
