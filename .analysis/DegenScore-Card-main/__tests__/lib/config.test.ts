import { config } from '@/lib/config';

describe('config', () => {
  it('should have database URL', () => {
    expect(config.database).toHaveProperty('url');
  });

  it('should have Redis config', () => {
    expect(config.redis).toHaveProperty('url');
  });

  it('should have Helius API key', () => {
    expect(config.helius).toHaveProperty('apiKey');
  });

  it('should have JWT secret', () => {
    expect(config.auth).toHaveProperty('jwtSecret');
  });

  it('should have rate limit settings', () => {
    expect(config.rateLimit).toHaveProperty('maxRequests');
    expect(config.rateLimit).toHaveProperty('windowMs');
  });

  it('should have environment', () => {
    expect(config.env).toMatch(/development|production|test/);
  });

  it('should have CORS origins', () => {
    expect(config.cors).toHaveProperty('origins');
    expect(Array.isArray(config.cors.origins)).toBe(true);
  });

  it('should have S3 config', () => {
    expect(config.storage).toHaveProperty('bucket');
  });

  it('should validate environment variables', () => {
    expect(() => config.validate()).not.toThrow();
  });

  it('should have feature flags', () => {
    expect(config.features).toHaveProperty('enableReferrals');
    expect(config.features).toHaveProperty('enablePremium');
  });
});
