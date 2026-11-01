const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/students - List students (with filters)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { institution_id, class_id, search, limit = 50 } = req.query;
    let sql = `
      SELECT s.*, i.name as institution_name, c.name as class_name, c.section,
             (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id) as total_attendance_days,
             (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.status = 'present') as present_days,
             (SELECT SUM(due_amount) FROM fees f WHERE f.student_id = s.id) as total_fee_due
      FROM students s
      JOIN institutions i ON s.institution_id = i.id
      JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Branch scoping for branch_admin/teacher/clerk
    if (req.user.role !== 'superadmin' && req.user.branch_id) {
      sql += ' AND s.institution_id = ?';
      params.push(req.user.branch_id);
    } else if (institution_id) {
      sql += ' AND s.institution_id = ?';
      params.push(institution_id);
    }

    if (class_id) {
      sql += ' AND s.class_id = ?';
      params.push(class_id);
    }

    if (search) {
      sql += ' AND (s.full_name LIKE ? OR s.gr_number LIKE ? OR s.parent_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY c.name ASC, s.roll_no ASC LIMIT ?';
    params.push(parseInt(limit));

    const rows = await query(sql, params);

    // Compute attendance percentage
    const enriched = rows.map(r => ({
      ...r,
      attendance_percentage: r.total_attendance_days > 0 
        ? Math.round((r.present_days / r.total_attendance_days) * 100) 
        : 100,
      fee_due: r.total_fee_due || 0
    }));

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/students/:id - Student Profile, Grades & Fee Ledger
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const student = await get(`
      SELECT s.*, i.name as institution_name, i.code as institution_code,
             c.name as class_name, c.section
      FROM students s
      JOIN institutions i ON s.institution_id = i.id
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `, [req.params.id]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Role check: Students can only view their own record
    if (req.user.role === 'student') {
      const myStudent = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!myStudent || myStudent.id !== parseInt(req.params.id)) {
        return res.status(403).json({ success: false, message: 'Access denied to other student records.' });
      }
    }

    const attendanceRecords = await query(`
      SELECT date, status, remarks 
      FROM attendance 
      WHERE student_id = ? 
      ORDER BY date DESC LIMIT 30
    `, [student.id]);

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    const grades = await query(`
      SELECT exam_name, subject, marks_obtained, max_marks, grade, exam_date
      FROM grades
      WHERE student_id = ?
      ORDER BY exam_date DESC
    `, [student.id]);

    const fees = await query(`
      SELECT receipt_no, fee_type, total_amount, paid_amount, due_amount, payment_date, payment_method, status
      FROM fees
      WHERE student_id = ?
      ORDER BY payment_date DESC
    `, [student.id]);

    res.json({
      success: true,
      data: {
        ...student,
        attendanceStats: {
          totalDays,
          presentDays,
          percentage: attendancePercentage,
          history: attendanceRecords
        },
        grades,
        fees
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/students - Add new student
router.post('/', authenticate, authorize(['superadmin', 'branch_admin', 'clerk']), async (req, res, next) => {
  try {
    const {
      institution_id, class_id, roll_no, gr_number, full_name,
      dob, gender, parent_name, parent_phone, email, address, admission_date
    } = req.body;

    if (!institution_id || !class_id || !roll_no || !gr_number || !full_name) {
      return res.status(400).json({ success: false, message: 'Missing required student fields.' });
    }

    const result = await run(`
      INSERT INTO students (
        institution_id, class_id, roll_no, gr_number, full_name,
        dob, gender, parent_name, parent_phone, email, address, admission_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `, [
      institution_id, class_id, roll_no, gr_number, full_name,
      dob || '2012-01-01', gender || 'Other', parent_name || '', parent_phone || '',
      email || '', address || 'Pune', admission_date || new Date().toISOString().split('T')[0]
    ]);

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully.',
      studentId: result.lastID
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
