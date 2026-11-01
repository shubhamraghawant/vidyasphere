const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/admissions/apply - Public Admission Application Form
router.post('/apply', async (req, res, next) => {
  try {
    const {
      institution_id, applicant_name, parent_name, parent_phone,
      parent_email, applying_for_class, dob, gender, address, previous_school
    } = req.body;

    if (!institution_id || !applicant_name || !parent_name || !parent_phone || !applying_for_class) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please fill all required admission fields: institution, student name, parent name, phone, and grade.' 
      });
    }

    // Generate unique application number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appNo = `JSS-2026-${randomSuffix}`;

    await run(`
      INSERT INTO admissions (
        application_no, institution_id, applicant_name, parent_name, parent_phone,
        parent_email, applying_for_class, dob, gender, address, previous_school, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
    `, [
      appNo, institution_id, applicant_name.trim(), parent_name.trim(), parent_phone.trim(),
      parent_email || '', applying_for_class, dob || '2015-05-15', gender || 'Other',
      address || 'Pune, Maharashtra', previous_school || ''
    ]);

    res.status(201).json({
      success: true,
      message: 'Admission application submitted successfully!',
      applicationNumber: appNo,
      status: 'submitted'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admissions/track/:applicationNumber - Public Tracking
router.get('/track/:applicationNumber', async (req, res, next) => {
  try {
    const app = await get(`
      SELECT a.*, i.name as institution_name, i.code as institution_code, i.phone as institution_phone
      FROM admissions a
      JOIN institutions i ON a.institution_id = i.id
      WHERE a.application_no = ?
    `, [req.params.applicationNumber.trim()]);

    if (!app) {
      return res.status(404).json({ success: false, message: 'Application number not found. Please verify and re-try.' });
    }

    res.json({
      success: true,
      data: app
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admissions - Admin list with status filtering
router.get('/', authenticate, authorize(['superadmin', 'branch_admin', 'clerk']), async (req, res, next) => {
  try {
    const { status, institution_id } = req.query;
    let sql = `
      SELECT a.*, i.name as institution_name, i.code as institution_code
      FROM admissions a
      JOIN institutions i ON a.institution_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'superadmin' && req.user.branch_id) {
      sql += ' AND a.institution_id = ?';
      params.push(req.user.branch_id);
    } else if (institution_id) {
      sql += ' AND a.institution_id = ?';
      params.push(institution_id);
    }

    if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.created_at DESC';
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

// PATCH /api/admissions/:id/status - Update Status (Admin)
router.patch('/:id/status', authenticate, authorize(['superadmin', 'branch_admin']), async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['submitted', 'under_review', 'verified', 'approved', 'rejected', 'enrolled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const app = await get('SELECT * FROM admissions WHERE id = ?', [req.params.id]);
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    await run(`
      UPDATE admissions 
      SET status = ?, notes = COALESCE(?, notes)
      WHERE id = ?
    `, [status, notes || null, req.params.id]);

    res.json({
      success: true,
      message: `Application ${app.application_no} status updated to: ${status}`,
      status
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
