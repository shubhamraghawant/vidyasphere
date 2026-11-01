// Vidyasphere Client Application
let currentRole = 'public';
let currentUser = null;
let currentToken = null;
let allInstitutions = [];
let allNotices = [];

document.addEventListener('DOMContentLoaded', () => {
  // Initialize language
  const savedLang = localStorage.getItem('vidyasphere_lang') || 'en';
  setLanguage(savedLang);

  // Initialize Lucide icons
  if (window.lucide) lucide.createIcons();

  // Load public data
  loadOverviewStats();
  loadInstitutions();
  loadNotices();

  // Set up event listeners
  setupEventListeners();
});

function setupEventListeners() {
  // Language toggle
  document.getElementById('btn-lang-toggle')?.addEventListener('click', () => {
    const nextLang = currentLang === 'en' ? 'mr' : 'en';
    setLanguage(nextLang);
    loadNotices(); // reload notices in chosen language
  });

  // Admission application form
  const admissionForm = document.getElementById('form-admission');
  if (admissionForm) {
    admissionForm.addEventListener('submit', handleAdmissionSubmit);
  }

  // Application tracker form
  const trackerForm = document.getElementById('form-tracker');
  if (trackerForm) {
    trackerForm.addEventListener('submit', handleTrackApplication);
  }

  // Contact form
  const contactForm = document.getElementById('form-contact');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
}

