const bcrypt = require('bcryptjs');
const prisma = require('./database');

async function seed() {
  console.log('🌱 Seeding database...');

  // Create users
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedAnalyst = await bcrypt.hash('analyst123', 10);
  const hashedViewer = await bcrypt.hash('viewer123', 10);
  const hashedJohn = await bcrypt.hash('user123', 10);

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

  await prisma.user.upsert({
    where: { email: 'john@financeflow.com' },
    update: {},
    create: { name: 'John Doe', email: 'john@financeflow.com', passwordHash: hashedJohn, role: 'analyst', status: 'active' },
  });

  // Seed records
  const existingRecords = await prisma.financialRecord.count();
  if (existingRecords === 0) {
    const records = [
      { amount: 5200.00, type: 'income', category: 'Salary', date: '2026-03-01', notes: 'Monthly salary - March', createdById: admin.id },
      { amount: 850.00, type: 'expense', category: 'Rent', date: '2026-03-02', notes: 'Office rent payment', createdById: admin.id },
      { amount: 320.50, type: 'expense', category: 'Utilities', date: '2026-03-05', notes: 'Electricity and internet', createdById: admin.id },
      { amount: 1500.00, type: 'income', category: 'Freelance', date: '2026-03-08', notes: 'Web design project', createdById: analyst.id },
      { amount: 75.00, type: 'expense', category: 'Food', date: '2026-03-10', notes: 'Team lunch', createdById: admin.id },
      { amount: 200.00, type: 'expense', category: 'Transport', date: '2026-03-12', notes: 'Business travel', createdById: analyst.id },
      { amount: 3800.00, type: 'income', category: 'Salary', date: '2026-02-01', notes: 'Monthly salary - February', createdById: admin.id },
      { amount: 850.00, type: 'expense', category: 'Rent', date: '2026-02-02', notes: 'Office rent payment', createdById: admin.id },
      { amount: 450.00, type: 'expense', category: 'Software', date: '2026-02-10', notes: 'Annual software licenses', createdById: admin.id },
      { amount: 900.00, type: 'income', category: 'Freelance', date: '2026-02-14', notes: 'Consulting fees', createdById: analyst.id },
      { amount: 110.00, type: 'expense', category: 'Food', date: '2026-02-18', notes: 'Team dinner', createdById: admin.id },
      { amount: 4100.00, type: 'income', category: 'Salary', date: '2026-01-01', notes: 'Monthly salary - January', createdById: admin.id },
      { amount: 850.00, type: 'expense', category: 'Rent', date: '2026-01-02', notes: 'Office rent payment', createdById: admin.id },
      { amount: 250.00, type: 'expense', category: 'Equipment', date: '2026-01-15', notes: 'New keyboard and mouse', createdById: admin.id },
      { amount: 600.00, type: 'income', category: 'Investment', date: '2026-01-20', notes: 'Dividend payment', createdById: admin.id },
      { amount: 130.00, type: 'expense', category: 'Utilities', date: '2026-01-25', notes: 'Monthly utilities', createdById: admin.id },
      { amount: 2200.00, type: 'income', category: 'Freelance', date: '2025-12-20', notes: 'Year-end bonus project', createdById: analyst.id },
      { amount: 500.00, type: 'expense', category: 'Marketing', date: '2025-12-10', notes: 'Ad campaign', createdById: admin.id },
      { amount: 4500.00, type: 'income', category: 'Salary', date: '2025-12-01', notes: 'Monthly salary - December', createdById: admin.id },
      { amount: 950.00, type: 'expense', category: 'Rent', date: '2025-12-02', notes: 'Office rent payment', createdById: admin.id },
      { amount: 3900.00, type: 'income', category: 'Salary', date: '2025-11-01', notes: 'Monthly salary - November', createdById: admin.id },
      { amount: 820.00, type: 'expense', category: 'Rent', date: '2025-11-02', notes: 'Office rent Nov', createdById: admin.id },
      { amount: 300.00, type: 'income', category: 'Investment', date: '2025-11-15', notes: 'Stock dividends', createdById: admin.id },
      { amount: 180.00, type: 'expense', category: 'Transport', date: '2025-11-20', notes: 'Commute expenses', createdById: analyst.id },
      { amount: 3750.00, type: 'income', category: 'Salary', date: '2025-10-01', notes: 'Monthly salary - October', createdById: admin.id },
      { amount: 850.00, type: 'expense', category: 'Rent', date: '2025-10-02', notes: 'Office rent Oct', createdById: admin.id },
      { amount: 400.00, type: 'expense', category: 'Equipment', date: '2025-10-18', notes: 'Monitor stand', createdById: admin.id },
      { amount: 750.00, type: 'income', category: 'Freelance', date: '2025-10-22', notes: 'Logo design', createdById: analyst.id },
    ];

    await prisma.financialRecord.createMany({ data: records });
  }

  console.log('✅ Database seeded successfully!');
  console.log('\nDemo credentials:');
  console.log('  Admin:   admin@financeflow.com   / admin123');
  console.log('  Analyst: analyst@financeflow.com / analyst123');
  console.log('  Viewer:  viewer@financeflow.com  / viewer123');
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
