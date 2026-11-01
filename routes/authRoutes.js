const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { get, query } = require('../config/database');
const { generateToken, authenticate } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username/email and password.' });
    }

    const user = await get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username.trim(), username.trim()]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/demo-login
// Fast 1-click evaluation login for Superadmin, Principal, Teacher, Student, Clerk
router.post('/demo-login', async (req, res, next) => {
  try {
    const { role } = req.body;
    const targetRole = role || 'superadmin';

    const user = await get('SELECT * FROM users WHERE role = ? LIMIT 1', [targetRole]);
    if (!user) {
      return res.status(404).json({ success: false, message: `No demo account for role: ${targetRole}` });
    }

    const token = generateToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      message: `Signed in as Demo ${user.role}.`,
      token,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await get('SELECT id, username, email, full_name, role, branch_id, phone, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let extraDetails = {};
    if (user.role === 'student') {
      const student = await get('SELECT s.*, c.name as class_name, c.section FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.user_id = ?', [user.id]);
      extraDetails = { studentProfile: student };
    } else if (user.role === 'teacher') {
      const teacher = await get('SELECT * FROM teachers WHERE user_id = ?', [user.id]);
      extraDetails = { teacherProfile: teacher };
    }

    res.json({
      success: true,
      user: { ...user, ...extraDetails }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

