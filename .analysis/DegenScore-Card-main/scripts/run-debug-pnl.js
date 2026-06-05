// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Now run the TypeScript script
require('child_process').execSync('npx tsx scripts/diagnose-history.ts', {
    stdio: 'inherit',
    env: { ...process.env }
});
