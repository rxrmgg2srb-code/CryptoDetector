// scripts/analyze-coverage.js - Analyze coverage report and identify gaps
const fs = require('fs');
const path = require('path');

const COVERAGE_THRESHOLD = 95;
const COVERAGE_JSON_PATH = path.join(__dirname, '../coverage/coverage-summary.json');

function analyzeCoverage() {
  if (!fs.existsSync(COVERAGE_JSON_PATH)) {
    console.log('❌ No coverage report found. Run: npm run test:coverage');
    return;
  }

  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_JSON_PATH, 'utf8'));

  const gaps = [];
  const totals = {
    statements: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    lines: { covered: 0, total: 0 },
  };

  // Analyze each file
  for (const [filePath, metrics] of Object.entries(coverageData)) {
    if (filePath === 'total') continue;

    // Update totals
    totals.statements.covered += metrics.statements.covered;
    totals.statements.total += metrics.statements.total;
    totals.branches.covered += metrics.branches.covered;
    totals.branches.total += metrics.branches.total;
    totals.functions.covered += metrics.functions.covered;
    totals.functions.total += metrics.functions.total;
    totals.lines.covered += metrics.lines.covered;
    totals.lines.total += metrics.lines.total;

    // Check if below threshold
    const avgCoverage =
      (metrics.statements.pct + metrics.branches.pct + metrics.functions.pct + metrics.lines.pct) /
      4;

    if (avgCoverage < COVERAGE_THRESHOLD) {
      gaps.push({
        file: filePath.replace(process.cwd(), ''),
        statements: metrics.statements.pct,
        branches: metrics.branches.pct,
        functions: metrics.functions.pct,
        lines: metrics.lines.pct,
        avg: avgCoverage.toFixed(2),
      });
    }
  }

  // Calculate total percentages
  const totalPcts = {
    statements: ((totals.statements.covered / totals.statements.total) * 100).toFixed(2),
    branches: ((totals.branches.covered / totals.branches.total) * 100).toFixed(2),
    functions: ((totals.functions.covered / totals.functions.total) * 100).toFixed(2),
    lines: ((totals.lines.covered / totals.lines.total) * 100).toFixed(2),
  };

  const overallAvg =
    (parseFloat(totalPcts.statements) +
      parseFloat(totalPcts.branches) +
      parseFloat(totalPcts.functions) +
      parseFloat(totalPcts.lines)) /
    4;

  // Print results
  console.log('\n========================================');
  console.log('📊  COVERAGE ANALYSIS REPORT');
  console.log('========================================\n');

  console.log('📈 Overall Coverage:');
  console.log(`   Statements: ${totalPcts.statements}%`);
  console.log(`   Branches:   ${totalPcts.branches}%`);
  console.log(`   Functions:  ${totalPcts.functions}%`);
  console.log(`   Lines:      ${totalPcts.lines}%`);
  console.log(`   Average:    ${overallAvg.toFixed(2)}%`);
  console.log('');

  if (overallAvg >= COVERAGE_THRESHOLD) {
    console.log(
      `✅ GOAL ACHIEVED! Coverage is ${overallAvg.toFixed(2)}% (>= ${COVERAGE_THRESHOLD}%)`
    );
  } else {
    console.log(
      `⚠️  Need ${(COVERAGE_THRESHOLD - overallAvg).toFixed(2)}% more coverage to reach ${COVERAGE_THRESHOLD}%`
    );
  }

  console.log(`\n📉 Files below ${COVERAGE_THRESHOLD}% coverage: ${gaps.length}\n`);

  // Sort by avg coverage (lowest first)
  gaps.sort((a, b) => parseFloat(a.avg) - parseFloat(b.avg));

  // Categorize gaps
  const critical = gaps.filter((g) => parseFloat(g.avg) < 50);
  const high = gaps.filter((g) => parseFloat(g.avg) >= 50 && parseFloat(g.avg) < 70);
  const medium = gaps.filter((g) => parseFloat(g.avg) >= 70 && parseFloat(g.avg) < 85);
  const low = gaps.filter((g) => parseFloat(g.avg) >= 85);

  console.log(`🔴 CRITICAL (<50%): ${critical.length} files`);
  critical.slice(0, 10).forEach((g) => {
    console.log(`   ${g.file}: ${g.avg}%`);
  });

  console.log(`\n🟠 HIGH (50-70%): ${high.length} files`);
  high.slice(0, 10).forEach((g) => {
    console.log(`   ${g.file}: ${g.avg}%`);
  });

  console.log(`\n🟡 MEDIUM (70-85%): ${medium.length} files`);
  medium.slice(0, 10).forEach((g) => {
    console.log(`   ${g.file}: ${g.avg}%`);
  });

  console.log(`\n🟢 LOW (85-95%): ${low.length} files`);
  low.slice(0, 10).forEach((g) => {
    console.log(`   ${g.file}: ${g.avg}%`);
  });

  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    overall: totalPcts,
    overallAvg: overallAvg.toFixed(2),
    threshold: COVERAGE_THRESHOLD,
    goalAchieved: overallAvg >= COVERAGE_THRESHOLD,
    gaps: {
      critical,
      high,
      medium,
      low,
    },
  };

  fs.writeFileSync(
    path.join(__dirname, '../coverage-analysis.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n📄 Detailed report saved to: coverage-analysis.json');
  console.log('========================================\n');

  return report;
}

if (require.main === module) {
  analyzeCoverage();
}

module.exports = { analyzeCoverage };
