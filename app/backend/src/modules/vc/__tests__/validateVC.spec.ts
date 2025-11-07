import { validateVC } from '../validateVC';

jest.mock('@config/featureFlags', () => ({
  featureFlags: {
    vcMinCriteria: {}
  }
}));

const baseInput = {
  userId: 'user-1',
  tradeUid: 'trade-1'
};

describe('validateVC claim normalization', () => {
  it('keeps plain string claims', async () => {
    const result = await validateVC({
      ...baseInput,
      vcProof: { claims: ['name', 'age'] }
    });

    expect(result.valid).toBe(true);
    expect(result.claims).toEqual(['name', 'age']);
  });

  it('filters out non-string entries from claim arrays', async () => {
    const result = await validateVC({
      ...baseInput,
      vcProof: { claims: ['name', 42, 'region'] }
    });

    expect(result.claims).toEqual(['name', 'region']);
  });

  it('uses record keys when claims are provided as an object', async () => {
    const result = await validateVC({
      ...baseInput,
      vcProof: {
        claims: {
          isAdult: true,
          region: 'TW',
          ignored: false
        }
      }
    });

    expect(result.claims).toEqual(['isAdult', 'region']);
  });

  it('falls back to an empty list when claims are missing', async () => {
    const result = await validateVC({
      ...baseInput,
      vcProof: {}
    });

    expect(result.claims).toEqual([]);
  });
});
