import React from 'react';
import { sanitizeInput } from '@/lib/sanitize';

describe('Security: Injection Attacks', () => {
  it('should sanitize SQL injection attempts', () => {
    const input = "'; DROP TABLE users; --";
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('DROP TABLE');
  });

  it('should sanitize XSS attempts', () => {
    const input = "<script>alert('xss')</script>";
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('<script>');
  });

  it('should sanitize command injection', () => {
    const input = '; rm -rf /';
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('rm -rf');
  });
});
