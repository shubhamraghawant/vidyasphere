const express = require('express');
const router = express.Router();
const { query, get, run } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/grades/report-card/:studentId
router.get('/report-card/:studentId', authenticate, async (req, res, next) => {
  try {
    const student = await get(`
      SELECT s.*, c.name as class_name, c.section, i.name as institution_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN institutions i ON s.institution_id = i.id
      WHERE s.id = ?
    `, [req.params.studentId]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const marks = await query(`
      SELECT * FROM grades 
      WHERE student_id = ? 
      ORDER BY exam_date DESC, subject ASC
    `, [req.params.studentId]);

    const totalObtained = marks.reduce((acc, m) => acc + m.marks_obtained, 0);
    const totalMax = marks.reduce((acc, m) => acc + m.max_marks, 0);
    const overallPercentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : 0;

    let overallGrade = 'A+';
    if (overallPercentage < 50) overallGrade = 'D';
    else if (overallPercentage < 60) overallGrade = 'C';
    else if (overallPercentage < 75) overallGrade = 'B';
    else if (overallPercentage < 85) overallGrade = 'A';

    res.json({
      success: true,
      data: {
        student,
        summary: {
          totalObtained,
          totalMax,
          percentage: parseFloat(overallPercentage),
          grade: overallGrade,
          status: overallPercentage >= 35 ? 'PASSED' : 'FAILED'
        },
        subjects: marks
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/grades/entry - Record or update marks
router.post('/entry', authenticate, authorize(['superadmin', 'branch_admin', 'teacher']), async (req, res, next) => {
  try {
    const { student_id, class_id, exam_name, subject, marks_obtained, max_marks, exam_date } = req.body;

    if (!student_id || !class_id || !exam_name || !subject || marks_obtained === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all exam marks fields.' });
    }

    const marksNum = parseFloat(marks_obtained);
    const maxNum = parseFloat(max_marks || 100);
    const pct = (marksNum / maxNum) * 100;
    let grade = 'A+';
    if (pct < 50) grade = 'D';
    else if (pct < 60) grade = 'C';
    else if (pct < 75) grade = 'B';
    else if (pct < 85) grade = 'A';

    await run(`
      INSERT INTO grades (student_id, class_id, exam_name, subject, marks_obtained, max_marks, grade, exam_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, class_id, exam_name, subject, marksNum, maxNum, grade, exam_date || new Date().toISOString().split('T')[0]]);

    res.status(201).json({
      success: true,
      message: 'Marks recorded successfully.',
      grade
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
