// Minimal mock for @upstash/redis used in tests
// Implements only the methods that the project uses (get, set, del, etc.)
class MockRedis {
  constructor() {
    this.store = new Map();
  }
  async get(key) {
    return this.store.get(key) ?? null;
  }
  async set(key, value, _options) {
    this.store.set(key, value);
    return 'OK';
  }
  async del(key) {
    this.store.delete(key);
    return 1;
  }
  // Add any additional methods if needed by the codebase
}
module.exports = MockRedis;
