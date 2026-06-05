import http from 'k6/http';
import { check } from 'k6';

// Spike test - sudden traffic surge
export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Normal load
    { duration: '10s', target: 1000 }, // SPIKE to 1000 users
    { duration: '30s', target: 1000 }, // Sustain spike
    { duration: '10s', target: 10 }, // Drop back
  ],
  thresholds: {
    http_req_duration: ['p(90)<5000'], // 90% under 5s during spike
    http_req_failed: ['rate<0.10'], // Error rate under 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(BASE_URL);

  check(res, {
    'survived spike': (r) => r.status === 200 || r.status === 503 || r.status === 429,
  });
}
