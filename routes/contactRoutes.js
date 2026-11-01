const express = require('express');
const router = express.Router();
const { query, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/contact - Public contact form submission
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, subject, and message.' });
    }

    const result = await run(`
      INSERT INTO contact_messages (name, email, phone, subject, message, status)
      VALUES (?, ?, ?, ?, ?, 'new')
    `, [name.trim(), email.trim(), phone || '', subject.trim(), message.trim()]);

    res.status(201).json({
      success: true,
      message: 'Thank you for reaching out to Janata Shikshan Sanstha. Our admin office will contact you shortly.',
      ticketId: result.lastID
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/contact - Admin message list
router.get('/', authenticate, authorize(['superadmin', 'branch_admin']), async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
