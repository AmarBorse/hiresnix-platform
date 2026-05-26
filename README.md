# Hirenix — Unified AI-Powered Career Ecosystem

> **Merged from:** InternFlow AI Internship Platform + Job Placement Portal  
> **Architecture:** One React frontend · One Node.js/Express backend · MySQL

---

## 🏗️ Architecture Overview

```
hirenix/
├── backend/          ← Node.js + Express + MySQL (Sequelize)
│   ├── config/
│   │   └── db.js               ← MySQL connection (Sequelize)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── studentController.js
│   │   ├── companyController.js
│   │   ├── jobController.js
│   │   ├── applicationController.js
│   │   ├── internshipController.js  ← NEW
│   │   ├── resourceController.js    ← NEW
│   │   ├── certificateController.js ← NEW
│   │   ├── analyticsController.js
│   │   └── adminController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Company.js
│   │   ├── Job.js
│   │   ├── Application.js
│   │   ├── Internship.js    ← NEW
│   │   ├── Enrollment.js    ← NEW
│   │   ├── Resource.js      ← NEW
│   │   ├── Certificate.js   ← NEW
│   │   └── index.js         (all associations)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── companyRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── internshipRoutes.js  ← NEW
│   │   ├── resourceRoutes.js    ← NEW
│   │   ├── certificateRoutes.js ← NEW
│   │   ├── analyticsRoutes.js
│   │   └── adminRoutes.js
│   ├── middleware/
│   │   ├── auth.js      ← protect + authorize(role)
│   │   └── upload.js    ← Multer resume upload
│   ├── utils/
│   │   └── seeder.js
│   ├── uploads/resumes/
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/         ← React 19 + TypeScript + Vite + Tailwind v4
    └── src/
        ├── api/
        │   ├── client.ts     ← Axios instance + interceptors
        │   ├── auth.ts
        │   ├── jobs.ts
        │   ├── applications.ts
        │   ├── internships.ts
        │   ├── resources.ts
        │   ├── analytics.ts
        │   ├── company.ts
        │   ├── admin.ts
        │   └── student.ts
        ├── store/
        │   └── useAuthStore.ts   ← Zustand + persist
        ├── types/
        │   └── index.ts          ← All TypeScript interfaces
        ├── hooks/
        │   └── useFetch.ts       ← Generic data fetching hook
        ├── components/
        │   ├── layout/
        │   │   ├── StudentLayout.tsx
        │   │   ├── CompanyLayout.tsx
        │   │   └── AdminLayout.tsx
        │   └── common/
        │       ├── ProtectedRoute.tsx
        │       └── LoadingState.tsx
        └── pages/
            ├── auth/AuthPage.tsx
            ├── student/
            │   ├── StudentDashboard.tsx
            │   ├── StudentJobs.tsx
            │   ├── StudentApplications.tsx
            │   ├── StudentInternships.tsx
            │   ├── StudentResources.tsx
            │   ├── StudentCertificates.tsx
            │   ├── StudentProfile.tsx
            │   └── StudentMockInterview.tsx
            ├── company/
            │   ├── CompanyDashboard.tsx
            │   ├── CompanyJobs.tsx
            │   ├── JobForm.tsx
            │   ├── CompanyApplicants.tsx
            │   └── CompanyProfile.tsx
            └── admin/
                ├── AdminDashboard.tsx
                ├── AdminStudents.tsx
                ├── AdminCompanies.tsx
                ├── AdminJobs.tsx
                ├── AdminApplications.tsx
                ├── AdminInternships.tsx
                ├── AdminResources.tsx
                ├── AdminCertificates.tsx
                ├── AdminAnalytics.tsx
                └── AdminSettings.tsx
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MySQL 8.x running locally
- npm or yarn

---

### 1. Database Setup

```bash
mysql -u root -p
CREATE DATABASE hirenix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit
```

---

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure .env
cp .env.example .env
# Edit .env — set DB_USER, DB_PASS, JWT_SECRET

# Sync DB tables + seed sample data
npm run seed

# Start backend (dev)
npm run dev
# → API running on http://localhost:5000
```

**Backend `.env` values:**
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=hirenix_db
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy env
cp .env.example .env
# .env already has: VITE_API_URL=http://localhost:5000/api

