# Security Policy

## 🔒 Security Overview

DegenScore takes security seriously. This document outlines our security policy, how to report vulnerabilities, and what to expect from our security response process.

**Current Security Status**: 9.5/10 ([View Security Audit](./SECURITY_AUDIT.md))

## 🛡️ Supported Versions

We release security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| 1.x.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

## 🐛 Reporting a Vulnerability

We deeply appreciate security researchers and users who report vulnerabilities to us. All reports are thoroughly investigated.

### Where to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:

1. **Email**: security@degenscore.com
2. **Discord DM**: Contact `@security` in our [Discord server](https://discord.gg/degenscore)
3. **GitHub Security Advisories**: [Report here](https://github.com/rxrmgg2srb-code/DegenScore-Card/security/advisories/new)

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Full paths of source file(s) related to the manifestation of the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability (what an attacker could achieve)
- Any suggested fixes or mitigations

### What to Expect

When you submit a vulnerability report, you can expect:

1. **Acknowledgment**: Within 24 hours
2. **Initial Assessment**: Within 72 hours
3. **Status Updates**: Every 7 days until resolved
4. **Resolution Timeline**:
   - Critical: 7 days
   - High: 14 days
   - Medium: 30 days
   - Low: 90 days

### Disclosure Policy

- We follow **coordinated disclosure** principles
- We request that you give us reasonable time to fix the issue before public disclosure
- Once fixed, we will:
  1. Release a security patch
  2. Credit you in our security acknowledgments (unless you prefer to remain anonymous)
  3. Publish a security advisory with details

## 🏆 Bug Bounty Program

We run a bug bounty program to reward security researchers:

| Severity | Bounty Range    |
| -------- | --------------- |
| Critical | $1,000 - $5,000 |
| High     | $500 - $1,000   |
| Medium   | $100 - $500     |
| Low      | $50 - $100      |

**Scope**: All production systems and smart contracts
**Out of Scope**: Third-party services, social engineering, physical attacks

[Learn more about our bug bounty program →](./docs/BUG_BOUNTY.md)

## 🔐 Security Measures

DegenScore implements multiple layers of security:

### Smart Contract Security

- ✅ Anchor framework with built-in security checks
- ✅ On-chain validation for all critical operations
- ✅ Access control with PDA-based authorization
- ✅ Reentrancy guards on payment functions
- ✅ Third-party audit (planned Q1 2025)

### Web Application Security

- ✅ Strict Content Security Policy (CSP)
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ XSS Protection headers
- ✅ Input sanitization on all user inputs
- ✅ Rate limiting on API endpoints
- ✅ CSRF protection with Next.js built-in tokens
- ✅ Secure session management
- ✅ Environment variable protection

### API Security

- ✅ Rate limiting (100 req/min per IP)
- ✅ Input validation with Zod schemas
- ✅ Authentication via wallet signatures
- ✅ API key rotation for third-party services
- ✅ Error messages sanitized (no stack traces in production)

### Infrastructure Security

- ✅ Automated dependency scanning (npm audit)
- ✅ Secret detection in CI/CD (TruffleHog)
- ✅ Sentry error monitoring
- ✅ Database connection pooling with timeouts
- ✅ HTTPS-only (TLS 1.3)
- ✅ Regular backups (daily snapshots)

### Monitoring & Response

- ✅ Real-time error tracking (Sentry)
- ✅ Automated security scanning in CI/CD
- ✅ Log aggregation and analysis
- ✅ Incident response playbook (internal)
- ✅ 24/7 on-call security team

## 📋 Security Checklist for Contributors

Before submitting a PR, ensure:

- [ ] No secrets or API keys in code
- [ ] All user inputs are validated and sanitized
- [ ] SQL queries use parameterized statements (Prisma handles this)
- [ ] Authentication checks on protected routes
- [ ] Rate limiting on new API endpoints
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date (`npm audit`)
- [ ] No `eval()` or `innerHTML` usage
- [ ] CSP headers don't break new features
- [ ] Tests cover security-critical paths

## 🔍 Security Audit

We maintain a comprehensive security audit document:

- [View Security Audit →](./SECURITY_AUDIT.md)
- [View Security Improvements →](./SECURITY_IMPROVEMENTS.md)

Last updated: December 2024

## 📞 Contact

- **Security Email**: security@degenscore.com
- **General Contact**: hello@degenscore.com
- **Discord**: [discord.gg/degenscore](https://discord.gg/degenscore)

## 🙏 Acknowledgments

We thank the following security researchers for responsible disclosure:

_(No reports yet - be the first!)_

---

**Last Updated**: 2025-11-16
**Version**: 1.0.0
