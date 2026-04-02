// Runs during Vercel build phase to pre-create and seed the SQLite database
// The resulting prisma/financeflow.db is bundled with the deployment
// and copied to /tmp at runtime

const { execSync } = require('child_process');
const path = require('path');

const dbPath = path.join(process.cwd(), 'prisma', 'financeflow.db');
process.env.DATABASE_URL = `file:${dbPath}`;

console.log('🔧 Generating Prisma client...');
execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

console.log('📦 Pushing schema to SQLite...');
execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env: process.env });

console.log('🌱 Seeding database...');
execSync('node src/config/seed.js', { stdio: 'inherit', env: process.env });

console.log('✅ Vercel build complete!');
