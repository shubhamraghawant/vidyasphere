// Chart.js Visualizations for Vidyasphere Multi-Branch Analytics
let categoryChartInstance = null;
let branchChartInstance = null;
let attendanceChartInstance = null;

function renderCategoryChart(categories) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  const labels = categories.map(c => {
    const map = {
      primary_marathi: 'Primary (Marathi)',
      primary_english: 'Primary (English)',
      secondary_marathi: 'Secondary & Jr. College',
      junior_college: 'Junior College',
      senior_college: 'Degree College'
    };
    return map[c.category] || c.category;
  });

  const counts = categories.map(c => c.count);
  const students = categories.map(c => c.students);

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: students,
        backgroundColor: [
          '#f59e0b', // amber
          '#3b82f6', // blue
          '#10b981', // emerald
          '#8b5cf6', // purple
          '#ec4899'  // pink
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { family: 'Poppins', size: 11 }, boxWidth: 12 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return ` ${context.label}: ${context.raw.toLocaleString()} Students`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

function renderBranchComparisonChart(branches) {
  const ctx = document.getElementById('branchChart');
  if (!ctx) return;

  if (branchChartInstance) {
    branchChartInstance.destroy();
  }

  const labels = branches.map(b => b.code.replace('SVVM-', '').replace('SSVM-', ''));
  const students = branches.map(b => b.total_students);
  const faculty = branches.map(b => b.total_faculty * 20); // Scaled for dual-axis visibility

  branchChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Student Enrollment',
          data: students,
          backgroundColor: '#3b82f6',
          borderRadius: 6
        },
        {
          label: 'Faculty Count (×20)',
          data: faculty,
          backgroundColor: '#10b981',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { family: 'Poppins', size: 10 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Poppins', size: 11, weight: '500' } }
        }
      },
      plugins: {
        legend: { position: 'top', labels: { font: { family: 'Poppins', size: 11 } } }
      }
    }
  });
}

function renderAttendanceChart(stats) {
  const ctx = document.getElementById('attendanceChart');
  if (!ctx) return;

  if (attendanceChartInstance) {
    attendanceChartInstance.destroy();
  }

  attendanceChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [{
        data: [stats.present || 85, stats.absent || 10, stats.late || 5],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 11 } } }
      }
    }
  });
}
