const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../server');
const seed = require('../scripts/seed');

test('Vidyasphere End-to-End API Test Suite', async (t) => {
  // Initialize and seed database before running tests
  await seed();

  await t.test('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.ok(res.body.service.includes('JSS Pune'));
  });

  await t.test('GET /api/institutions returns JSS Pune branches', async () => {
    const res = await request(app).get('/api/institutions');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.count >= 8, 'Should have at least 8 seeded JSS Pune institutions');
    
    // Check for Swami Vivekanand Vidyamandir Dapodi
    const dapodi = res.body.data.find(i => i.code === 'SVVM-DAPODI');
    assert.ok(dapodi, 'Dapodi branch must exist');
    assert.strictEqual(dapodi.established_year, 1952);
  });

  await t.test('GET /api/institutions with category filter works', async () => {
    const res = await request(app).get('/api/institutions?category=senior_college');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.every(i => i.category === 'senior_college'));
  });

  await t.test('GET /api/notices returns bilingual notices', async () => {
    const res = await request(app).get('/api/notices?lang=mr');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length > 0);
    assert.ok(res.body.data[0].display_title, 'Should have localized display_title');
  });

  await t.test('GET /api/stats/overview returns multi-branch KPI data', async () => {
    const res = await request(app).get('/api/stats/overview');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.totalInstitutions > 0);
    assert.ok(res.body.data.totalEnrolledStudents > 0);
    assert.ok(res.body.data.categories.length > 0);
  });

  await t.test('POST /api/admissions/apply creates new application with tracking code', async () => {
    const payload = {
      institution_id: 1,
      applicant_name: 'Devendra K. Patil',
      parent_name: 'Kishor Patil',
      parent_phone: '+919876543210',
      parent_email: 'kishor.patil@example.com',
      applying_for_class: 'Class 8',
      dob: '2012-03-15',
      gender: 'Male',
      address: 'Dapodi, Pune',
      previous_school: 'Saraswati Primary School'
    };

    const res = await request(app).post('/api/admissions/apply').send(payload);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.applicationNumber.startsWith('JSS-2026-'));

    // Now test public tracking with that number
    const trackRes = await request(app).get(`/api/admissions/track/${res.body.applicationNumber}`);
    assert.strictEqual(trackRes.statusCode, 200);
    assert.strictEqual(trackRes.body.data.applicant_name, 'Devendra K. Patil');
  });

  await t.test('POST /api/auth/demo-login authenticates superadmin, teacher, and student', async () => {
    // 1. Superadmin demo
    const adminRes = await request(app).post('/api/auth/demo-login').send({ role: 'superadmin' });
    assert.strictEqual(adminRes.statusCode, 200);
    assert.strictEqual(adminRes.body.user.role, 'superadmin');
    assert.ok(adminRes.body.token);

    // 2. Student demo
    const studentRes = await request(app).post('/api/auth/demo-login').send({ role: 'student' });
    assert.strictEqual(studentRes.statusCode, 200);
    assert.strictEqual(studentRes.body.user.role, 'student');
  });

  let authToken = '';
  await t.test('POST /api/auth/login works with seeded credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'admin',
      password: 'Password@123'
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    authToken = res.body.token;
  });

  await t.test('GET /api/students returns student roster with fee and attendance stats', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${authToken}`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.length > 0);
    assert.ok('attendance_percentage' in res.body.data[0]);
  });

  await t.test('GET /api/grades/report-card/1 returns comprehensive academic marksheet', async () => {
    const res = await request(app)
      .get('/api/grades/report-card/1')
      .set('Authorization', `Bearer ${authToken}`);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.subjects.length > 0);
    assert.ok(res.body.data.summary.percentage > 0);
    assert.strictEqual(res.body.data.summary.status, 'PASSED');
  });

  await t.test('POST /api/fees/collect processes fee payment and generates receipt', async () => {
    const payload = {
      student_id: 1,
      fee_type: 'Computer & Science Lab Fee',
      amount: 2500,
      payment_method: 'UPI',
      remarks: 'Online Google Pay Transfer'
    };

    const res = await request(app)
      .post('/api/fees/collect')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.receipt.receiptNo.startsWith('RCPT-'));
    assert.strictEqual(res.body.receipt.amount, 2500);
  });

  await t.test('POST /api/contact submits public message', async () => {
    const res = await request(app).post('/api/contact').send({
      name: 'Ramesh Tawade',
      email: 'ramesh@example.com',
      phone: '+919876501234',
      subject: 'Admission inquiry for Class 9',
      message: 'Looking for hostel facilities for boys at Chakan branch.'
    });
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
  });
});
