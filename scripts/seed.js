const bcrypt = require('bcryptjs');
const { run, query, initSchema } = require('../config/database');

const seed = async () => {
  console.log('🌱 Starting Vidyasphere (JSS Pune) Database Seed...');

  await initSchema();

  // Clear existing records
  await run('DELETE FROM contact_messages');
  await run('DELETE FROM notices');
  await run('DELETE FROM grades');
  await run('DELETE FROM attendance');
  await run('DELETE FROM fees');
  await run('DELETE FROM admissions');
  await run('DELETE FROM students');
  await run('DELETE FROM teachers');
  await run('DELETE FROM classes');
  await run('DELETE FROM institutions');
  await run('DELETE FROM users');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Seed Institutions (JSS Pune branches from jsspune.in)
  const institutionsData = [
    {
      name: 'Swami Vivekanand Vidyamandir & Junior College, Dapodi',
      name_mr: 'स्वामी विवेकानंद विद्यामंदिर व कनिष्ठ महाविद्यालय, दापोडी',
      code: 'SVVM-DAPODI',
      category: 'secondary_marathi',
      medium: 'Marathi & Semi-English',
      address: 'ST Workshop Road, Dapodi, Pune',
      pincode: '411012',
      phone: '+919922277322',
      email: 'svvm.dapodi@jsspune.in',
      principal_name: 'Dr. Suresh S. Patil',
      established_year: 1952,
      total_students: 1850,
      total_faculty: 62,
      image_url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80'
    },
    {
      name: 'Shri Shivaji Vidyamandir & S.B. Patole Jr. College, Chakan',
      name_mr: 'श्री शिवाजी विद्यामंदिर व एस. बी. पाटोळे कनिष्ठ महाविद्यालय, चाकण',
      code: 'SSVM-CHAKAN',
      category: 'secondary_marathi',
      medium: 'Marathi & Semi-English',
      address: 'Talegaon Chowk, Chakan, Pune',
      pincode: '410501',
      phone: '+919850124211',
      email: 'ssvm.chakan@jsspune.in',
      principal_name: 'Prof. Ramesh K. Deshmukh',
      established_year: 1960,
      total_students: 2100,
      total_faculty: 75,
      image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80'
    },
    {
      name: 'Shri Shivaji Vidyamandir & Junior College, Aundh',
      name_mr: 'श्री शिवाजी विद्यामंदिर व कनिष्ठ महाविद्यालय, औंध',
      code: 'SSVM-AUNDH',
      category: 'secondary_marathi',
      medium: 'Marathi & English',
      address: 'Near Bremen Chowk, Aundh, Pune',
      pincode: '411007',
      phone: '+919822334455',
      email: 'ssvm.aundh@jsspune.in',
      principal_name: 'Mrs. Sunita M. Joshi',
      established_year: 1968,
      total_students: 1640,
      total_faculty: 58,
      image_url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80'
    },
    {
      name: 'New English School & Junior College, Hinjawadi',
      name_mr: 'न्यू इंग्लिश स्कूल व कनिष्ठ महाविद्यालय, हिंजवडी',
      code: 'NES-HINJAWADI',
      category: 'secondary_marathi',
      medium: 'Semi-English & Marathi',
      address: 'Phase 1, Hinjawadi IT Park Road, Pune',
      pincode: '411057',
      phone: '+919766554433',
      email: 'nes.hinjawadi@jsspune.in',
      principal_name: 'Mr. Arvind B. Pawar',
      established_year: 1975,
      total_students: 1420,
      total_faculty: 52,
      image_url: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&q=80'
    },
    {
      name: 'Smt. Chandrakala Kishorilal Goyal Arts & Commerce College, Dapodi',
      name_mr: 'श्रीमती चंद्रकला किशोरीलाल गोयल कला व वाणिज्य महाविद्यालय, दापोडी',
      code: 'CKG-COLLEGE',
      category: 'senior_college',
      medium: 'Marathi & English',
      address: 'JSS Campus, Dapodi, Pune',
      pincode: '411012',
      phone: '+919422001122',
      email: 'ckgoyal.dapodi@jsspune.in',
      principal_name: 'Dr. Anand V. Jagtap',
      established_year: 1986,
      total_students: 2450,
      total_faculty: 84,
      image_url: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=800&q=80'
    },
    {
      name: 'Blossom Primary English Medium School, Sangavi',
      name_mr: 'ब्लॉसम प्रायमरी इंग्लिश मीडियम स्कूल, सांगवी',
      code: 'BPEMS-SANGAVI',
      category: 'primary_english',
      medium: 'English',
      address: 'Pimple Gurav Road, Sangavi, Pune',
      pincode: '411027',
      phone: '+919860112233',
      email: 'blossom.sangavi@jsspune.in',
      principal_name: 'Mrs. Anjali R. Kulkarni',
      established_year: 1994,
      total_students: 820,
      total_faculty: 36,
      image_url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80'
    },
    {
      name: 'Punyashlok Ahilya Devi Vidyamandir, Jejuri',
      name_mr: 'पुण्यश्लोक अहिल्यादेवी विद्यामंदिर व कला/वाणिज्य महाविद्यालय, जेजुरी',
      code: 'PAVM-JEJURI',
      category: 'junior_college',
      medium: 'Marathi & English',
      address: 'Khandoba Temple Road, Jejuri, Pune',
      pincode: '412303',
      phone: '+919890445566',
      email: 'pavm.jejuri@jsspune.in',
      principal_name: 'Mr. Vilas T. Shinde',
      established_year: 1972,
      total_students: 1150,
      total_faculty: 44,
      image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80'
    },
    {
      name: 'Marathi Prathamik Shala, Sangavi',
      name_mr: 'मराठी प्राथमिक शाळा, सांगवी, पुणे',
      code: 'MPS-SANGAVI',
      category: 'primary_marathi',
      medium: 'Marathi',
      address: 'Juni Sangavi, Pune',
      pincode: '411027',
      phone: '+919977889900',
      email: 'mps.sangavi@jsspune.in',
      principal_name: 'Mrs. Rekha V. More',
      established_year: 1965,
      total_students: 540,
      total_faculty: 22,
      image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80'
    }
  ];

  for (const inst of institutionsData) {
    await run(`
      INSERT INTO institutions (
        name, name_mr, code, category, medium, address, pincode, phone, email,
        principal_name, established_year, total_students, total_faculty, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inst.name, inst.name_mr, inst.code, inst.category, inst.medium, inst.address,
      inst.pincode, inst.phone, inst.email, inst.principal_name, inst.established_year,
      inst.total_students, inst.total_faculty, inst.image_url
    ]);
  }

  // 2. Seed Users
  const usersData = [
    {
      username: 'admin',
      email: 'superadmin@jsspune.in',
      full_name: 'Jayprakash J. Jagtap (Sanstha President)',
      role: 'superadmin',
      branch_id: 1,
      phone: '+919922277322'
    },
    {
      username: 'principal',
      email: 'principal.svvm@jsspune.in',
      full_name: 'Dr. Suresh S. Patil (Headmaster)',
      role: 'branch_admin',
      branch_id: 1,
      phone: '+919850124211'
    },
    {
      username: 'teacher',
      email: 'teacher.deshmukh@jsspune.in',
      full_name: 'Milind N. Deshmukh (M.Sc, B.Ed)',
      role: 'teacher',
      branch_id: 1,
      phone: '+919822114477'
    },
    {
      username: 'student',
      email: 'student.aaditya@jsspune.in',
      full_name: 'Aaditya Rajesh Joshi',
      role: 'student',
      branch_id: 1,
      phone: '+919890223344'
    },
    {
      username: 'clerk',
      email: 'clerk.dapodi@jsspune.in',
      full_name: 'Sandeep V. Jagdale (Accounts Desk)',
      role: 'clerk',
      branch_id: 1,
      phone: '+919765443322'
    }
  ];

  const userIds = {};
  for (const u of usersData) {
    const res = await run(`
      INSERT INTO users (username, email, password_hash, full_name, role, branch_id, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [u.username, u.email, passwordHash, u.full_name, u.role, u.branch_id, u.phone]);
    userIds[u.username] = res.lastID;
  }

  // 3. Seed Classes for Swami Vivekanand Vidyamandir (Branch 1)
  const classesData = [
    { name: 'Class 8', section: 'A', class_teacher_id: 1 },
    { name: 'Class 8', section: 'B', class_teacher_id: 2 },
    { name: 'Class 9', section: 'A', class_teacher_id: 1 },
    { name: 'Class 9', section: 'B', class_teacher_id: 2 },
    { name: 'Class 10', section: 'A', class_teacher_id: 1 },
    { name: 'Class 10', section: 'B', class_teacher_id: 2 },
    { name: 'Class 11', section: 'Sci-A', class_teacher_id: 3 },
    { name: 'Class 12', section: 'Comm-A', class_teacher_id: 4 }
  ];

  const classIds = [];
  for (const c of classesData) {
    const res = await run(`
      INSERT INTO classes (institution_id, name, section, academic_year, class_teacher_id)
      VALUES (1, ?, ?, '2026-2027', ?)
    `, [c.name, c.section, c.class_teacher_id]);
    classIds.push(res.lastID);
  }

  // 4. Seed Teachers
  const teachersData = [
    {
      userId: userIds['teacher'],
      institutionId: 1,
      name: 'Milind N. Deshmukh',
      empId: 'JSS-T-101',
      dept: 'Mathematics',
      designation: 'Senior Teacher & Class Incharge (10-A)',
      qualification: 'M.Sc (Maths), B.Ed',
      subjects: 'Mathematics, Algebra, Geometry',
      phone: '+919822114477',
      email: 'mdeshmukh@jsspune.in'
    },
    {
      userId: null,
      institutionId: 1,
      name: 'Pooja V. Kulkarni',
      empId: 'JSS-T-102',
      dept: 'Science',
      designation: 'Assistant Teacher',
      qualification: 'M.Sc (Physics), B.Ed',
      subjects: 'Science, Physics, Chemistry',
      phone: '+919822335588',
      email: 'pkulkarni@jsspune.in'
    },
    {
      userId: null,
      institutionId: 1,
      name: 'Ganesh S. Shinde',
      empId: 'JSS-T-103',
      dept: 'Languages',
      designation: 'Head of Marathi Dept',
      qualification: 'M.A (Marathi), M.Ed',
      subjects: 'Marathi, Sanskrit',
      phone: '+919822446699',
      email: 'gshinde@jsspune.in'
    },
    {
      userId: null,
      institutionId: 1,
      name: 'Deepali A. Salunke',
      empId: 'JSS-T-104',
      dept: 'English',
      designation: 'Lecturer',
      qualification: 'M.A (English), B.Ed',
      subjects: 'English Grammar & Literature',
      phone: '+919822557700',
      email: 'dsalunke@jsspune.in'
    },
    {
      userId: null,
      institutionId: 1,
      name: 'Pradeep R. Jadhav',
      empId: 'JSS-T-105',
      dept: 'Social Sciences',
      designation: 'Assistant Teacher',
      qualification: 'M.A (History), B.Ed',
      subjects: 'History, Civics, Geography',
      phone: '+919822668811',
      email: 'pjadhav@jsspune.in'
    }
  ];

  for (const t of teachersData) {
    await run(`
      INSERT INTO teachers (user_id, institution_id, name, employee_id, department, designation, qualification, subjects, phone, email, joining_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2018-06-15')
    `, [t.userId, t.institutionId, t.name, t.empId, t.dept, t.designation, t.qualification, t.subjects, t.phone, t.email]);
  }

  // 5. Seed Students (in Class 10-A, id: classIds[4])
  const targetClassId = classIds[4] || 5; // Class 10-A
  const studentsList = [
    { name: 'Aaditya Rajesh Joshi', roll: 12, gr: 'GR-2021-1045', user: userIds['student'], gender: 'Male', parent: 'Rajesh Joshi', phone: '+919890223344', dob: '2011-04-14' },
    { name: 'Tanvi Shrikant Kulkarni', roll: 1, gr: 'GR-2021-1046', user: null, gender: 'Female', parent: 'Shrikant Kulkarni', phone: '+919890112233', dob: '2011-08-22' },
    { name: 'Pranav Mahesh Deshpande', roll: 2, gr: 'GR-2021-1047', user: null, gender: 'Male', parent: 'Mahesh Deshpande', phone: '+919890334455', dob: '2011-02-18' },
    { name: 'Sakshi Santosh Patil', roll: 3, gr: 'GR-2021-1048', user: null, gender: 'Female', parent: 'Santosh Patil', phone: '+919890445566', dob: '2011-11-05' },
    { name: 'Rohan Sunil Jagtap', roll: 4, gr: 'GR-2021-1049', user: null, gender: 'Male', parent: 'Sunil Jagtap', phone: '+919890556677', dob: '2011-06-30' },
    { name: 'Ananya Dilip Shinde', roll: 5, gr: 'GR-2021-1050', user: null, gender: 'Female', parent: 'Dilip Shinde', phone: '+919890667788', dob: '2011-09-12' },
    { name: 'Omkar Vitthal Pawar', roll: 6, gr: 'GR-2021-1051', user: null, gender: 'Male', parent: 'Vitthal Pawar', phone: '+919890778899', dob: '2011-03-25' },
    { name: 'Snehal Ramesh Gaikwad', roll: 7, gr: 'GR-2021-1052', user: null, gender: 'Female', parent: 'Ramesh Gaikwad', phone: '+919890889900', dob: '2011-12-14' },
    { name: 'Atharva Vinod More', roll: 8, gr: 'GR-2021-1053', user: null, gender: 'Male', parent: 'Vinod More', phone: '+919890990011', dob: '2011-01-19' },
    { name: 'Isha Nitin Kadam', roll: 9, gr: 'GR-2021-1054', user: null, gender: 'Female', parent: 'Nitin Kadam', phone: '+919890123456', dob: '2011-07-08' }
  ];

  const studentIds = [];
  for (const s of studentsList) {
    const res = await run(`
      INSERT INTO students (
        user_id, institution_id, class_id, roll_no, gr_number, full_name, dob, gender,
        parent_name, parent_phone, email, address, admission_date, status
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Dapodi, Pune - 411012', '2021-06-15', 'active')
    `, [s.user, targetClassId, s.roll, s.gr, s.name, s.dob, s.gender, s.parent, s.phone, s.name.toLowerCase().replace(/\s+/g, '.') + '@jsspune.in']);
    studentIds.push(res.lastID);
  }

  // 6. Seed Admissions Inquiries (for website public admissions)
  const admissionsList = [
    { appNo: 'JSS-2026-081', instId: 1, name: 'Siddhesh Vilas Bhor', parent: 'Vilas Bhor', phone: '+919822331122', classReq: 'Class 8', status: 'approved' },
    { appNo: 'JSS-2026-082', instId: 1, name: 'Mrunal Sachin Chavan', parent: 'Sachin Chavan', phone: '+919822442233', classReq: 'Class 11 Science', status: 'under_review' },
    { appNo: 'JSS-2026-083', instId: 6, name: 'Aarav Rahul Mehta', parent: 'Rahul Mehta', phone: '+919822553344', classReq: 'Class 1 (English)', status: 'verified' },
    { appNo: 'JSS-2026-084', instId: 2, name: 'Kavya Ajay Thorat', parent: 'Ajay Thorat', phone: '+919822664455', classReq: 'Class 5', status: 'submitted' },
    { appNo: 'JSS-2026-085', instId: 1, name: 'Yashwardhan Nitin Bhosale', parent: 'Nitin Bhosale', phone: '+919822775566', classReq: 'Class 9', status: 'enrolled' }
  ];

  for (const adm of admissionsList) {
    await run(`
      INSERT INTO admissions (
        application_no, institution_id, applicant_name, parent_name, parent_phone,
        applying_for_class, dob, gender, address, previous_school, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, '2013-05-10', 'Male', 'Pune, Maharashtra', 'Zilla Parishad Primary School', ?, 'Original Transfer Certificate verified.')
    `, [adm.appNo, adm.instId, adm.name, adm.parent, adm.phone, adm.classReq, adm.status]);
  }

  // 7. Seed Fees Ledger
  const aadityaId = studentIds[0];
  const feesData = [
    { studentId: aadityaId, receipt: 'RCPT-2026-0192', type: 'Term 1 Tuition & Lab Fee', total: 12000, paid: 12000, due: 0, date: '2026-07-10', method: 'UPI', status: 'paid' },
    { studentId: aadityaId, receipt: 'RCPT-2026-0485', type: 'Term 2 Tuition & Sports Fee', total: 12000, paid: 8000, due: 4000, date: '2026-10-15', method: 'NetBanking', status: 'partial' },
    { studentId: studentIds[1], receipt: 'RCPT-2026-0201', type: 'Annual Composite Fee', total: 24000, paid: 24000, due: 0, date: '2026-06-25', method: 'UPI', status: 'paid' },
    { studentId: studentIds[2], receipt: 'RCPT-2026-0202', type: 'Annual Composite Fee', total: 24000, paid: 15000, due: 9000, date: '2026-07-02', method: 'Cash', status: 'partial' }
  ];

  for (const f of feesData) {
    await run(`
      INSERT INTO fees (
        student_id, receipt_no, academic_year, fee_type, total_amount, paid_amount,
        due_amount, payment_date, payment_method, status, remarks
      ) VALUES (?, ?, '2026-2027', ?, ?, ?, ?, ?, ?, ?, 'Official JSS Sanstha Receipt')
    `, [f.studentId, f.receipt, f.type, f.total, f.paid, f.due, f.date, f.method, f.status]);
  }

  // 8. Seed Attendance (last 15 days)
  const now = new Date();
  for (let d = 14; d >= 0; d--) {
    const curDate = new Date(now);
    curDate.setDate(now.getDate() - d);
    if (curDate.getDay() === 0) continue; // Skip Sunday

    const dateStr = curDate.toISOString().split('T')[0];
    for (let i = 0; i < studentIds.length; i++) {
      const sId = studentIds[i];
      // Aaditya (student 0) has 95% attendance
      const isAbsent = (i === 0 && d === 4) || (i > 0 && Math.random() < 0.12);
      const isLate = !isAbsent && Math.random() < 0.08;
      const status = isAbsent ? 'absent' : (isLate ? 'late' : 'present');

      await run(`
        INSERT OR IGNORE INTO attendance (student_id, class_id, date, status, recorded_by)
        VALUES (?, ?, ?, ?, ?)
      `, [sId, targetClassId, dateStr, status, 1]);
    }
  }

  // 9. Seed Grades for Class 10-A
  const subjects = [
    { name: 'Mathematics', max: 100 },
    { name: 'Science & Technology', max: 100 },
    { name: 'English Language', max: 100 },
    { name: 'Marathi (First Language)', max: 100 },
    { name: 'Social Sciences', max: 100 }
  ];

  for (const sId of studentIds) {
    for (const sub of subjects) {
      const marks = Math.floor(70 + Math.random() * 26); // 70 to 95
      let grade = 'A+';
      if (marks < 75) grade = 'B+';
      else if (marks < 85) grade = 'A';

      await run(`
        INSERT INTO grades (student_id, class_id, exam_name, subject, marks_obtained, max_marks, grade, exam_date)
        VALUES (?, ?, 'Mid-Term Examination 2026', ?, ?, ?, ?, '2026-10-12')
      `, [sId, targetClassId, sub.name, marks, sub.max, grade]);
    }
  }

  // 10. Seed Notices & Circulars (Marathi & English - exactly like jsspune.in)
  const noticesData = [
    {
      title: 'SSC Board Examination 2027 Registration & Form Filling Schedule',
      title_mr: 'इयत्ता १० वी (एसएससी) बोर्ड परीक्षा २०२७ अर्ज नोंदणी वेळापत्रक',
      content: 'All Class 10 students and parents are hereby notified that the Maharashtra State Board exam online verification and signature process commences from 10th November 2026. Please verify candidate details with school clerk.',
      content_mr: 'सर्व इयत्ता १० वी चे विद्यार्थी व पालकांना सूचित करण्यात येते की महाराष्ट्र राज्य माध्यमिक शिक्षण मंडळाचे परीक्षा अर्ज पडताळणी प्रक्रिया १० नोव्हेंबर २०२६ पासून सुरू होत आहे. कृपया आवश्यक कागदपत्रे शाळेत जमा करावीत.',
      category: 'exam',
      is_pinned: 1
    },
    {
      title: 'Annual Sports Meet & Inter-School Kho-Kho / Kabaddi Championship',
      title_mr: 'वार्षिक क्रीडा महोत्सव व आंतरशालेय खो-खो / कबड्डी स्पर्धा',
      content: 'The 74th Janata Shikshan Sanstha Inter-School Sports Tournament will be hosted at Dapodi Main Sports Ground from 18th to 21st December 2026. Teams from all 18 branches will compete.',
      content_mr: 'जनता शिक्षण संस्थेचा ७४ वा आंतरशालेय क्रीडा महोत्सव दापोडी मुख्य क्रीडांगणावर १८ ते २१ डिसेंबर २०२६ दरम्यान आयोजित करण्यात आला आहे. सर्व १८ शाखांमधील संघ यात सहभागी होतील.',
      category: 'sports',
      is_pinned: 1
    },
    {
      title: 'Online Admissions Open for Academic Year 2027-2028 (KG to Junior College)',
      title_mr: 'शैक्षणिक वर्ष २०२७-२०२८ प्रवेश प्रक्रिया सुरू (शिशुवर्ग ते कनिष्ठ महाविद्यालय)',
      content: 'Online admission forms are now open across all JSS Pune primary, secondary, and junior college institutions. Merit list dates will be published on the portal.',
      content_mr: 'जनता शिक्षण संस्था संचलित सर्व प्राथमिक, माध्यमिक व कनिष्ठ महाविद्यालयांमध्ये सन २०२७-२८ साठी ऑनलाइन प्रवेश अर्ज उपलब्ध झाले आहेत.',
      category: 'academic',
      is_pinned: 0
    },
    {
      title: 'Government Pre-Matric & Savitribai Phule Scholarship Scheme Notice',
      title_mr: 'शासकीय मॅट्रिकपूर्व व सावित्रीबाई फुले शिष्यवृत्ती योजना सूचना',
      content: 'Eligible students for State Government scholarship schemes must submit Aadhaar linked bank passbook and income certificates to the clerk office before 25th November 2026.',
      content_mr: 'शासकीय शिष्यवृत्तीसाठी पात्र विद्यार्थ्यांनी आधार लिंक बँक पासबुक व उत्पन्न दाखला २५ नोव्हेंबर २०२६ पूर्वी लिपिक कार्यालयात सादर करावा.',
      category: 'circular',
      is_pinned: 0
    }
  ];

  for (const n of noticesData) {
    await run(`
      INSERT INTO notices (title, title_mr, content, content_mr, category, target_role, institution_id, is_pinned)
      VALUES (?, ?, ?, ?, ?, 'all', 1, ?)
    `, [n.title, n.title_mr, n.content, n.content_mr, n.category, n.is_pinned]);
  }

  // 11. Seed Contact Messages
  await run(`
    INSERT INTO contact_messages (name, email, phone, subject, message, status)
    VALUES 
      ('Sunil S. Rao', 'sunilrao@gmail.com', '+919822001122', 'Inquiry regarding 11th Science Admissions', 'Kindly let me know the cutoff and fee structure for 11th Science at Aundh branch.', 'new'),
      ('Meena V. Joshi', 'meenajoshi@gmail.com', '+919822334455', 'Transfer Certificate Query', 'Need assistance with obtaining school leaving certificate for my daughter.', 'in_progress')
  `);

  console.log('✅ Database successfully seeded with JSS Pune institutions, users, classes, students, fees, attendance, grades, and notices!');
};

if (require.main === module) {
  seed().then(() => {
    process.exit(0);
  }).catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
}

module.exports = seed;
