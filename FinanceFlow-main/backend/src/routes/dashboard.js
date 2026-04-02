const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', async (req, res) => {
  try {
    const records = await prisma.financialRecord.findMany({ where: { deletedAt: null } });

    const totalIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const totalExpenses = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const totalRecords = records.length;

    // Current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthRecords = records.filter(r => r.date.startsWith(currentMonth));
    const monthIncome = monthRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    const monthExpenses = monthRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);

    res.json({ totalIncome, totalExpenses, netBalance, totalRecords, monthIncome, monthExpenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch summary.' });
  }
});

// GET /api/dashboard/category-breakdown
router.get('/category-breakdown', async (req, res) => {
  try {
    const records = await prisma.financialRecord.findMany({ where: { deletedAt: null } });

    const breakdown = {};
    for (const r of records) {
      const key = `${r.category}|${r.type}`;
      if (!breakdown[key]) breakdown[key] = { category: r.category, type: r.type, total: 0, count: 0 };
      breakdown[key].total += r.amount;
      breakdown[key].count++;
    }

    const categories = Object.values(breakdown).sort((a, b) => b.total - a.total);
    res.json({ categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch category breakdown.' });
  }
});

// GET /api/dashboard/trends — last 6 months
router.get('/trends', async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const cutoff = sixMonthsAgo.toISOString().substring(0, 10);

    const records = await prisma.financialRecord.findMany({
      where: { deletedAt: null, date: { gte: cutoff } }
    });

    const monthMap = {};
    for (const r of records) {
      const month = r.date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { month, income: 0, expenses: 0 };
      if (r.type === 'income') monthMap[month].income += r.amount;
      else monthMap[month].expenses += r.amount;
    }

    const trends = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));
    res.json({ trends });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trends.' });
  }
});

// GET /api/dashboard/recent
router.get('/recent', async (req, res) => {
  try {
    const records = await prisma.financialRecord.findMany({
      where: { deletedAt: null },
      include: { createdBy: { select: { name: true } } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 10
    });
    res.json({ records: records.map(r => ({ ...r, createdByName: r.createdBy?.name })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recent records.' });
  }
});

module.exports = router;
