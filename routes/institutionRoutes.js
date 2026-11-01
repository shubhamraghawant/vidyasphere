const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/institutions - Public list with filtering
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM institutions WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (name LIKE ? OR name_mr LIKE ? OR address LIKE ? OR code LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY established_year ASC';
    const rows = await query(sql, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/institutions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const institution = await get('SELECT * FROM institutions WHERE id = ?', [req.params.id]);
    if (!institution) {
      return res.status(404).json({ success: false, message: 'Institution not found.' });
    }

    // Include classes & faculty counts
    const classes = await query('SELECT * FROM classes WHERE institution_id = ?', [institution.id]);
    const faculty = await query('SELECT id, name, designation, department, qualification, subjects FROM teachers WHERE institution_id = ?', [institution.id]);

    res.json({
      success: true,
      data: {
        ...institution,
        classes,
        faculty
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/institutions - Superadmin only
router.post('/', authenticate, authorize(['superadmin']), async (req, res, next) => {
  try {
    const {
      name, name_mr, code, category, medium, address, pincode,
      phone, email, principal_name, established_year, total_students, total_faculty, image_url
    } = req.body;

    if (!name || !code || !category || !medium || !address) {
      return res.status(400).json({ success: false, message: 'Missing required institution fields.' });
    }

    const result = await run(`
      INSERT INTO institutions (
        name, name_mr, code, category, medium, address, pincode, phone, email,
        principal_name, established_year, total_students, total_faculty, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, name_mr, code, category, medium, address, pincode || '411012',
      phone, email, principal_name, established_year || 2026, total_students || 0,
      total_faculty || 0, image_url
    ]);

    res.status(201).json({
      success: true,
      message: 'Institution added successfully.',
      institutionId: result.lastID
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
