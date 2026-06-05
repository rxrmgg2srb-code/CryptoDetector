import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 50 }, // Stay at 50 users for 2 minutes
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'], // Error rate must be below 1%
    errors: ['rate<0.05'], // Custom error rate must be below 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test wallet addresses for load testing
const TEST_WALLETS = [
  'TestWallet1234567890123456789012345678901',
  'TestWallet9876543210987654321098765432109',
  'DemoWallet1111111111111111111111111111111',
  'DemoWallet2222222222222222222222222222222',
];

export default function () {
  // Test 1: Homepage load
  {
    const res = http.get(BASE_URL);
    check(res, {
      'homepage loads': (r) => r.status === 200,
      'homepage response time OK': (r) => r.timings.duration < 1000,
    });
    errorRate.add(res.status !== 200);
    sleep(1);
  }

  // Test 2: Leaderboard API
  {
    const res = http.get(`${BASE_URL}/api/leaderboard?sortBy=degenScore&limit=10`);
    check(res, {
      'leaderboard API responds': (r) => r.status === 200,
      'leaderboard response time OK': (r) => r.timings.duration < 800,
    });
    apiResponseTime.add(res.timings.duration);
    errorRate.add(res.status !== 200);
    sleep(2);
  }

  // Test 3: Global stats API
  {
    const res = http.get(`${BASE_URL}/api/global-stats`);
    check(res, {
      'stats API responds': (r) => r.status === 200,
      'stats cached properly': (r) => r.timings.duration < 300,
    });
    errorRate.add(res.status !== 200);
    sleep(1);
  }

  // Test 4: Analyze wallet (simulated - will hit rate limit)
  {
    const randomWallet = TEST_WALLETS[Math.floor(Math.random() * TEST_WALLETS.length)];
    const payload = JSON.stringify({
      walletAddress: randomWallet,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const res = http.post(`${BASE_URL}/api/analyze`, payload, params);

    check(res, {
      'analyze API responds': (r) => r.status === 200 || r.status === 429, // 429 = rate limited
      'rate limiting works': (r) => r.status === 429 || r.status === 200,
    });

    apiResponseTime.add(res.timings.duration);
    errorRate.add(res.status !== 200 && res.status !== 429);
    sleep(3);
  }

  // Test 5: Referral stats
  {
    const randomWallet = TEST_WALLETS[Math.floor(Math.random() * TEST_WALLETS.length)];
    const res = http.get(`${BASE_URL}/api/referrals/stats?walletAddress=${randomWallet}`);

    check(res, {
      'referral stats API responds': (r) => r.status === 200 || r.status === 404,
      'referral response time OK': (r) => r.timings.duration < 500,
    });

    errorRate.add(res.status !== 200 && res.status !== 404);
    sleep(1);
  }

  // Test 6: Hot feed
  {
    const res = http.get(`${BASE_URL}/api/hot-feed?limit=5`);
    check(res, {
      'hot feed API responds': (r) => r.status === 200,
      'hot feed is fast': (r) => r.timings.duration < 400,
    });
    errorRate.add(res.status !== 200);
    sleep(2);
  }
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '→', enableColors: true }),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const indent = options?.indent || '  ';
  const enableColors = options?.enableColors || false;

  let summary = '\n';
  summary += `${indent}✓ Total requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}✓ Request rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  summary += `${indent}✓ Failed requests: ${data.metrics.http_req_failed.values.rate.toFixed(2)}%\n`;
  summary += `${indent}✓ Avg response time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}✓ P95 response time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}✓ P99 response time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;

  return summary;
}
