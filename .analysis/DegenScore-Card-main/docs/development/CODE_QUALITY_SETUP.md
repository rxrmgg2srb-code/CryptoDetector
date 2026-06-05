# Code Quality Setup Guide

This document explains the code quality tools configured for DegenScore and how to use them.

## 🛠️ Tools Configured

### 1. **Prettier** - Code Formatting

Automatically formats code for consistency across the team.

**Configuration**: `.prettierrc`

**Usage**:

```bash
npm run format              # Format all files
npm run format:check        # Check formatting without modifying
```

**Key Settings**:

- Single quotes for strings
- 2-space indentation
- 100 character line width
- Trailing commas (ES5)
- Semicolons required

### 2. **ESLint** - Code Linting

Catches errors and enforces coding standards.

**Configuration**: `.eslintrc.json`

**Usage**:

```bash
npm run lint                # Check for linting issues
npm run lint:fix            # Auto-fix linting issues
```

**Rules**:

- TypeScript strict mode enabled
- No `any` types (warnings)
- No unused variables (except prefixed with `_`)
- No `console.log` (except `console.warn` and `console.error`)
- React Hooks rules enforced

### 3. **TypeScript** - Type Checking

Ensures type safety across the codebase.

**Configuration**: `tsconfig.json`

**Usage**:

```bash
npm run type-check          # Run TypeScript compiler checks
```

**Strict Mode**: All strict flags enabled for maximum safety.

### 4. **Husky** - Git Hooks

Runs quality checks before commits.

**Configuration**: `.husky/` directory

**Hooks**:

- **pre-commit**: Runs `lint-staged` (lint + format on staged files)
- **commit-msg**: Validates commit message format with `commitlint`

### 5. **lint-staged** - Pre-commit Checks

Only lints and formats files you're committing.

**Configuration**: `package.json` (`lint-staged` section)

**Actions**:

- JS/TS files: ESLint fix → Prettier format
- JSON/CSS/MD files: Prettier format

### 6. **commitlint** - Commit Message Linting

Enforces [Conventional Commits](https://www.conventionalcommits.org/) format.

**Configuration**: `commitlint.config.js`

**Valid Types**:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Tests
- `chore`: Maintenance
- `ci`: CI/CD changes

**Examples**:

```bash
feat: add leaderboard component
fix: resolve wallet connection timeout
docs: update API documentation
test: add unit tests for metrics engine
```

### 7. **EditorConfig** - Editor Settings

Ensures consistent editor settings across different IDEs.

**Configuration**: `.editorconfig`

**Settings**:

- UTF-8 charset
- LF line endings
- 2-space indentation
- Trim trailing whitespace

## 📋 Initial Setup

### For New Contributors

After cloning the repo:

```bash
# 1. Install dependencies
npm install

# 2. Husky hooks are automatically installed via the "prepare" script
# (This runs automatically after npm install)

# 3. Verify setup
npm run validate  # Runs format check, lint, type-check, and tests
```

### For Existing Projects (Upgrade)

If you're adding these tools to an existing checkout:

```bash
# 1. Install new dependencies
npm install

# 2. Initialize Husky (if not auto-initialized)
npm run prepare

# 3. Format the entire codebase
npm run format

# 4. Fix auto-fixable linting issues
npm run lint:fix

# 5. Commit the formatting changes
git add .
git commit -m "style: format codebase with Prettier"
```

## 🚀 Usage in Development

### Before Committing

The git hooks will run automatically, but you can also run checks manually:

```bash
# Check everything before committing
npm run validate

# Or run checks individually
npm run format:check    # Check formatting
npm run lint            # Check linting
npm run type-check      # Check types
npm run test            # Run tests
```

### During Development

**Auto-format on save** (recommended):

**VS Code**:

1. Install "Prettier - Code formatter" extension
2. Add to `.vscode/settings.json`:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode"
   }
   ```

**WebStorm/IntelliJ**:

1. Settings → Languages & Frameworks → JavaScript → Prettier
2. Check "On save"

### Writing Commits

**Good commits** (will pass commitlint):

```bash
feat: add leaderboard component
fix(wallet): resolve connection timeout
docs: update setup instructions
test: add metrics engine unit tests
```

**Bad commits** (will be rejected):

```bash
Added new feature                    # Missing type
feat: Add feature                    # Subject should be lowercase
fix: fixed the bug.                  # Subject shouldn't end with period
WIP                                  # Not a valid type
```

## 🔧 Configuration Files

| File                         | Purpose                          |
| ---------------------------- | -------------------------------- |
| `.prettierrc`                | Prettier formatting rules        |
| `.prettierignore`            | Files to exclude from formatting |
| `.eslintrc.json`             | ESLint linting rules             |
| `.editorconfig`              | Editor configuration             |
| `commitlint.config.js`       | Commit message rules             |
| `.husky/pre-commit`          | Pre-commit git hook              |
| `.husky/commit-msg`          | Commit message validation hook   |
| `package.json` (lint-staged) | Staged files processing          |

## 🎯 Quality Standards

All code must pass:

- ✅ **Prettier formatting** (no style debates)
- ✅ **ESLint rules** (no errors, minimal warnings)
- ✅ **TypeScript checks** (strict mode, no `any`)
- ✅ **Tests** (80%+ coverage for new code)
- ✅ **Conventional commits** (semantic versioning friendly)

## 🐛 Troubleshooting

### Husky hooks not running

```bash
# Reinitialize Husky
rm -rf .husky/_
npm run prepare
chmod +x .husky/pre-commit .husky/commit-msg
```

### Formatting conflicts with ESLint

Prettier rules take precedence. If there's a conflict:

1. Check if ESLint rule should be disabled (formatting rules should be in Prettier)
2. Update `.eslintrc.json` to disable conflicting rule

### Commit rejected by commitlint

Check the error message:

```bash
# Example error:
# ✖   subject may not be empty
# ✖   type may not be empty
```

Fix your commit message format:

```bash
git commit -m "feat: your feature description"
```

### Slow pre-commit hooks

lint-staged only runs on staged files, but if you're committing many files:

```bash
# Format the entire codebase once
npm run format

# Then commit (hooks will be fast since files are already formatted)
git add .
git commit -m "style: format codebase"
```

### Skip hooks (emergency only)

**Not recommended**, but in emergencies:

```bash
git commit --no-verify -m "fix: emergency hotfix"
```

**Note**: CI will still run all checks, so the commit may fail CI.

## 🔄 CI/CD Integration

These tools are also integrated into CI/CD:

- **Pull Request Checks**: Runs `npm run validate`
- **Pre-merge**: Formatting and linting must pass
- **Automated Fixes**: Some issues can be auto-fixed by CI (planned)

## 📚 Further Reading

- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)

## ✅ Checklist for Contributors

Before submitting a PR:

- [ ] Code is formatted (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Tests pass (`npm run test`)
- [ ] Commits follow conventional format
- [ ] No `console.log` statements (use `console.warn`/`error` if needed)
- [ ] No TypeScript `any` types (use `unknown` if necessary)

---

**Questions?** Ask in the `#dev-chat` channel on [Discord](https://discord.gg/degenscore) or open a [GitHub Discussion](https://github.com/rxrmgg2srb-code/DegenScore-Card/discussions).
