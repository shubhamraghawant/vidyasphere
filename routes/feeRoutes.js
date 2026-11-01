const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/fees/student/:studentId - Get fee ledger for a student
router.get('/student/:studentId', authenticate, async (req, res, next) => {
  try {
    const studentId = req.params.studentId;

    // Student self-check
    if (req.user.role === 'student') {
      const myStudent = await get('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (!myStudent || myStudent.id !== parseInt(studentId)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const student = await get(`
      SELECT s.id, s.full_name, s.gr_number, s.roll_no, c.name as class_name, c.section, i.name as institution_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN institutions i ON s.institution_id = i.id
      WHERE s.id = ?
    `, [studentId]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const records = await query(`
      SELECT * FROM fees 
      WHERE student_id = ? 
      ORDER BY payment_date DESC
    `, [studentId]);

    const totalFees = records.reduce((acc, r) => acc + r.total_amount, 0);
    const totalPaid = records.reduce((acc, r) => acc + r.paid_amount, 0);
    const totalDue = records.reduce((acc, r) => acc + r.due_amount, 0);

    res.json({
      success: true,
      data: {
        student,
        summary: {
          totalFees,
          totalPaid,
          totalDue,
          isFullyPaid: totalDue === 0
        },
        records
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/fees/collect - Record Fee Payment & Generate Receipt
router.post('/collect', authenticate, authorize(['superadmin', 'branch_admin', 'clerk', 'student']), async (req, res, next) => {
  try {
    const { student_id, fee_type, amount, payment_method, remarks } = req.body;

    if (!student_id || !amount || !payment_method) {
      return res.status(400).json({ success: false, message: 'Please provide student ID, amount, and payment method.' });
    }

    const student = await get('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const receiptNo = `RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = parseFloat(amount);
    const paidAmount = parseFloat(amount);
    const dueAmount = 0; // Settled for this transaction
    const dateStr = new Date().toISOString().split('T')[0];

    await run(`
      INSERT INTO fees (
        student_id, receipt_no, academic_year, fee_type, total_amount, paid_amount,
        due_amount, payment_date, payment_method, status, remarks
      ) VALUES (?, ?, '2026-2027', ?, ?, ?, ?, ?, ?, 'paid', ?)
    `, [
      student_id, receiptNo, fee_type || 'Term Fee Installment',
      totalAmount, paidAmount, dueAmount, dateStr, payment_method,
      remarks || 'Online Payment through Vidyasphere Portal'
    ]);

    res.status(201).json({
      success: true,
      message: 'Fee payment processed and official receipt generated.',
      receipt: {
        receiptNo,
        studentName: student.full_name,
        amount: paidAmount,
        paymentMethod: payment_method,
        paymentDate: dateStr,
        status: 'PAID'
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/fees/summary - Admin financial overview
router.get('/summary', authenticate, authorize(['superadmin', 'branch_admin', 'clerk']), async (req, res, next) => {
  try {
    const overall = await get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_billed,
        COALESCE(SUM(paid_amount), 0) as total_collected,
        COALESCE(SUM(due_amount), 0) as total_outstanding,
        COUNT(*) as total_transactions
      FROM fees
    `);

    const byMethod = await query(`
      SELECT payment_method, COUNT(*) as count, SUM(paid_amount) as amount
      FROM fees
      GROUP BY payment_method
    `);

    res.json({
      success: true,
      data: {
        ...overall,
        byMethod
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

