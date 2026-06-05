// SKIP flag for CI: si SKIP_PRISMA_GENERATE=true saltamos este script
if (process.env.SKIP_PRISMA_GENERATE === 'true') {
  console.log('SKIP_PRISMA_GENERATE=true -> saltando generate-prisma.js');
  process.exit(0);
}

// Script to generate Prisma Client using the locally installed version
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  console.log('Generating Prisma Client...');

  const isWindows = process.platform === 'win32';

  // Try to find prisma CLI - different paths for different OS
  const possiblePaths = [
    // Direct JavaScript entry point (works everywhere)
    path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js'),
    path.join(__dirname, 'node_modules', '@prisma', 'cli', 'build', 'index.js'),
    // Windows-specific
    ...(isWindows
      ? [
          path.join(__dirname, 'node_modules', '.bin', 'prisma.cmd'),
          path.join(__dirname, 'node_modules', '.bin', 'prisma.ps1'),
        ]
      : []),
    // Unix-specific
    ...(!isWindows ? [path.join(__dirname, 'node_modules', '.bin', 'prisma')] : []),
  ];

  let prismaPath = null;
  let useNode = false;

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      prismaPath = p;
      // If it's a .js file, we need to run it with node
      useNode = p.endsWith('.js');
      break;
    }
  }

  // Fallback: try to resolve using require.resolve
  if (!prismaPath) {
    try {
      const prismaPkg = require.resolve('prisma');
      const prismaDir = path.dirname(prismaPkg);
      const cliPath = path.join(prismaDir, '..', 'build', 'index.js');
      if (fs.existsSync(cliPath)) {
        prismaPath = cliPath;
        useNode = true;
      }
    } catch (e) {
      // Ignore
    }
  }

  if (prismaPath) {
    console.log(`Using Prisma from: ${prismaPath}`);
    const command = useNode ? `node "${prismaPath}" generate` : `"${prismaPath}" generate`;
    execSync(command, { stdio: 'inherit', cwd: __dirname });
  } else {
    // Last resort: use npx with the correct version
    console.log('Using npx as fallback...');
    execSync('npx --yes prisma@6.19.0 generate', { stdio: 'inherit', cwd: __dirname });
  }

  console.log('✅ Prisma Client generated successfully!');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client:', error.message);
  process.exit(1);
}