// ---------------------------------------------------------------------------
// 1-Click Role Switcher Demo Bar
// ---------------------------------------------------------------------------
async function switchRole(role) {
  currentRole = role;

  // Update active pill styling
  document.querySelectorAll('.demo-pill').forEach(btn => {
    btn.classList.remove('bg-[#ebd7b4]', 'text-[#182b42]', 'font-bold');
    btn.classList.add('bg-[#243954]', 'text-[#d1dce7]');
  });

  const activeBtn = document.getElementById(`pill-${role}`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-[#243954]', 'text-[#d1dce7]');
    activeBtn.classList.add('bg-[#ebd7b4]', 'text-[#182b42]', 'font-bold');
  }

  if (role === 'public') {
    currentToken = null;
    currentUser = null;
    document.getElementById('view-public').classList.remove('hidden');
    document.getElementById('view-dashboard').classList.add('hidden');
    showToast('Switched to Public Sanstha Website', 'info');
    return;
  }

  // Authenticate demo account
  try {
    const res = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    currentToken = data.token;
    currentUser = data.user;

    document.getElementById('view-public').classList.add('hidden');
    document.getElementById('view-dashboard').classList.remove('hidden');

    renderDashboardForRole(role);
    showToast(`Logged in as ${currentUser.full_name} (${role.toUpperCase()})`, 'success');
  } catch (err) {
    showToast('Failed to switch role: ' + err.message, 'error');
  }
}

// ---------------------------------------------------------------------------
// Public Site Loaders
// ---------------------------------------------------------------------------
async function loadOverviewStats() {
  try {
    const res = await fetch('/api/stats/overview');
    const data = await res.json();
    if (!data.success) return;

    const stats = data.data;
    document.getElementById('stat-students').textContent = stats.totalEnrolledStudents.toLocaleString() + '+';
    document.getElementById('stat-faculty').textContent = stats.totalFaculty.toLocaleString() + '+';
    document.getElementById('stat-institutions').textContent = stats.totalInstitutions;
    
    // Render charts if on dashboard or overview
    renderCategoryChart(stats.categories);
    renderBranchComparisonChart(stats.topBranches);
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

async function loadInstitutions(category = 'all') {
  try {
    const url = category === 'all' ? '/api/institutions' : `/api/institutions?category=${category}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) return;

    allInstitutions = data.data;
    renderInstitutionsGrid(allInstitutions);
    populateInstitutionDropdown(allInstitutions);
  } catch (err) {
    console.error('Error loading institutions:', err);
  }
}

function renderInstitutionsGrid(institutions) {
  const container = document.getElementById('institutions-grid');
  if (!container) return;

  if (institutions.length === 0) {
    container.innerHTML = `<div class="col-span-3 text-center py-12 text-[#8995a2]">No institutions found matching this category.</div>`;
    return;
  }

  const categoryTagClass = (cat) => {
    if (cat === 'primary_marathi') return 'pastel-tag-sand';
    if (cat === 'primary_english') return 'pastel-tag-sage';
    if (cat === 'secondary_marathi') return 'pastel-tag-slate';
    if (cat === 'senior_college' || cat === 'junior_college') return 'pastel-tag-rose';
    return 'pastel-tag-sand';
  };

  container.innerHTML = institutions.map(inst => `
    <div class="minimal-card overflow-hidden flex flex-col justify-between">
      <div>
        <div class="relative h-44 overflow-hidden bg-[#f4f1eb]">
          <img src="${inst.image_url}" alt="${inst.name}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
          <div class="absolute top-3 right-3">
            <span class="inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${categoryTagClass(inst.category)}">
              ${inst.category.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div class="absolute bottom-3 left-3 bg-[#182b42]/80 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-wide">
            Est. ${inst.established_year}
          </div>
        </div>
        <div class="p-6">
          <div class="text-[11px] font-semibold text-[#8c6747] mb-1 tracking-wider uppercase">${inst.code}</div>
          <h3 class="text-base font-serif font-bold text-[#182b42] leading-snug mb-2">${inst.name}</h3>
          <p class="text-xs text-[#687583] mb-4 flex items-center gap-1.5">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-[#9c783e]"></i>
            ${inst.address}
          </p>
          <div class="grid grid-cols-2 gap-2 text-xs py-3 border-y border-[#eee9df] text-[#556371] mb-4">
            <div><strong class="text-[#182b42]">Medium:</strong> ${inst.medium}</div>
            <div><strong class="text-[#182b42]">Enrolled:</strong> ${inst.total_students.toLocaleString()}</div>
            <div><strong class="text-[#182b42]">Principal:</strong> ${inst.principal_name.split(' ')[0]} ${inst.principal_name.split(' ')[1] || ''}</div>
            <div><strong class="text-[#182b42]">Phone:</strong> ${inst.phone}</div>
          </div>
        </div>
      </div>
      <div class="p-6 pt-0 flex gap-2">
        <button onclick="viewInstitutionDetails(${inst.id})" class="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-xl border border-[#ded8cc] bg-white text-[#182b42] hover:bg-[#faf9f7] transition">
          View Dossier
        </button>
        <button onclick="quickApply(${inst.id})" class="flex-1 text-center py-2 px-3 text-xs font-semibold rounded-xl bg-[#182b42] text-white hover:bg-[#253d5a] transition">
          Apply Now
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function filterInstitutions(category) {
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.classList.remove('bg-[#182b42]', 'text-white');
    btn.classList.add('text-[#53606e]');
  });
  const activeBtn = document.getElementById(`tab-${category}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-[#53606e]');
    activeBtn.classList.add('bg-[#182b42]', 'text-white');
  }
  loadInstitutions(category);
}

function populateInstitutionDropdown(institutions) {
  const select = document.getElementById('input-admission-inst');
  if (!select) return;
  select.innerHTML = `<option value="">Select JSS School / College Campus</option>` +
    institutions.map(i => `<option value="${i.id}">${i.name} (${i.code})</option>`).join('');
}

// ---------------------------------------------------------------------------
// Notices & Announcements
// ---------------------------------------------------------------------------
async function loadNotices() {
  try {
    const res = await fetch(`/api/notices?lang=${currentLang}`);
    const data = await res.json();
    if (!data.success) return;

    allNotices = data.data;
    const container = document.getElementById('notices-list');
    if (!container) return;

    const getNoticeTag = (cat) => {
      if (cat === 'exam') return 'pastel-tag-rose';
      if (cat === 'sports') return 'pastel-tag-sage';
      if (cat === 'circular') return 'pastel-tag-slate';
      return 'pastel-tag-sand';
    };

    container.innerHTML = allNotices.map(n => `
      <div class="minimal-card p-6 bg-white ${n.is_pinned ? 'border-l-4 border-l-[#9c783e]' : ''}">
        <div class="flex items-center justify-between gap-2 mb-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getNoticeTag(n.category)}">
            ${n.category.toUpperCase()}
          </span>
          <span class="text-xs text-[#8a95a1] font-medium">${n.published_date}</span>
        </div>
        <h4 class="text-base font-serif font-bold text-[#182b42] mb-1.5 leading-snug">${n.display_title}</h4>
        <p class="text-xs text-[#556371] leading-relaxed">${n.display_content}</p>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading notices:', err);
  }
}

// ---------------------------------------------------------------------------
// Online Admissions Form & Tracking
// ---------------------------------------------------------------------------
async function handleAdmissionSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Submitting...';

  const payload = {
    institution_id: parseInt(form.institution_id.value),
    applicant_name: form.applicant_name.value,
    parent_name: form.parent_name.value,
    parent_phone: form.parent_phone.value,
    parent_email: form.parent_email.value,
    applying_for_class: form.applying_for_class.value,
    dob: form.dob.value,
    gender: form.gender.value,
    address: form.address.value,
    previous_school: form.previous_school.value
  };

  try {
    const res = await fetch('/api/admissions/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    // Confetti celebration
    if (window.confetti) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    form.reset();
    showAdmissionSuccessModal(data.applicationNumber, payload.applicant_name);
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit Application';
  }
}

function showAdmissionSuccessModal(appNo, applicantName) {
  const modal = document.getElementById('modal-app-success');
  document.getElementById('success-app-no').textContent = appNo;
  document.getElementById('success-applicant-name').textContent = applicantName;
  modal.classList.remove('hidden');
}

function closeSuccessModal() {
  document.getElementById('modal-app-success').classList.add('hidden');
}

async function handleTrackApplication(e) {
  e.preventDefault();
  const appNo = document.getElementById('input-track-no').value.trim();
  const resultDiv = document.getElementById('track-result');
  if (!appNo) return;

  resultDiv.innerHTML = `<div class="p-4 text-center text-slate-500">Searching records...</div>`;
  resultDiv.classList.remove('hidden');

  try {
    const res = await fetch(`/api/admissions/track/${encodeURIComponent(appNo)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    const app = data.data;
    const statusMap = {
      submitted: { label: 'Application Submitted', color: 'bg-blue-100 text-blue-800' },
      under_review: { label: 'Under Verification', color: 'bg-amber-100 text-amber-800' },
      verified: { label: 'Documents Verified', color: 'bg-indigo-100 text-indigo-800' },
      approved: { label: 'Admission Approved ✅', color: 'bg-emerald-100 text-emerald-800' },
      rejected: { label: 'Application Rejected', color: 'bg-red-100 text-red-800' },
      enrolled: { label: 'Enrolled & Roll Assigned 🎓', color: 'bg-teal-100 text-teal-800' }
    };

    const curStatus = statusMap[app.status] || { label: app.status, color: 'bg-slate-100 text-slate-800' };

    resultDiv.innerHTML = `
      <div class="p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-left">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <span class="text-xs font-mono font-bold text-slate-400">APPLICATION NO.</span>
            <div class="text-lg font-bold text-blue-900">${app.application_no}</div>
          </div>
          <span class="px-3 py-1 text-xs font-bold rounded-full ${curStatus.color}">
            ${curStatus.label}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-4 text-xs text-slate-600 mb-4">
          <div><strong>Candidate:</strong> ${app.applicant_name}</div>
          <div><strong>Grade Applied:</strong> ${app.applying_for_class}</div>
          <div><strong>Institution:</strong> ${app.institution_name}</div>
          <div><strong>Parent/Guardian:</strong> ${app.parent_name} (${app.parent_phone})</div>
        </div>
        <div class="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
          <strong>Official Note:</strong> ${app.notes || 'Application received and queued for review.'}
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `
      <div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
        ❌ ${err.message}
      </div>
    `;
  }
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        phone: form.phone.value,
        subject: form.subject.value,
        message: form.message.value
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    form.reset();
    showToast(data.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

function quickApply(instId) {
  const select = document.getElementById('input-admission-inst');
  if (select) select.value = instId;
  const admissionsSection = document.getElementById('section-admissions');
  if (admissionsSection) admissionsSection.scrollIntoView({ behavior: 'smooth' });
}

async function viewInstitutionDetails(instId) {
  try {
    const res = await fetch(`/api/institutions/${instId}`);
    const data = await res.json();
    if (!data.success) return;

    const inst = data.data;
    const modal = document.getElementById('modal-inst-details');
    document.getElementById('modal-inst-title').textContent = inst.name;
    document.getElementById('modal-inst-content').innerHTML = `
      <div class="space-y-4">
        <img src="${inst.image_url}" class="w-full h-48 object-cover rounded-xl" />
        <div class="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
          <div><strong>Code:</strong> ${inst.code}</div>
          <div><strong>Established:</strong> ${inst.established_year}</div>
          <div><strong>Medium:</strong> ${inst.medium}</div>
          <div><strong>Principal:</strong> ${inst.principal_name}</div>
          <div><strong>Phone:</strong> ${inst.phone}</div>
          <div><strong>Email:</strong> ${inst.email}</div>
          <div class="col-span-2"><strong>Campus Address:</strong> ${inst.address}, ${inst.pincode}</div>
        </div>
        <div>
          <h5 class="text-xs font-bold text-slate-700 uppercase mb-2">Faculty Highlights</h5>
          <div class="space-y-1.5">
            ${inst.faculty.slice(0, 4).map(f => `
              <div class="text-xs p-2 bg-white border border-slate-100 rounded flex justify-between items-center">
                <span><strong>${f.name}</strong> (${f.department})</span>
                <span class="text-slate-400">${f.qualification}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    modal.classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(modalId) {
  document.getElementById(modalId)?.classList.add('hidden');
}

// ---------------------------------------------------------------------------
// Role-Based Dashboards (Superadmin, Teacher, Student, Clerk)
// ---------------------------------------------------------------------------
async function renderDashboardForRole(role) {
  const container = document.getElementById('dashboard-content');
  if (!container) return;

  container.innerHTML = `<div class="p-12 text-center text-slate-400">Loading ${role.toUpperCase()} Workspace...</div>`;

  if (role === 'superadmin') {
    await renderSuperAdminDashboard(container);
  } else if (role === 'teacher') {
    await renderTeacherDashboard(container);
  } else if (role === 'student') {
    await renderStudentDashboard(container);
  } else if (role === 'clerk') {
    await renderClerkDashboard(container);
  } else if (role === 'branch_admin') {
    await renderPrincipalDashboard(container);
  }

  if (window.lucide) lucide.createIcons();
}

// 1. Superadmin Dashboard (Trust Board Level)
async function renderSuperAdminDashboard(container) {
  const [statsRes, admissionsRes, feeRes] = await Promise.all([
    fetch('/api/stats/overview'),
    fetch('/api/admissions', { headers: { Authorization: `Bearer ${currentToken}` } }),
    fetch('/api/fees/summary', { headers: { Authorization: `Bearer ${currentToken}` } })
  ]);

  const stats = (await statsRes.json()).data;
  const admissions = (await admissionsRes.json()).data;
  const fees = (await feeRes.json()).data;

  container.innerHTML = `
    <div class="space-y-8">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Enrolled</div>
          <div class="text-3xl font-extrabold text-blue-900">${stats.totalEnrolledStudents.toLocaleString()}</div>
          <div class="text-xs text-emerald-600 mt-2 font-medium">↑ 8.4% YoY Growth across 18 units</div>
        </div>
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Faculty</div>
          <div class="text-3xl font-extrabold text-slate-900">${stats.totalFaculty}</div>
          <div class="text-xs text-slate-500 mt-2">1:26 Teacher-Student Ratio</div>
        </div>
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fee Collections</div>
          <div class="text-3xl font-extrabold text-emerald-600">₹${(fees.total_collected / 1000).toFixed(1)}k</div>
          <div class="text-xs text-slate-500 mt-2">Outstanding Dues: ₹${(fees.total_outstanding / 1000).toFixed(1)}k</div>
        </div>
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Admissions</div>
          <div class="text-3xl font-extrabold text-amber-600">${admissions.filter(a => a.status === 'submitted').length}</div>
          <div class="text-xs text-amber-700 mt-2 font-medium">Action Required</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h4 class="text-sm font-bold text-slate-800 mb-4">Branch Capacity & Faculty Distribution</h4>
          <div class="h-64">
            <canvas id="branchChartDashboard"></canvas>
          </div>
        </div>
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h4 class="text-sm font-bold text-slate-800 mb-4">Institution Category Breakdown</h4>
          <div class="h-64">
            <canvas id="categoryChartDashboard"></canvas>
          </div>
        </div>
      </div>

      <!-- Admission Inquiries Verification Desk -->
      <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-base font-bold text-slate-900">Recent Online Admission Inquiries</h4>
          <span class="text-xs text-slate-500">${admissions.length} applications logged</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th class="p-3">App No.</th>
                <th class="p-3">Candidate</th>
                <th class="p-3">Parent</th>
                <th class="p-3">Class</th>
                <th class="p-3">Institution</th>
                <th class="p-3">Status</th>
                <th class="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${admissions.slice(0, 6).map(a => `
                <tr class="hover:bg-slate-50/80">
                  <td class="p-3 font-mono font-bold text-blue-900">${a.application_no}</td>
                  <td class="p-3 font-medium text-slate-900">${a.applicant_name}</td>
                  <td class="p-3 text-slate-500">${a.parent_name} (${a.parent_phone})</td>
                  <td class="p-3">${a.applying_for_class}</td>
                  <td class="p-3 text-slate-600">${a.institution_name}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      a.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }">
                      ${a.status.toUpperCase()}
                    </span>
                  </td>
                  <td class="p-3 text-right">
                    ${a.status !== 'approved' ? `
                      <button onclick="updateAdmissionStatus(${a.id}, 'approved')" class="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] hover:bg-emerald-700">
                        Approve
                      </button>
                    ` : '<span class="text-emerald-600 font-medium">Approved</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // Init dashboard charts
  setTimeout(() => {
    const ctxB = document.getElementById('branchChartDashboard');
    if (ctxB) {
      new Chart(ctxB, {
        type: 'bar',
        data: {
          labels: stats.topBranches.map(b => b.code.replace('SVVM-', '').replace('SSVM-', '')),
          datasets: [{ label: 'Students', data: stats.topBranches.map(b => b.total_students), backgroundColor: '#1e3a8a', borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    const ctxC = document.getElementById('categoryChartDashboard');
    if (ctxC) {
      new Chart(ctxC, {
        type: 'doughnut',
        data: {
          labels: stats.categories.map(c => c.category.replace('_', ' ')),
          datasets: [{ data: stats.categories.map(c => c.students), backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }, 100);
}

// 2. Teacher Desk Dashboard
async function renderTeacherDashboard(container) {
  // Fetch Class 10-A student roster
  const res = await fetch('/api/students?class_id=5', {
    headers: { Authorization: `Bearer ${currentToken}` }
  });
  const data = await res.json();
  const students = data.data || [];

  container.innerHTML = `
    <div class="space-y-6">
      <div class="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm flex justify-between items-center">
        <div>
          <span class="text-xs uppercase tracking-wider text-blue-200">Teacher Workspace</span>
          <h3 class="text-xl font-bold">${currentUser.full_name}</h3>
          <p class="text-xs text-blue-100 mt-1">Class Teacher: Class 10-A | Mathematics Dept | Swami Vivekanand Vidyamandir</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-blue-200">Today's Date</div>
          <div class="text-lg font-bold">${new Date().toISOString().split('T')[0]}</div>
        </div>
      </div>

      <!-- Quick Actions: Batch Attendance Marking -->
      <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h4 class="text-base font-bold text-slate-900">Daily Attendance Marking (Class 10-A)</h4>
            <p class="text-xs text-slate-500">Toggle individual student statuses or mark all present with 1-click</p>
          </div>
          <div class="flex gap-2">
            <button onclick="markAllAttendance('present')" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold">
              ✓ Mark All Present
            </button>
            <button onclick="submitBatchAttendance()" class="px-4 py-1.5 bg-blue-900 text-white hover:bg-blue-800 rounded-lg text-xs font-semibold shadow-sm">
              💾 Save Attendance
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="attendance-roster">
          ${students.map(s => `
            <div class="p-3 border border-slate-200 rounded-xl flex items-center justify-between bg-white hover:border-slate-300 transition" id="att-row-${s.id}">
              <div>
                <span class="text-xs font-mono font-bold text-slate-400">#${s.roll_no}</span>
                <span class="text-sm font-semibold text-slate-900 ml-2">${s.full_name}</span>
                <div class="text-[11px] text-slate-400">${s.gr_number}</div>
              </div>
              <div class="flex gap-1">
                <button type="button" onclick="setAttState(${s.id}, 'present')" id="btn-p-${s.id}" class="att-btn px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 text-white">P</button>
                <button type="button" onclick="setAttState(${s.id}, 'absent')" id="btn-a-${s.id}" class="att-btn px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600">A</button>
                <button type="button" onclick="setAttState(${s.id}, 'late')" id="btn-l-${s.id}" class="att-btn px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600">L</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

const attendanceMemory = {};
function setAttState(studentId, state) {
  attendanceMemory[studentId] = state;
  const pBtn = document.getElementById(`btn-p-${studentId}`);
  const aBtn = document.getElementById(`btn-a-${studentId}`);
  const lBtn = document.getElementById(`btn-l-${studentId}`);

  [pBtn, aBtn, lBtn].forEach(b => {
    b.className = 'att-btn px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600';
  });

  if (state === 'present') pBtn.className = 'att-btn px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 text-white';
  else if (state === 'absent') aBtn.className = 'att-btn px-2.5 py-1 text-xs font-bold rounded bg-red-600 text-white';
  else if (state === 'late') lBtn.className = 'att-btn px-2.5 py-1 text-xs font-bold rounded bg-amber-500 text-white';
}

function markAllAttendance(state) {
  document.querySelectorAll('[id^="att-row-"]').forEach(row => {
    const sId = row.id.replace('att-row-', '');
    setAttState(sId, state);
  });
  showToast(`All students marked ${state.toUpperCase()}`, 'info');
}

async function submitBatchAttendance() {
  const records = Object.keys(attendanceMemory).map(sId => ({
    student_id: parseInt(sId),
    status: attendanceMemory[sId]
  }));

  if (records.length === 0) {
    showToast('Please adjust attendance states first', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/attendance/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        class_id: 5,
        date: new Date().toISOString().split('T')[0],
        records
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);
    showToast(data.message, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// 3. Student & Parent Portal
async function renderStudentDashboard(container) {
  const studentId = 1; // Demo student: Aaditya Joshi
  const [reportRes, feeRes] = await Promise.all([
    fetch(`/api/grades/report-card/${studentId}`, { headers: { Authorization: `Bearer ${currentToken}` } }),
    fetch(`/api/fees/student/${studentId}`, { headers: { Authorization: `Bearer ${currentToken}` } })
  ]);

  const report = (await reportRes.json()).data;
  const fees = (await feeRes.json()).data;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Student Profile Card -->
      <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center text-2xl font-bold shadow-md">
            AJ
          </div>
          <div>
            <div class="text-xs font-bold text-amber-600 tracking-wider">STUDENT ID: ${report.student.gr_number}</div>
            <h3 class="text-xl font-bold text-slate-900">${report.student.full_name}</h3>
            <p class="text-xs text-slate-500">${report.student.class_name} (${report.student.section}) | Roll No: ${report.student.roll_no} | ${report.student.institution_name}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center min-w-[90px]">
            <div class="text-xs font-semibold text-emerald-700">Attendance</div>
            <div class="text-lg font-extrabold text-emerald-800">${report.student.attendance_percentage || 95}%</div>
          </div>
          <div class="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center min-w-[90px]">
            <div class="text-xs font-semibold text-blue-700">Overall Grade</div>
            <div class="text-lg font-extrabold text-blue-900">${report.summary.grade}</div>
          </div>
        </div>
      </div>

      <!-- 2 Columns: Report Card & Fees Desk -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Academic Report Card -->
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div>
              <h4 class="text-base font-bold text-slate-900">Academic Marksheet & Grades</h4>
              <p class="text-xs text-slate-500">Mid-Term Examination 2026-27</p>
            </div>
            <span class="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
              RESULT: ${report.summary.status} (${report.summary.percentage}%)
            </span>
          </div>

          <div class="space-y-3">
            ${report.subjects.map(s => `
              <div class="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <div class="text-xs font-bold text-slate-800">${s.subject}</div>
                  <div class="text-[11px] text-slate-400">Max Marks: ${s.max_marks}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-extrabold text-slate-900">${s.marks_obtained} / ${s.max_marks}</div>
                  <span class="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800">
                    Grade ${s.grade}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Fee Ledger & 1-Click Payment -->
        <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h4 class="text-base font-bold text-slate-900">Fee Ledger & Payment Portal</h4>
                <p class="text-xs text-slate-500">Academic Year 2026-2027</p>
              </div>
              <span class="px-2.5 py-1 text-xs font-bold rounded-full ${fees.summary.isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                ${fees.summary.isFullyPaid ? 'ALL DUES SETTLED' : `PENDING: ₹${fees.summary.totalDue}`}
              </span>
            </div>

            <!-- Transaction History -->
            <div class="space-y-3 mb-6">
              ${fees.records.map(f => `
                <div class="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div class="font-bold text-slate-800">${f.fee_type}</div>
                    <div class="text-slate-400 font-mono">${f.receipt_no} • ${f.payment_date}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-extrabold text-slate-900">₹${f.paid_amount}</div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-bold ${f.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                      ${f.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          ${fees.summary.totalDue > 0 ? `
            <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div class="flex justify-between items-center mb-3">
                <span class="text-xs font-bold text-amber-900">Outstanding Balance</span>
                <span class="text-lg font-extrabold text-amber-900">₹${fees.summary.totalDue}</span>
              </div>
              <button onclick="payStudentFee(${studentId}, ${fees.summary.totalDue})" class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-sm transition">
                💳 1-Click Pay Fee via UPI / NetBanking
              </button>
            </div>
          ` : `
            <div class="p-4 bg-emerald-50 text-emerald-800 text-center rounded-xl text-xs font-semibold">
              ✓ All fees for academic year 2026-2027 are cleared. Official receipts downloaded.
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

async function payStudentFee(studentId, amount) {
  try {
    const res = await fetch('/api/fees/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        student_id: studentId,
        fee_type: 'Term 2 Balance Settlement',
        amount: amount,
        payment_method: 'UPI',
        remarks: 'Online Instant Fee Payment via Vidyasphere Portal'
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    if (window.confetti) {
      confetti({ particleCount: 80, spread: 60 });
    }

    showToast(`Payment of ₹${amount} successful! Receipt: ${data.receipt.receiptNo}`, 'success');
    renderStudentDashboard(document.getElementById('dashboard-content'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// 4. Clerk Dashboard (Accounts & Fees Desk)
async function renderClerkDashboard(container) {
  const [feeRes, studentRes] = await Promise.all([
    fetch('/api/fees/summary', { headers: { Authorization: `Bearer ${currentToken}` } }),
    fetch('/api/students', { headers: { Authorization: `Bearer ${currentToken}` } })
  ]);

  const summary = (await feeRes.json()).data;
  const students = (await studentRes.json()).data;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="p-6 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
        <div>
          <span class="text-xs uppercase tracking-wider text-amber-400">Accounts & Fee Collection Desk</span>
          <h3 class="text-xl font-bold">Janata Shikshan Sanstha Central Cashier</h3>
          <p class="text-xs text-slate-400 mt-1">Operator: Sandeep V. Jagdale | Dapodi Campus</p>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-400">Total Collected Today</div>
          <div class="text-2xl font-extrabold text-emerald-400">₹${summary.total_collected.toLocaleString()}</div>
        </div>
      </div>

      <!-- Quick Receipt Generation Form -->
      <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h4 class="text-base font-bold text-slate-900 mb-4">Generate Student Fee Receipt</h4>
        <form onsubmit="handleClerkFeeCollect(event)" class="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Student</label>
            <select name="student_id" required class="w-full p-2.5 border border-slate-200 rounded-lg">
              ${students.map(s => `<option value="${s.id}">#${s.roll_no} ${s.full_name} (${s.class_name})</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Fee Type</label>
            <input type="text" name="fee_type" value="Term Tuition Fee" required class="w-full p-2.5 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
            <input type="number" name="amount" value="5000" required class="w-full p-2.5 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Payment Method</label>
            <select name="payment_method" class="w-full p-2.5 border border-slate-200 rounded-lg">
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Cheque">Cheque</option>
              <option value="NetBanking">NetBanking</option>
            </select>
          </div>
          <div class="md:col-span-4 flex justify-end">
            <button type="submit" class="px-5 py-2.5 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition">
              🧾 Print & Log Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

async function handleClerkFeeCollect(e) {
  e.preventDefault();
  const form = e.target;
  try {
    const res = await fetch('/api/fees/collect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({
        student_id: form.student_id.value,
        fee_type: form.fee_type.value,
        amount: form.amount.value,
        payment_method: form.payment_method.value
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showToast(`Receipt ${data.receipt.receiptNo} generated for ${data.receipt.studentName}!`, 'success');
    renderClerkDashboard(document.getElementById('dashboard-content'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateAdmissionStatus(appId, newStatus) {
  try {
    const res = await fetch(`/api/admissions/${appId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    showToast(data.message, 'success');
    renderSuperAdminDashboard(document.getElementById('dashboard-content'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------------------------------------------------------------------------
// Toast Notification Utility
// ---------------------------------------------------------------------------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-red-600' : 'bg-slate-900');
  toast.className = `${bg} text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transform transition-all duration-300 translate-y-4 opacity-0`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

