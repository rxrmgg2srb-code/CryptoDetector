## 📝 Description

<!-- Provide a clear and concise description of your changes -->

## 🔗 Related Issue

<!-- Link to the issue this PR addresses -->

Fixes #(issue number)

## 🎯 Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Style/UI update (no functional changes)
- [ ] ♻️ Code refactor (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔧 Configuration/build update
- [ ] 🔒 Security fix

## 🧪 Testing

<!-- Describe the tests you ran and how to reproduce them -->

### Test Steps

1. Step 1
2. Step 2
3. Step 3

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

**Test Results:**

```
npm run test
# Paste test output here
```

**Coverage Report:**

```
npm run test:coverage
# Paste coverage summary here
```

## 📸 Screenshots/Videos

<!-- If applicable, add screenshots or screen recordings to demonstrate the changes -->

### Before

<!-- Screenshot/video of the old behavior -->

### After

<!-- Screenshot/video of the new behavior -->

## ✅ Checklist

<!-- Mark items with an "x" when completed -->

### Code Quality

- [ ] My code follows the project's [coding standards](../CONTRIBUTING.md#coding-standards)
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings or errors
- [ ] I have removed any `console.log` statements and debugging code

### Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Test coverage has not decreased (run `npm run test:coverage`)

### Documentation

- [ ] I have updated the documentation accordingly
- [ ] I have updated the README.md (if needed)
- [ ] I have added/updated JSDoc comments for new/modified functions
- [ ] I have updated the CHANGELOG.md (if applicable)

### Security

- [ ] I have reviewed my code for security vulnerabilities
- [ ] I have not introduced any secrets or API keys
- [ ] I have validated and sanitized all user inputs
- [ ] I have added rate limiting to new API endpoints (if applicable)

### Performance

- [ ] I have considered the performance impact of my changes
- [ ] I have not introduced any unnecessary re-renders (React)
- [ ] I have optimized database queries (if applicable)
- [ ] I have not introduced memory leaks

### Compatibility

- [ ] My changes are compatible with all supported browsers
- [ ] My changes work on mobile devices
- [ ] My changes work with all supported wallets (Phantom, Backpack, etc.)
- [ ] I have tested on both mainnet and devnet (if applicable)

## 🚀 Deployment Notes

<!-- Any special deployment instructions or considerations -->

- [ ] No deployment notes needed
- [ ] Database migrations required
- [ ] Environment variables need to be updated
- [ ] External services need configuration
- [ ] Smart contract deployment required

**Migration Commands** (if applicable):

```bash
# Add any migration commands here
```

**Environment Variables** (if applicable):

```bash
# List any new environment variables
NEW_VAR=value
```

## 📋 Additional Context

<!-- Add any other context, concerns, or questions about the PR -->

## 🔍 Reviewers

<!-- Tag specific people if needed -->

@username

---

## For Maintainers

### Review Checklist

- [ ] Code quality is acceptable
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] Breaking changes are documented
- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org/)

### Merge Strategy

- [ ] Squash and merge (default)
- [ ] Rebase and merge
- [ ] Create merge commit

**Post-Merge Actions:**

- [ ] Deploy to staging
- [ ] Notify Discord community
- [ ] Update changelog
- [ ] Close related issues
