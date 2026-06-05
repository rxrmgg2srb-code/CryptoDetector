# Contributing to DegenScore

First off, thank you for considering contributing to DegenScore! 🎉

It's people like you that make DegenScore such a great tool for the Solana community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Requirements](#testing-requirements)
- [Community](#community)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to hello@degenscore.com.

## 🤝 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/rxrmgg2srb-code/DegenScore-Card/issues) to avoid duplicates.

When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed** and what you expected
- **Include your environment details** (OS, browser, Node version)

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) when creating issues.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the proposed functionality
- **Explain why this enhancement would be useful** to most users
- **List any alternatives you've considered**

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) when suggesting features.

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `documentation` - Improvements or additions to documentation

### Security Vulnerabilities

**DO NOT** report security vulnerabilities through public GitHub issues. See our [Security Policy](SECURITY.md) for responsible disclosure.

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **PostgreSQL**: v14 or higher (for local development)
- **Solana CLI**: v1.16+ (for smart contract development)

### Initial Setup

1. **Fork the repository** on GitHub

2. **Clone your fork locally**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/DegenScore-Card.git
   cd DegenScore-Card
   ```

3. **Add upstream remote**:

   ```bash
   git remote add upstream https://github.com/rxrmgg2srb-code/DegenScore-Card.git
   ```

4. **Install dependencies**:

   ```bash
   npm install
   ```

5. **Copy environment variables**:

   ```bash
   cp .env.example .env.local
   ```

   Then fill in the required values (see [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md))

6. **Set up the database**:

   ```bash
   npx prisma migrate dev
   npx prisma db seed  # (if seed script exists)
   ```

7. **Run the development server**:

   ```bash
   npm run dev
   ```

8. **Open [http://localhost:3000](http://localhost:3000)** in your browser

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

## 🔄 Pull Request Process

### Before You Start

1. **Check existing PRs** to avoid duplicates
2. **Create an issue first** for major changes (so we can discuss the approach)
3. **Work on a feature branch**, never on `main`

### Branch Naming Convention

Use descriptive branch names:

- `feature/add-leaderboard` - New features
- `fix/wallet-connection-bug` - Bug fixes
- `docs/update-readme` - Documentation updates
- `refactor/optimize-metrics-engine` - Code refactoring
- `test/add-api-tests` - Test additions

### Step-by-Step Process

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** (follow [Coding Standards](#coding-standards))

3. **Write/update tests** (see [Testing Requirements](#testing-requirements))

4. **Run the test suite**:

   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

5. **Commit your changes** (see [Commit Message Guidelines](#commit-message-guidelines)):

   ```bash
   git add .
   git commit -m "feat: add leaderboard component"
   ```

6. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request** on GitHub using the [PR template](.github/PULL_REQUEST_TEMPLATE.md)

### PR Requirements

Your PR must:

- ✅ Pass all CI checks (lint, type-check, tests, build)
- ✅ Include tests for new functionality
- ✅ Maintain or increase code coverage
- ✅ Update documentation if needed
- ✅ Follow our coding standards
- ✅ Have a clear description of changes
- ✅ Reference related issues (`Fixes #123`)

### Review Process

1. **Automated checks** run first (CI/CD)
2. **Maintainers review** your code (usually within 48 hours)
3. **Address feedback** by pushing new commits to your branch
4. **Approval required** from at least 1 maintainer
5. **Merge** by maintainers (we use squash merge)

## 📐 Coding Standards

### General Principles

- **Follow existing patterns** in the codebase
- **Keep it simple** - clarity over cleverness
- **Write self-documenting code** - good naming reduces need for comments
- **Avoid premature optimization** - readable code first, optimize later if needed

### TypeScript

We use **TypeScript in strict mode**. All code must:

- ✅ Have explicit type annotations for function parameters and return types
- ✅ Avoid `any` type (use `unknown` if truly necessary)
- ✅ Use interfaces for object shapes, types for unions/primitives
- ✅ Leverage type inference where obvious
- ✅ No `@ts-ignore` or `@ts-nocheck` (fix the type issue instead)

**Example**:

```typescript
// ✅ Good
interface UserProfile {
  walletAddress: string;
  score: number;
}

function calculateScore(wallet: string): Promise<number> {
  // implementation
}

// ❌ Bad
function calculateScore(wallet: any) {
  // @ts-ignore
  return wallet.score;
}
```

### React Components

