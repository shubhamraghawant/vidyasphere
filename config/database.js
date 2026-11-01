const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.NODE_ENV === 'test' 
  ? path.join(dbDir, 'test.db') 
  : path.join(dbDir, 'vidyasphere.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Connected to SQLite database at ${dbPath}`);
    }
  }
});

// Helper promise wrappers
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Initialize schema
const initSchema = async () => {
  // 1. Users / Auth
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('superadmin', 'branch_admin', 'teacher', 'student', 'clerk')),
      branch_id INTEGER,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Institutions / Branches (JSS Pune Schools & Colleges)
  await run(`
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_mr TEXT,
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('primary_marathi', 'primary_english', 'secondary_marathi', 'junior_college', 'senior_college')),
      medium TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT DEFAULT 'Pune',
      pincode TEXT,
      phone TEXT,
      email TEXT,
      principal_name TEXT,
      established_year INTEGER,
      total_students INTEGER DEFAULT 0,
      total_faculty INTEGER DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Classes / Grades
  await run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      academic_year TEXT DEFAULT '2026-2027',
      class_teacher_id INTEGER,
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    )
  `);

  // 4. Teachers
  await run(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      institution_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      employee_id TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      designation TEXT NOT NULL,
      qualification TEXT,
      subjects TEXT,
      phone TEXT,
      email TEXT,
      joining_date DATE,
      FOREIGN KEY (institution_id) REFERENCES institutions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 5. Students
  await run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      institution_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      roll_no INTEGER NOT NULL,
      gr_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      dob DATE,
      gender TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      email TEXT,
      address TEXT,
      admission_date DATE,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'transferred', 'alumni')),
      FOREIGN KEY (institution_id) REFERENCES institutions(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 6. Admissions Inquiries & Applications
  await run(`
    CREATE TABLE IF NOT EXISTS admissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT UNIQUE NOT NULL,
      institution_id INTEGER NOT NULL,
      applicant_name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      parent_phone TEXT NOT NULL,
      parent_email TEXT,
      applying_for_class TEXT NOT NULL,
      dob DATE,
      gender TEXT,
      address TEXT,
      previous_school TEXT,
      status TEXT DEFAULT 'submitted' CHECK(status IN ('submitted', 'under_review', 'verified', 'approved', 'rejected', 'enrolled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    )
  `);

  // 7. Fees Structure & Ledger
  await run(`
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      receipt_no TEXT UNIQUE NOT NULL,
      academic_year TEXT DEFAULT '2026-2027',
      fee_type TEXT NOT NULL,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL,
      due_amount REAL NOT NULL,
      payment_date DATE,
      payment_method TEXT CHECK(payment_method IN ('UPI', 'Cash', 'Cheque', 'NetBanking', 'Card')),
      status TEXT DEFAULT 'paid' CHECK(status IN ('paid', 'partial', 'pending')),
      remarks TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id)
    )
  `);

  // 8. Attendance
  await run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      date DATE NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'late', 'excused')),
      remarks TEXT,
      recorded_by INTEGER,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      UNIQUE(student_id, date)
    )
  `);

  // 9. Exams & Grades
  await run(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      exam_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      marks_obtained REAL NOT NULL,
      max_marks REAL NOT NULL,
      grade TEXT,
      remarks TEXT,
      exam_date DATE,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    )
  `);

  // 10. Notices, Circulars & Announcements
  await run(`
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      title_mr TEXT,
      content TEXT NOT NULL,
      content_mr TEXT,
      category TEXT NOT NULL CHECK(category IN ('academic', 'exam', 'sports', 'cultural', 'administrative', 'circular')),
      target_role TEXT DEFAULT 'all',
      institution_id INTEGER,
      published_date DATE DEFAULT CURRENT_DATE,
      is_pinned INTEGER DEFAULT 0,
      attachment_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (institution_id) REFERENCES institutions(id)
    )
  `);

  // 11. Contact Messages & Grievances
  await run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'in_progress', 'resolved')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

module.exports = {
  db,
  query,
  get,
  run,
  initSchema
};
