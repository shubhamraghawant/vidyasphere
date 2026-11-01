const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/attendance/class/:classId - View Class Attendance Roster for Date
router.get('/class/:classId', authenticate, async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const students = await query(`
      SELECT s.id, s.roll_no, s.gr_number, s.full_name, s.gender,
             COALESCE(a.status, 'present') as status,
             a.remarks
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
      WHERE s.class_id = ?
      ORDER BY s.roll_no ASC
    `, [targetDate, req.params.classId]);

    const presentCount = students.filter(s => s.status === 'present').length;
    const absentCount = students.filter(s => s.status === 'absent').length;
    const lateCount = students.filter(s => s.status === 'late').length;

    res.json({
      success: true,
      classId: parseInt(req.params.classId),
      date: targetDate,
      stats: {
        total: students.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        percentage: students.length > 0 ? Math.round((presentCount / students.length) * 100) : 100
      },
      data: students
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/attendance/batch - Submit daily class attendance
router.post('/batch', authenticate, authorize(['superadmin', 'branch_admin', 'teacher']), async (req, res, next) => {
  try {
    const { class_id, date, records } = req.body;
    // records: [ { student_id: 1, status: 'present'/'absent'/'late', remarks: '' } ]

    if (!class_id || !date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Please provide class_id, date, and records array.' });
    }

    for (const item of records) {
      await run(`
        INSERT INTO attendance (student_id, class_id, date, status, remarks, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id, date) DO UPDATE SET
          status = excluded.status,
          remarks = excluded.remarks,
          recorded_by = excluded.recorded_by
      `, [item.student_id, class_id, date, item.status || 'present', item.remarks || '', req.user.id]);
    }

    res.json({
      success: true,
      message: `Successfully recorded attendance for ${records.length} students on ${date}.`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

