// Integration Test: E2E Card Generation Flow
import { analyzeWallet, generateCard, saveCard } from '@/lib/integration-helpers';

describe('Integration: Card Generation Flow', () => {
  const testWallet = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

  it('should complete full card generation flow', async () => {
    const analysis = await analyzeWallet(testWallet);
    expect(analysis).toHaveProperty('degenScore');

    const card = await generateCard(analysis);
    expect(card).toHaveProperty('imageUrl');

    const saved = await saveCard(testWallet, card);
    expect(saved).toHaveProperty('id');
  }, 30000);

  it('should handle analysis failures gracefully', async () => {
    await expect(analyzeWallet('invalid-wallet')).rejects.toThrow();
  });

  it('should cache analysis results', async () => {
    const first = await analyzeWallet(testWallet);
    const second = await analyzeWallet(testWallet);
    expect(first).toEqual(second);
  });

  it('should generate different card styles', async () => {
    const analysis = await analyzeWallet(testWallet);
    const basic = await generateCard(analysis, { premium: false });
    const premium = await generateCard(analysis, { premium: true });
    expect(basic.imageUrl).not.toEqual(premium.imageUrl);
  });

  it('should save metadata with card', async () => {
    const analysis = await analyzeWallet(testWallet);
    const card = await generateCard(analysis);
    const saved = await saveCard(testWallet, card);
    expect(saved.metadata).toHaveProperty('degenScore');
    expect(saved.metadata).toHaveProperty('totalTrades');
  });

  it('should update user analytics', async () => {
    await analyzeWallet(testWallet);
    const stats = await getUserAnalytics(testWallet);
    expect(stats.cardsGenerated).toBeGreaterThan(0);
  });

  it('should trigger achievements', async () => {
    await analyzeWallet(testWallet);
    const badges = await getUserBadges(testWallet);
    expect(badges).toContainEqual(expect.objectContaining({ badgeId: 'first-card' }));
  });

  it('should handle concurrent requests', async () => {
    const promises = Array(5)
      .fill(null)
      .map(() => analyzeWallet(testWallet));
    const results = await Promise.all(promises);
    expect(results).toHaveLength(5);
  });

  it('should validate card before saving', async () => {
    await expect(saveCard(testWallet, { invalidCard: true })).rejects.toThrow();
  });

  it('should clean up temporary files', async () => {
    const analysis = await analyzeWallet(testWallet);
    const card = await generateCard(analysis);
    await saveCard(testWallet, card);
    // Verify temp files cleaned
    expect(fs.existsSync('/tmp/card-temp-*')).toBe(false);
  });
});