# Start dev server
npm run dev
# → App running on http://localhost:5173
```

---

## 🔑 Seeded Credentials

| Role    | Email                         | Password     |
|---------|-------------------------------|--------------|
| Admin   | admin@pcu.edu                 | Admin@123    |
| Company | hr@techcorpsolutions.com      | Company@123  |
| Student | student1@pcu.edu              | Student@123  |

---

## 🗺️ Routes

### Student Routes
| Path                        | Description             |
|-----------------------------|-------------------------|
| `/student/dashboard`        | Dashboard + stats       |
| `/student/internships`      | Browse & enroll         |
| `/student/jobs`             | Browse & apply          |
| `/student/applications`     | Track applications      |
| `/student/resources`        | Learning hub            |
| `/student/mock-interview`   | AI mock interview       |
| `/student/certificates`     | Earned certificates     |
| `/student/profile`          | Profile + resume upload |

### Company Routes
| Path                        | Description          |
|-----------------------------|----------------------|
| `/company/dashboard`        | Overview             |
| `/company/jobs`             | Manage postings      |
| `/company/jobs/create`      | Post new job         |
| `/company/jobs/edit/:id`    | Edit existing job    |
| `/company/applicants`       | Review candidates    |
| `/company/profile`          | Company details      |

### Admin Routes
| Path                        | Description              |
|-----------------------------|--------------------------|
| `/admin/dashboard`          | Platform overview        |
| `/admin/students`           | All students             |
| `/admin/companies`          | Verify companies         |
| `/admin/jobs`               | Approve/reject jobs      |
| `/admin/applications`       | All applications         |
| `/admin/internships`        | CRUD internship programs |
| `/admin/resources`          | Manage learning content  |
| `/admin/certificates`       | View issued certs        |
| `/admin/analytics`          | Live platform analytics  |
| `/admin/settings`           | Admin account settings   |

---

## 📡 Key API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
PUT  /api/auth/updatepassword
```

### Jobs
```
GET    /api/jobs              → list (student: approved only)
POST   /api/jobs              → company creates
GET    /api/jobs/my-postings  → company's jobs
PUT    /api/jobs/:id          → company edits / admin approves
DELETE /api/jobs/:id
```

### Applications
```
POST /api/applications/:jobId       → student applies
GET  /api/applications/my           → student's apps
GET  /api/applications/job/:jobId   → company views applicants
PUT  /api/applications/:id/status   → company updates status
PUT  /api/applications/:id/withdraw → student withdraws
```

### Internships
```
GET    /api/internships              → list
GET    /api/internships/my           → student's enrollments
POST   /api/internships/:id/enroll   → student enrolls
POST   /api/internships/:enrollId/task-log → submit task
POST   /api/internships              → admin creates
PUT    /api/internships/:id          → admin updates
DELETE /api/internships/:id          → admin deletes
```

### Certificates
```
GET /api/certificates/my            → student's certs
GET /api/certificates/verify/:id    → public verify
GET /api/certificates               → admin: all certs
```

### Analytics (Admin)
```
GET /api/admin/analytics
GET /api/analytics/cgpa-placement
GET /api/analytics/skill-demand
GET /api/analytics/department-stats
GET /api/analytics/salary-distribution
```

---

## 🔒 Security

- **Passwords** — bcrypt hashed (cost 10)
- **JWT** — Bearer token, 7 day expiry
- **Role middleware** — `protect` → `authorize('student'|'company'|'admin')`
- **Rate limiting** — 300 req / 10 min
- **Helmet** — HTTP security headers
- **CORS** — Restricted to `CLIENT_URL`
- **File uploads** — PDF/DOC only, 5MB max, stored server-side

---

## 🤖 AI Features

- **Mock Interview** — Streams questions from Claude AI (`claude-sonnet-4-20250514`), gives real-time feedback per answer, domain-selectable
- **Internship → Job Recommendations** — `relatedJobDomains` field links internship domains to matching job searches

---

## 🗄️ Data Models

| Model        | Key Fields                                                                |
|--------------|---------------------------------------------------------------------------|
| User         | name, email, password (bcrypt), role, isApproved                         |
| Student      | userId, cgpa, skills[], department, year, resumeUrl, placementStatus      |
| Company      | userId, companyName, industry, website, isVerified                        |
| Job          | title, type, location, salaryMin/Max, requiredSkills[], status, companyId |
| Application  | studentId, jobId, status, coverLetter, interviewAt, meetingLink           |
| Internship   | title, domain, difficulty, tasks[], technologies[], status, maxEnrollments |
| Enrollment   | studentId, internshipId, progress, completedTasks[], taskLogs[], status   |
| Resource     | title, type, link, domain, category, badge                                |
| Certificate  | certificateId (UUID), studentId, enrollmentId, internshipTitle, issuedAt  |

---

## 📦 Tech Stack

| Layer     | Technology                                            |
|-----------|-------------------------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind v4, Zustand, Axios, React Router v7, Sonner |
| Backend   | Node.js, Express 4, Sequelize 6, MySQL 8             |
| Auth      | JWT (jsonwebtoken), bcryptjs                         |
| Uploads   | Multer (local disk, /uploads/resumes)                |
| AI        | Anthropic Claude API (mock interview)                |

---

## 🧪 Adding New Features

1. **New model** → `backend/models/NewModel.js` → register in `models/index.js`
2. **New API route** → controller → route file → register in `server.js`
3. **New page** → `frontend/src/pages/{role}/NewPage.tsx` → add to `App.tsx` route
4. **New API call** → add to `frontend/src/api/{domain}.ts`
