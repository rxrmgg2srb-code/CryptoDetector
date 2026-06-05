# Task 01: Build Automated Audit Coverage Tooling

## Overview

Build an automated audit harness that produces a comprehensive testing baseline and gap report for the entire codebase. This tool will analyze test coverage across all domains (components, hooks, API routes, lib modules, workers, and programs) and generate actionable reports to guide testing improvements.

## Description

Create a robust auditing system that scans the codebase, identifies untested or under-tested code, and produces machine-readable artifacts that can be consumed by CI/CD pipelines and developers. The audit tool should provide clear visibility into coverage gaps and prioritize areas that need attention.

## Technical Details

### Implementation Steps

1. **Create Audit Script**
   - Location: `scripts/testing/audit.ts`
   - Implement domain-specific analyzers:
     - Components analyzer (`components/**/*.tsx`)
     - Hooks analyzer (`hooks/**/*.ts`)
     - API routes analyzer (`pages/api/**/*.ts`)
     - Lib modules analyzer (`lib/**/*.ts`)
     - Workers analyzer (`workers/**/*.ts`)
     - Programs analyzer (`programs/**/*.rs`)

2. **Analysis Logic**
   - Parse source files to identify:
     - Exported functions/components
     - Business logic complexity (cyclomatic complexity)
     - External dependencies (APIs, databases, third-party services)
   - Cross-reference with existing test files in `__tests__/`
   - Calculate coverage metrics:
     - File coverage percentage
     - Function/component coverage
     - Integration test coverage
     - E2E test coverage

3. **Output Artifacts**
   - **Baseline Report**: `reports/testing/audit-<timestamp>.json`
     ```json
     {
       "timestamp": "2024-01-15T10:30:00Z",
       "summary": {
         "totalFiles": 450,
         "testedFiles": 285,
         "coveragePercentage": 63.3
       },
       "domains": {
         "components": { "total": 120, "tested": 85, "coverage": 70.8 },
         "hooks": { "total": 25, "tested": 15, "coverage": 60.0 },
         "api": { "total": 45, "tested": 20, "coverage": 44.4 },
         "lib": { "total": 80, "tested": 45, "coverage": 56.3 },
         "workers": { "total": 8, "tested": 2, "coverage": 25.0 },
         "programs": { "total": 5, "tested": 1, "coverage": 20.0 }
       }
     }
     ```
   - **Gap Analysis Report**: `reports/testing/gap-analysis.json`
     ```json
     {
       "criticalGaps": [
         {
           "file": "lib/tokenSecurityAnalyzer.ts",
           "priority": "high",
           "reason": "Core business logic, external API calls, no tests",
           "recommendedTests": 15
         }
       ],
       "recommendations": {
         "quickWins": [],
         "highImpact": [],
         "longTerm": []
       }
     }
     ```

4. **NPM Script Integration**
   - Add to `package.json`:
     ```json
     {
       "scripts": {
         "test:audit": "ts-node scripts/testing/audit.ts",
         "test:audit:report": "ts-node scripts/testing/audit.ts --format=html"
       }
     }
     ```

5. **Report Features**
   - Color-coded output (green: >80%, yellow: 50-80%, red: <50%)
   - Prioritization algorithm based on:
     - Business criticality
     - Code complexity
     - Number of dependencies
     - Error-prone patterns
   - Historical trend tracking (compare with previous audits)
   - HTML report generation for easy viewing

### Technology Stack

- TypeScript for script implementation
- Node.js file system APIs for code scanning
- AST parsing libraries (e.g., `@typescript-eslint/parser`, `@babel/parser`)
- Jest coverage APIs for existing coverage data
- JSON Schema for report validation

### Integration Points

- CI/CD pipeline integration (GitHub Actions)
- Pre-commit hooks for continuous monitoring
- Dashboard visualization (future enhancement)
- Automated PR comments with coverage deltas

## Acceptance Criteria

- [ ] `scripts/testing/audit.ts` is created and executable
- [ ] Script analyzes all 6 domains (components, hooks, API, lib, workers, programs)
- [ ] Generates `reports/testing/audit-<timestamp>.json` with complete baseline data
- [ ] Generates `reports/testing/gap-analysis.json` with prioritized recommendations
- [ ] `npm run test:audit` command executes successfully
- [ ] Report includes:
  - [ ] Overall coverage percentage
  - [ ] Per-domain breakdown
  - [ ] List of untested files (minimum 50 files identified)
  - [ ] List of critical gaps (minimum 20 high-priority items)
  - [ ] Actionable recommendations categorized by effort/impact
- [ ] Script completes in under 30 seconds for the entire codebase
- [ ] JSON output is valid and follows defined schema
- [ ] Documentation in `docs/development/testing-audit.md` explaining:
  - How to run the audit
  - How to interpret results
  - How to prioritize testing efforts
- [ ] Example output files committed to `reports/testing/example-audit.json`

## Dependencies

- None (this is a foundational task)

## Estimated Effort

- **Time**: 4-6 hours
- **Complexity**: Medium
- **Priority**: High (blocks other testing tasks)

## Success Metrics

- Tool identifies minimum 100 untested files
- Gap analysis provides at least 50 specific testing recommendations
- Audit report used to guide tasks 02, 03, and 04
- Development team adopts tool as part of regular workflow
