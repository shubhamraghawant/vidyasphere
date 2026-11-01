# 🏛️ Vidyasphere — School & Sanstha Management System

> **Enterprise-grade, multi-branch School Management System & Public Portal**  
> Tailored and modeled after **Janata Shikshan Sanstha, Pune** ([jsspune.in](https://jsspune.in/)), established in 1952.

[![Node.js Version](https://img.shields.io/badge/Node.js-26.x%20%2F%2022.x-339933?logo=node.js)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/Express-5.x-000000?logo=express)](https://expressjs.com/)
[![SQLite Database](https://img.shields.io/badge/SQLite-WAL%20Storage-003B57?logo=sqlite)](https://sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x%20Responsive-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-13%2F13%20Passing-brightgreen)](tests/api.test.js)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents
1. [Overview & Reference Foundation](#-overview--reference-foundation)
2. [Key Modules & Capabilities](#-key-modules--capabilities)
3. [Technology Stack](#-technology-stack)
4. [Architecture & Database Schema](#-architecture--database-schema)
5. [Demo Portals & Credentials](#-demo-portals--credentials)
6. [Quickstart Guide](#-quickstart-guide)
7. [API Reference](#-api-reference)
8. [Automated Testing](#-automated-testing)
9. [Docker Deployment](#-docker-deployment)

---

## 🏛️ Overview & Reference Foundation

**Vidyasphere** is a complete, production-ready educational ERP and community portal created for large multi-institution educational trusts (*Shikshan Sansthas*). 

Taking direct architectural and functional reference from **Janata Shikshan Sanstha, Pune (`https://jsspune.in/`)**, Vidyasphere models the real branches, leadership, schools, and junior/senior colleges across Pune, Dapodi, Chakan, Aundh, Hinjawadi, Sangavi, and Jejuri:
- **Heritage & Visionaries**: Honors founders *Baburao Ganpatrao Jagtap*, *Jaywantrao (Dadasaheb) Jagtap*, and *Jayantibai (Maisaheb) Jagtap*.
- **Bilingual Interface**: Full, seamless toggle between **English** and **मराठी (Marathi)**.
- **Institutional Multi-Branch Hierarchy**: Powers primary Marathi schools, English medium institutions, secondary schools, and degree colleges under a single unified database.

---

## ⚡ Key Modules & Capabilities

### 1. 🌐 Public Institutional Portal
- **Hero & Heritage**: Live multi-branch student counters (12,500+ students, 480+ faculty, 18 branches).
- **Institutions Directory**: Interactive filter by category (*Primary Marathi, English Medium, Secondary & Junior College, Senior Degree College*) with campus profiles, principal contacts, student capacity, and facilities.
- **Online Admissions 2026-27**: Complete applicant form with automatic generation of official tracking reference codes (e.g. `JSS-2026-XXXX`).
- **Live Application Tracker**: Enter reference code to see real-time progress across 6 lifecycle stages: `Submitted` → `Under Review` → `Verified` → `Approved` → `Enrolled`.
- **Notices & Circulars**: Categorized announcements (*Academic, Examination, Sports, Government Scholarships*).
- **Public Grievance & Contact Desk**: Integrated message pipeline directly to central trust administration.

### 2. 🏛️ Superadmin (Sanstha Trust Board)
- Multi-branch KPIs, enrollment analytics, and faculty distribution.
- Real-time Chart.js visual comparisons across campuses.
- Admission application approval desk with one-click decision workflows.
- Central fee collection ledger and financial reconciliation.

### 3. 👨‍🏫 Teacher Desk
- Class 10-A student roster management.
- **Daily Attendance Marking**: Batch roster with 1-click "Mark All Present" toggle or individual Present/Absent/Late controls.
- Marks and gradebook entry with automated GPA and percentage calculations.

### 4. 🎓 Student & Parent Portal
- Student profile (GR Number, Roll Number, Class, Branch).
- **Academic Marksheet & Report Card**: Mid-Term & Final examination scores, subject breakdown, and result status.
- **Fee Ledger & 1-Click Pay**: View total billed vs. paid, with instant simulated UPI / NetBanking fee payment and downloadable digital receipts.

### 5. 💳 Fee Clerk & Cashier Desk
- Student ledger lookup by roll number or name.
- Instant official receipt generator (`RCPT-2026-XXXX`) with audit logging across Cash, UPI, Cheque, and NetBanking.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Node.js (v26+ / v22+ LTS), Express.js (v5.x), CORS, Morgan |
| **Database** | SQLite3 with WAL mode, foreign key constraints, connection pooling |
| **Security & Auth** | JSON Web Tokens (JWT), bcryptjs password hashing, RBAC middleware |
| **Frontend UI** | Responsive HTML5, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Data Visualization**| Chart.js (Doughnut category distribution & multi-axis branch comparison) |
| **Localization** | Dynamic English / Marathi (`i18n.js`) language switcher |
| **DevOps & Testing** | Docker, Docker Compose, Node Native Test Runner (`node:test`), Supertest |

---

## 🗄️ Architecture & Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                   VIDYASPHERE SANSTHA ERP                   │
├──────────────────────────────┬──────────────────────────────┤
│       Public Portal          │       Role-Based Portals     │
│  - Multi-Branch Directory    │  - Super Admin Dashboard     │
│  - Admissions Desk & Tracker │  - Branch Principal Desk     │
│  - Bilingual Notices & News  │  - Teacher Attendance Roster │
│  - Contact & Grievance Desk  │  - Student Report & Fee Pay  │
└──────────────┬───────────────┴──────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 RESTful API (Express 5.x)                   │
│   /api/auth   /api/institutions   /api/students  /api/fees  │
│   /api/grades /api/admissions     /api/notices   /api/stats │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 SQLite Relational Database                  │
│  [institutions] ──< [classes] ──< [students] ──< [grades]   │
│        │                   │            │                   │
│        └──< [teachers]     └──< [fees]  └──< [attendance]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Demo Portals & Credentials

The application features a **Floating Quick Role Demo Bar** at the bottom of the screen to test any persona with a single click:

| Role | Username | Password | Persona & Scope |
|---|---|---|---|
| **Super Admin** | `admin` | `Password@123` | Sanstha President / Central Trust Director |
| **Principal** | `principal` | `Password@123` | Headmaster, Swami Vivekanand Vidyamandir |
| **Teacher** | `teacher` | `Password@123` | Senior Mathematics Educator & 10-A Incharge |
| **Student** | `student` | `Password@123` | Aaditya Rajesh Joshi (Class 10-A, Roll #12) |
| **Fee Clerk** | `clerk` | `Password@123` | Accounts & Cashier Desk, Dapodi Campus |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js (v20+ or v26+) and npm

### 2. Installation & Run
```bash
# Clone the repository
git clone https://github.com/shubhamraghawant/vidyasphere.git
cd vidyasphere

# Install dependencies
npm install

# Seed database with authentic JSS Pune branches and records
npm run seed

# Start server
npm start
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🧪 Automated Testing

Vidyasphere includes an end-to-end integration test suite verifying health, authentication, multi-branch queries, admission tracking, fee payment, and report cards:

```bash
npm test
```

**Result:**
```
✔ GET /api/health returns healthy status
✔ GET /api/institutions returns JSS Pune branches
✔ GET /api/institutions with category filter works
✔ GET /api/notices returns bilingual notices
✔ GET /api/stats/overview returns multi-branch KPI data
✔ POST /api/admissions/apply creates new application with tracking code
✔ POST /api/auth/demo-login authenticates superadmin, teacher, and student
✔ POST /api/auth/login works with seeded credentials
✔ GET /api/students returns student roster with fee and attendance stats
✔ GET /api/grades/report-card/1 returns comprehensive academic marksheet
✔ POST /api/fees/collect processes fee payment and generates receipt
✔ POST /api/contact submits public message
ℹ tests 13 | pass 13 | fail 0 (100% passing)
```

---

## 🐳 Docker Deployment

Run the complete multi-branch system in an isolated container:

```bash
# Build and run with Docker Compose
docker-compose up -d --build

# View container logs
docker-compose logs -f
```

Accessible at `http://localhost:3000`.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE) — created by **Shubham Raghawant**.