- ✅ Use functional components with hooks
- ✅ Extract reusable logic to custom hooks
- ✅ Keep components small and focused (<200 lines)
- ✅ Use TypeScript for props

**Example**:

```tsx
// ✅ Good
interface ScoreCardProps {
  score: number;
  walletAddress: string;
  onRefresh?: () => void;
}

export function ScoreCard({ score, walletAddress, onRefresh }: ScoreCardProps) {
  // implementation
}

// ❌ Bad
export function ScoreCard(props: any) {
  // implementation
}
```

### File Organization

```
/components        # React components
  /ui              # Generic UI components (Button, Card, etc.)
  /features        # Feature-specific components
/lib               # Business logic and utilities
  /services        # External service integrations
  /utils           # Pure utility functions
/pages             # Next.js pages and API routes
  /api             # API endpoints
/__tests__         # Test files (mirror source structure)
```

### Naming Conventions

- **Files**: `camelCase.ts` for utilities, `PascalCase.tsx` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (no `I` prefix)
- **Types**: `PascalCase`

### Code Style

We use **Prettier** for formatting and **ESLint** for linting:

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

**Pre-commit hooks** will run these automatically.

### Comments

- **Use JSDoc** for public APIs and complex functions
- **Avoid obvious comments** - code should be self-explanatory
- **Explain "why", not "what"** - the code shows what it does

**Example**:

```typescript
// ✅ Good
/**
 * Calculates the DegenScore using FIFO position tracking.
 * We use FIFO instead of average cost because it more accurately
 * reflects actual trading decisions.
 */
function calculateScore(trades: Trade[]): number {
  // implementation
}

// ❌ Bad
// This function calculates the score
function calculateScore(trades: any) {
  let score = 0; // Initialize score to 0
  // Loop through trades
  for (let trade of trades) {
    score += trade.value; // Add trade value to score
  }
}
```

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature/bug change)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config)
- `ci`: CI/CD changes

### Examples

```bash
feat(leaderboard): add real-time ranking updates

Implement WebSocket connection for live leaderboard updates.
Users now see rank changes without refreshing the page.

Closes #234

---

fix(wallet): resolve Phantom connection timeout

Increased connection timeout from 5s to 15s to handle
slow wallet responses.

Fixes #456

---

docs(readme): update setup instructions

Added troubleshooting section for common Vercel deployment issues.

---

test(metrics): add unit tests for score calculation

Increased coverage of metricsEngine from 45% to 87%.
```

### Rules

- ✅ Use present tense ("add feature" not "added feature")
- ✅ Use imperative mood ("move cursor to..." not "moves cursor to...")
- ✅ Keep subject line under 72 characters
- ✅ Reference issues/PRs in footer
- ✅ Include breaking changes in footer with `BREAKING CHANGE:`

## 🧪 Testing Requirements

All new code must include tests:

### Unit Tests

- **Location**: `__tests__/` directory (mirror source structure)
- **Framework**: Jest + Testing Library
- **Coverage**: Maintain >80% coverage for new code

**Example**:

```typescript
// __tests__/lib/metricsEngine.test.ts
import { calculateScore } from '@/lib/metricsEngine';

describe('calculateScore', () => {
  it('should return 0 for empty trade history', () => {
    const score = calculateScore([]);
    expect(score).toBe(0);
  });

  it('should calculate correct score for profitable trades', () => {
    const trades = [
      { type: 'buy', amount: 100, price: 1 },
      { type: 'sell', amount: 100, price: 2 },
    ];
    const score = calculateScore(trades);
    expect(score).toBeGreaterThan(50);
  });
});
```

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Generate coverage report
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
```

### Coverage Thresholds

Minimum coverage requirements:

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## 🌐 Community

### Get Help

- **Discord**: [discord.gg/degenscore](https://discord.gg/degenscore) - `#dev-chat` channel
- **Discussions**: [GitHub Discussions](https://github.com/rxrmgg2srb-code/DegenScore-Card/discussions)
- **Email**: dev@degenscore.com

### Stay Updated

- **Follow us on Twitter**: [@DegenScore](https://twitter.com/DegenScore)
- **Star the repo** to get notifications
- **Watch releases** for new versions

## 📄 License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## 🙏 Thank You!

Your contributions make DegenScore better for everyone in the Solana community. We appreciate your time and effort! 🚀

---

**Questions?** Open a [GitHub Discussion](https://github.com/rxrmgg2srb-code/DegenScore-Card/discussions) or join our [Discord](https://discord.gg/degenscore).
