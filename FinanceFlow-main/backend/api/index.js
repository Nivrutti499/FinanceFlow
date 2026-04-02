// Vercel serverless entry point
// The SQLite DB is pre-built during build phase and bundled with this deployment.
// On cold start we just copy it to /tmp (the only writable dir on Vercel).

const fs = require('fs');
const path = require('path');

const DB_SRC = path.join(__dirname, '..', 'prisma', 'financeflow.db');
const DB_DST = '/tmp/financeflow.db';

// Must be set BEFORE requiring any module that uses PrismaClient
process.env.DATABASE_URL = `file:${DB_DST}`;

if (!fs.existsSync(DB_DST)) {
  if (fs.existsSync(DB_SRC)) {
    fs.copyFileSync(DB_SRC, DB_DST);
    console.log('📦 Cold start: database copied to /tmp');
  } else {
    console.error('❌ Pre-built database not found at:', DB_SRC);
  }
}

module.exports = require('../src/index');
