// Vercel serverless entry point
// Initializes SQLite in /tmp and seeds on cold start

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const DB_PATH = '/tmp/financeflow.db';
process.env.DATABASE_URL = `file:${DB_PATH}`;

// On cold start, set up the database
if (!fs.existsSync(DB_PATH)) {
  console.log('🔧 Cold start: initializing database...');
  try {
    execSync('npx prisma db push --skip-generate', {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env },
      stdio: 'inherit',
    });

    // Run seed inline (avoid re-requiring with disconnected prisma)
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    (async () => {
      const hashedAdmin = await bcrypt.hash('admin123', 10);
      const hashedAnalyst = await bcrypt.hash('analyst123', 10);
      const hashedViewer = await bcrypt.hash('viewer123', 10);

      const admin = await prisma.user.upsert({
        where: { email: 'admin@financeflow.com' },
        update: {},
        create: { name: 'Admin User', email: 'admin@financeflow.com', passwordHash: hashedAdmin, role: 'admin', status: 'active' },
      });
      const analyst = await prisma.user.upsert({
        where: { email: 'analyst@financeflow.com' },
        update: {},
        create: { name: 'Sarah Analyst', email: 'analyst@financeflow.com', passwordHash: hashedAnalyst, role: 'analyst', status: 'active' },
      });
      await prisma.user.upsert({
        where: { email: 'viewer@financeflow.com' },
        update: {},
        create: { name: 'View Only', email: 'viewer@financeflow.com', passwordHash: hashedViewer, role: 'viewer', status: 'active' },
      });

      const existingRecords = await prisma.financialRecord.count();
      if (existingRecords === 0) {
        await prisma.financialRecord.createMany({
          data: [
            { amount: 5200, type: 'income', category: 'Salary', date: '2026-03-01', notes: 'Monthly salary - March', createdById: admin.id },
            { amount: 850, type: 'expense', category: 'Rent', date: '2026-03-02', notes: 'Office rent', createdById: admin.id },
            { amount: 320.5, type: 'expense', category: 'Utilities', date: '2026-03-05', notes: 'Electricity and internet', createdById: admin.id },
            { amount: 1500, type: 'income', category: 'Freelance', date: '2026-03-08', notes: 'Web design project', createdById: analyst.id },
            { amount: 75, type: 'expense', category: 'Food', date: '2026-03-10', notes: 'Team lunch', createdById: admin.id },
            { amount: 3800, type: 'income', category: 'Salary', date: '2026-02-01', notes: 'Monthly salary - Feb', createdById: admin.id },
            { amount: 850, type: 'expense', category: 'Rent', date: '2026-02-02', notes: 'Office rent Feb', createdById: admin.id },
            { amount: 900, type: 'income', category: 'Freelance', date: '2026-02-14', notes: 'Consulting fees', createdById: analyst.id },
            { amount: 4100, type: 'income', category: 'Salary', date: '2026-01-01', notes: 'Monthly salary - Jan', createdById: admin.id },
            { amount: 600, type: 'income', category: 'Investment', date: '2026-01-20', notes: 'Dividend payment', createdById: admin.id },
          ],
        });
      }
      await prisma.$disconnect();
      console.log('✅ Database ready!');
    })().catch(console.error);

  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

// Export the Express app
module.exports = require('../src/index');
