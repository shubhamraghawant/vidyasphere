const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/notices - Public list with bilingual support
router.get('/', async (req, res, next) => {
  try {
    const { category, institution_id, lang } = req.query;
    let sql = 'SELECT * FROM notices WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (institution_id) {
      sql += ' AND (institution_id = ? OR institution_id IS NULL)';
      params.push(institution_id);
    }

    sql += ' ORDER BY is_pinned DESC, published_date DESC';
    const rows = await query(sql, params);

    // Format based on language preference
    const formatted = rows.map(r => ({
      ...r,
      display_title: (lang === 'mr' && r.title_mr) ? r.title_mr : r.title,
      display_content: (lang === 'mr' && r.content_mr) ? r.content_mr : r.content
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/notices - Admin publish
router.post('/', authenticate, authorize(['superadmin', 'branch_admin']), async (req, res, next) => {
  try {
    const { title, title_mr, content, content_mr, category, institution_id, is_pinned } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Please provide notice title, content, and category.' });
    }

    const result = await run(`
      INSERT INTO notices (title, title_mr, content, content_mr, category, institution_id, is_pinned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, title_mr || null, content, content_mr || null, category, institution_id || null, is_pinned ? 1 : 0]);

    res.status(201).json({
      success: true,
      message: 'Notice published successfully.',
      noticeId: result.lastID
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

