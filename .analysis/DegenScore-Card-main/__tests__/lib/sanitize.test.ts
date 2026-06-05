import React from 'react';
import { sanitizeInput, sanitizeString, sanitizeHTML, sanitizeURL } from '@/lib/sanitize';

describe('sanitize', () => {
  describe('sanitizeString', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).not.toContain('<script>');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });

    it('should preserve safe text', () => {
      expect(sanitizeString('Hello World')).toBe('Hello World');
    });

    it('should remove SQL injection attempts', () => {
      const malicious = "'; DROP TABLE users; --";
      const result = sanitizeString(malicious);
      expect(result).not.toContain('DROP TABLE');
    });

    it('should handle unicode characters', () => {
      expect(sanitizeString('Hello 世界 🌍')).toBe('Hello 世界 🌍');
    });

    it('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
    });

    it('should handle very long strings', () => {
      const long = 'a'.repeat(10000);
      const result = sanitizeString(long);
      expect(result.length).toBeLessThanOrEqual(10000);
    });

    it('should remove null bytes', () => {
      expect(sanitizeString('test\0test')).not.toContain('\0');
    });
  });

  describe('sanitizeHTML', () => {
    it('should strip all HTML tags', () => {
      expect(sanitizeHTML('<div>test</div>')).toBe('test');
    });

    it('should handle nested tags', () => {
      expect(sanitizeHTML('<div><span>test</span></div>')).toBe('test');
    });

    it('should remove script tags completely', () => {
      expect(sanitizeHTML('<script>alert(1)</script>test')).toBe('test');
    });

    it('should handle malformed HTML', () => {
      expect(sanitizeHTML('<div><span>test</div>')).toBe('test');
    });

    it('should preserve text content', () => {
      expect(sanitizeHTML('plain text')).toBe('plain text');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow valid HTTP URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
    });

    it('should block javascript: URLs', () => {
      expect(sanitizeURL('javascript:alert(1)')).toBe('');
    });

    it('should block data: URLs', () => {
      expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should handle relative URLs', () => {
      expect(sanitizeURL('/path/to/page')).toBe('/path/to/page');
    });

    it('should validate URL format', () => {
      expect(sanitizeURL('not a url')).toBe('');
    });

    it('should preserve query parameters', () => {
      expect(sanitizeURL('https://example.com?param=value')).toContain('param=value');
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize object properties', () => {
      const input = {
        name: '<script>alert(1)</script>',
        value: 'safe',
      };
      const result = sanitizeInput(input);
      expect(result.name).not.toContain('<script>');
      expect(result.value).toBe('safe');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<b>test</b>',
        },
      };
      const result = sanitizeInput(input);
      expect(result.user.name).not.toContain('<b>');
    });

    it('should handle arrays', () => {
      const input = ['<script>1</script>', 'safe'];
      const result = sanitizeInput(input);
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('safe');
    });

    it('should preserve numbers and booleans', () => {
      const input = { num: 123, bool: true };
      const result = sanitizeInput(input);
      expect(result.num).toBe(123);
      expect(result.bool).toBe(true);
    });
  });
});
