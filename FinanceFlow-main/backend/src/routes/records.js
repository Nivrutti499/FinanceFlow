const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireMinRole } = require('../middleware/roles');

const router = express.Router();
router.use(authenticate);

// GET /api/records — Analyst + Admin
router.get('/', requireMinRole('analyst'), [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense']),
  query('category').optional().trim(),
  query('startDate').optional(),
  query('endDate').optional(),
  query('search').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };
    if (req.query.type) where.type = req.query.type;
    if (req.query.category) where.category = { contains: req.query.category };
    if (req.query.startDate) where.date = { ...where.date, gte: req.query.startDate };
    if (req.query.endDate) where.date = { ...where.date, lte: req.query.endDate };
    if (req.query.search) {
      where.OR = [
        { notes: { contains: req.query.search } },
        { category: { contains: req.query.search } }
      ];
    }

    const [total, records] = await Promise.all([
      prisma.financialRecord.count({ where }),
      prisma.financialRecord.findMany({
        where,
        include: { createdBy: { select: { name: true } } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit
      })
    ]);

    res.json({
      records: records.map(r => ({ ...r, createdByName: r.createdBy?.name })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch records.' });
  }
});

// POST /api/records — Admin only
router.post('/', requireRole('admin'), [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('notes').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  try {
    const { amount, type, category, date, notes } = req.body;
    const record = await prisma.financialRecord.create({
      data: { amount: parseFloat(amount), type, category, date, notes: notes || null, createdById: req.user.id },
      include: { createdBy: { select: { name: true } } }
    });
    res.status(201).json({ message: 'Record created successfully', record: { ...record, createdByName: record.createdBy?.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create record.' });
  }
});

// PUT /api/records/:id — Admin only
router.put('/:id', requireRole('admin'), [
  param('id').isInt().withMessage('Valid record ID required'),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('type').optional().isIn(['income', 'expense']),
  body('category').optional().trim().notEmpty(),
  body('date').optional().notEmpty(),
  body('notes').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const id = parseInt(req.params.id);
  try {
    const existing = await prisma.financialRecord.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Record not found.' });

    const { amount, type, category, date, notes } = req.body;
    const data = {};
    if (amount !== undefined) data.amount = parseFloat(amount);
    if (type) data.type = type;
    if (category) data.category = category;
    if (date) data.date = date;
    if (notes !== undefined) data.notes = notes;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const record = await prisma.financialRecord.update({
      where: { id },
      data,
      include: { createdBy: { select: { name: true } } }
    });
    res.json({ message: 'Record updated successfully', record: { ...record, createdByName: record.createdBy?.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update record.' });
  }
});

// DELETE /api/records/:id — Admin only (soft delete)
router.delete('/:id', requireRole('admin'), [
  param('id').isInt().withMessage('Valid record ID required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array() });
  }

  const id = parseInt(req.params.id);
  try {
    const existing = await prisma.financialRecord.findFirst({ where: { id, deletedAt: null } });
    if (!existing) return res.status(404).json({ error: 'Record not found.' });

    await prisma.financialRecord.update({ where: { id }, data: { deletedAt: new Date() } });
    res.json({ message: 'Record deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

module.exports = router;
