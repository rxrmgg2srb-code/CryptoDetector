import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress test configuration - push the system beyond normal limits
export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp up to 100 users
    { duration: '3m', target: 200 }, // Ramp up to 200 users
    { duration: '2m', target: 300 }, // Push to 300 users
    { duration: '1m', target: 500 }, // Spike to 500 users
    { duration: '5m', target: 500 }, // Sustain 500 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s during stress
    http_req_failed: ['rate<0.05'], // Error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Stress test critical endpoints
  const endpoints = [
    '/api/leaderboard',
    '/api/global-stats',
    '/api/hot-feed',
    '/api/current-challenge',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`);

  check(res, {
    'status is 200 or 429 (rate limited)': (r) => r.status === 200 || r.status === 429,
    'response time acceptable under stress': (r) => r.timings.duration < 3000,
  });

  sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
}
