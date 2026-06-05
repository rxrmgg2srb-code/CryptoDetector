// Integration Test: Referral Flow E2E
describe('Integration: Referral Flow', () => {
  const referrer = 'alice-wallet';
  const referee = 'bob-wallet';

  it('should complete full referral flow', async () => {
    // 1. Generate referral code
    const code = await generateReferralCode(referrer);
    expect(code).toHaveLength(8);

    // 2. Track referral signup
    await trackReferral(code, referee);

    // 3. Verify tracking
    const referrals = await getReferrals(referrer);
    expect(referrals).toContainEqual(expect.objectContaining({ referee }));

    // 4. Award rewards
    await awardReferralReward(referrer, referee);

    // 5. Claim rewards
    const claimed = await claimRewards(referrer);
    expect(claimed.amount).toBeGreaterThan(0);
  }, 30000);

  it('should prevent circular referrals', async () => {
    const code1 = await generateReferralCode('user1');
    const code2 = await generateReferralCode('user2');

    await trackReferral(code1, 'user2');
    await expect(trackReferral(code2, 'user1')).rejects.toThrow(/circular/i);
  });

  it('should handle multi-tier rewards', async () => {
    // Tier 1: alice refers bob
    await trackReferral(await generateReferralCode('alice'), 'bob');

    // Tier 2: bob refers charlie
    await trackReferral(await generateReferralCode('bob'), 'charlie');

    const aliceRewards = await getPendingRewards('alice');
    expect(aliceRewards.tier1).toBeGreaterThan(0);
    expect(aliceRewards.tier2).toBeGreaterThan(0);
  });

  it('should track referral conversion', async () => {
    const code = await generateReferralCode(referrer);
    await trackReferral(code, referee);

    // Referee generates card (conversion)
    await generateCard(referee);

    const stats = await getReferralStats(referrer);
    expect(stats.conversions).toBe(1);
  });

  it('should limit rewards per referrer', async () => {
    const code = await generateReferralCode(referrer);

    for (let i = 0; i < 150; i++) {
      await trackReferral(code, `user-${i}`);
    }

    const rewards = await getPendingRewards(referrer);
    expect(rewards.total).toBeLessThanOrEqual(MAX_REFERRAL_REWARDS);
  });

  it('should handle referral attribution window', async () => {
    jest.useFakeTimers();

    const code = await generateReferralCode(referrer);
    await trackReferral(code, referee);

    jest.advanceTimersByTime(31 * 24 * 60 * 60 * 1000); // 31 days

    await generateCard(referee);
    const stats = await getReferralStats(referrer);
    expect(stats.conversions).toBe(0); // Outside attribution window

    jest.useRealTimers();
  });

  it('should track referral source', async () => {
    const code = await generateReferralCode(referrer);
    await trackReferral(code, referee, { source: 'twitter' });

    const sources = await getReferralSources(referrer);
    expect(sources.twitter).toBe(1);
  });

  it('should handle bulk referral operations', async () => {
    const code = await generateReferralCode(referrer);

    const refs = Array(50)
      .fill(null)
      .map((_, i) => trackReferral(code, `user-${i}`));
    await Promise.all(refs);

    const count = await getReferralCount(referrer);
    expect(count).toBe(50);
  });

  it('should update referrer leaderboard', async () => {
    await trackReferral(await generateReferralCode('user1'), 'ref1');
    await trackReferral(await generateReferralCode('user1'), 'ref2');

    const leaderboard = await getReferralLeaderboard({ limit: 10 });
    expect(leaderboard[0].wallet).toBe('user1');
  });

  it('should expire unclaimed rewards', async () => {
    jest.useFakeTimers();

    await trackReferral(await generateReferralCode(referrer), referee);
    await awardReferralReward(referrer, referee);

    jest.advanceTimersByTime(91 * 24 * 60 * 60 * 1000); // 91 days

    await expireOldRewards();
    const pending = await getPendingRewards(referrer);
    expect(pending.total).toBe(0);

    jest.useRealTimers();
  });
});
