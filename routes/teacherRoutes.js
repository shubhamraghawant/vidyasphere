const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/teachers
router.get('/', async (req, res, next) => {
  try {
    const { institution_id, department } = req.query;
    let sql = `
      SELECT t.*, i.name as institution_name 
      FROM teachers t
      JOIN institutions i ON t.institution_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (institution_id) {
      sql += ' AND t.institution_id = ?';
      params.push(institution_id);
    }
    if (department) {
      sql += ' AND t.department = ?';
      params.push(department);
    }

    sql += ' ORDER BY t.name ASC';
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

// POST /api/teachers
router.post('/', authenticate, authorize(['superadmin', 'branch_admin']), async (req, res, next) => {
  try {
    const {
      institution_id, name, employee_id, department, designation,
      qualification, subjects, phone, email, joining_date
    } = req.body;

    if (!institution_id || !name || !employee_id || !department || !designation) {
      return res.status(400).json({ success: false, message: 'Missing required faculty details.' });
    }

    const result = await run(`
      INSERT INTO teachers (
        institution_id, name, employee_id, department, designation,
        qualification, subjects, phone, email, joining_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      institution_id, name, employee_id, department, designation,
      qualification || 'M.A / M.Sc, B.Ed', subjects || '', phone || '',
      email || '', joining_date || new Date().toISOString().split('T')[0]
    ]);

    res.status(201).json({
      success: true,
      message: 'Faculty member added successfully.',
      teacherId: result.lastID
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

