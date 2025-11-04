describe('validateVC', () => {
  let validateVC: typeof import('../../vc/validateVC').validateVC;

  beforeAll(async () => {
    process.env.VC_MIN_CRITERIA = JSON.stringify({
      allowUsers: ['allowed-user'],
      requiredFields: ['kycApproved']
    });
    jest.resetModules();
    ({ validateVC } = await import('../../vc/validateVC'));
  });

  it('approves user that satisfies criteria', async () => {
    const result = await validateVC({
      userId: 'allowed-user',
      tradeUid: 'trade-1',
      credential: { kycApproved: true }
    });
    expect(result).toEqual({ valid: true });
  });

  it('rejects user not on allow list', async () => {
    const result = await validateVC({
      userId: 'other-user',
      tradeUid: 'trade-1',
      credential: { kycApproved: true }
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('allow list');
  });

  it('rejects credential missing required fields', async () => {
    const result = await validateVC({
      userId: 'allowed-user',
      tradeUid: 'trade-1',
      credential: { }
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Missing required VC fields');
  });
});
