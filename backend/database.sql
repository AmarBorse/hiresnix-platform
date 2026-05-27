-- ============================================================
-- Hirenix Unified Platform — Supabase Schema
-- Run this once in: Supabase Dashboard → SQL Editor
-- ============================================================
-- After running this, Sequelize's sync({ alter: true }) will
-- keep the schema in sync automatically on server start.
-- ============================================================

-- The tables below match every Sequelize model exactly —
-- same camelCase column names, same types, same constraints.
-- No changes needed in any model file.

-- ── USERS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           BIGSERIAL    PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(20)  NOT NULL DEFAULT 'student' CHECK (role IN ('student','company','admin')),
  "isActive"   BOOLEAN      NOT NULL DEFAULT TRUE,
  "isApproved" BOOLEAN      NOT NULL DEFAULT FALSE,
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── STUDENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id                      BIGSERIAL    PRIMARY KEY,
  "userId"                BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "rollNumber"            VARCHAR(50)  UNIQUE,
  department              VARCHAR(50)  CHECK (department IN ('Computer Science','Information Technology','Electronics','Mechanical','Civil','MCA','MBA','Other')),
  year                    SMALLINT     CHECK (year BETWEEN 1 AND 5),
  cgpa                    NUMERIC(4,2) CHECK (cgpa BETWEEN 0 AND 10),
  skills                  JSONB        NOT NULL DEFAULT '[]',
  "resumeFilename"        VARCHAR(255),
  "resumeUrl"             VARCHAR(500),
  "resumeUploadedAt"      TIMESTAMPTZ,
  "resumeExtractedSkills" JSONB        NOT NULL DEFAULT '[]',
  "resumeAnalysisScore"   FLOAT        NOT NULL DEFAULT 0,
  projects                JSONB        NOT NULL DEFAULT '[]',
  certifications          JSONB        NOT NULL DEFAULT '[]',
  education               JSONB        NOT NULL DEFAULT '[]',
  linkedin                VARCHAR(300),
  github                  VARCHAR(300),
  portfolio               VARCHAR(300),
  "isProfileComplete"     BOOLEAN      NOT NULL DEFAULT FALSE,
  "placementStatus"       VARCHAR(20)  NOT NULL DEFAULT 'Not Placed' CHECK ("placementStatus" IN ('Not Placed','Placed','Opted Out')),
  "placedCompany"         VARCHAR(200),
  "placedRole"            VARCHAR(200),
  "placedSalary"          BIGINT,
  "placedOn"              TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── COMPANIES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id                   BIGSERIAL    PRIMARY KEY,
  "userId"             BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "companyName"        VARCHAR(200) NOT NULL,
  industry             VARCHAR(50)  CHECK (industry IN ('IT/Software','Finance','Healthcare','E-commerce','Manufacturing','Consulting','Media','Education','Other')),
  website              VARCHAR(300),
  description          TEXT,
  logo                 VARCHAR(500),
  headquarters         VARCHAR(200),
  "employeeCount"      VARCHAR(20)  CHECK ("employeeCount" IN ('1-10','11-50','51-200','201-500','500+')),
  "contactName"        VARCHAR(100),
  "contactDesignation" VARCHAR(100),
  "contactPhone"       VARCHAR(20),
  "isVerified"         BOOLEAN      NOT NULL DEFAULT FALSE,
  "createdAt"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── JOBS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id                    BIGSERIAL    PRIMARY KEY,
  "companyId"           BIGINT       NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  "postedById"          BIGINT       NOT NULL REFERENCES users(id),
  title                 VARCHAR(200) NOT NULL,
  type                  VARCHAR(20)  NOT NULL CHECK (type IN ('Full-time','Part-time','Internship','Contract')),
  description           TEXT         NOT NULL,
  responsibilities      JSONB        NOT NULL DEFAULT '[]',
  "requiredSkills"      JSONB        NOT NULL DEFAULT '[]',
  "preferredSkills"     JSONB        NOT NULL DEFAULT '[]',
  "minCGPA"             NUMERIC(4,2) NOT NULL DEFAULT 0,
  "allowedDepartments"  JSONB        NOT NULL DEFAULT '[]',
  "allowedYears"        JSONB        NOT NULL DEFAULT '[]',
  "backlogsAllowed"     BOOLEAN      NOT NULL DEFAULT FALSE,
  "salaryMin"           BIGINT,
  "salaryMax"           BIGINT,
  "salaryCurrency"      VARCHAR(10)  NOT NULL DEFAULT 'INR',
  "salaryPeriod"        VARCHAR(20)  NOT NULL DEFAULT 'Annual' CHECK ("salaryPeriod" IN ('Monthly','Annual','Stipend')),
  location              VARCHAR(200),
  "isRemote"            BOOLEAN      NOT NULL DEFAULT FALSE,
  "applicationDeadline" TIMESTAMPTZ  NOT NULL,
  status                VARCHAR(20)  NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Closed','Expired')),
  openings              INTEGER      NOT NULL DEFAULT 1,
  "applicationCount"    INTEGER      NOT NULL DEFAULT 0,
  "rejectionReason"     TEXT,
  "createdAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status   ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company  ON jobs("companyId");
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs("applicationDeadline");

-- ── APPLICATIONS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                 BIGSERIAL    PRIMARY KEY,
  "jobId"            BIGINT       NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  "studentId"        BIGINT       NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "appliedById"      BIGINT       NOT NULL REFERENCES users(id),
  status             VARCHAR(30)  NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied','Under Review','Shortlisted','Interview Scheduled','Selected','Rejected','Withdrawn')),
  "statusHistory"    JSONB        NOT NULL DEFAULT '[]',
  "coverLetter"      TEXT,
  "resumeFilename"   VARCHAR(255),
  "resumeUrl"        VARCHAR(500),
  "matchScore"       FLOAT,
  "interviewAt"      TIMESTAMPTZ,
  "interviewMode"    VARCHAR(10)  CHECK ("interviewMode" IN ('Online','Offline','Phone')),
  "interviewLocation" VARCHAR(300),
  "meetingLink"      VARCHAR(500),
  "interviewNotes"   TEXT,
  "companyNotes"     TEXT,
  "isEligible"       BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE ("jobId", "studentId")
);

CREATE INDEX IF NOT EXISTS idx_applications_student ON applications("studentId");
CREATE INDEX IF NOT EXISTS idx_applications_status  ON applications(status);

-- ── INTERNSHIPS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS internships (
  id                  BIGSERIAL    PRIMARY KEY,
  title               VARCHAR(150) NOT NULL,
  description         TEXT,
  domain              VARCHAR(100),
  duration            VARCHAR(50),
  difficulty          VARCHAR(20)  NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner','Intermediate','Advanced')),
  technologies        JSONB        NOT NULL DEFAULT '[]',
  tasks               JSONB        NOT NULL DEFAULT '[]',
  status              VARCHAR(20)  NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive')),
  "createdById"       BIGINT       NOT NULL REFERENCES users(id),
  "maxEnrollments"    INTEGER      NOT NULL DEFAULT 100,
  "enrollmentCount"   INTEGER      NOT NULL DEFAULT 0,
  "startDate"         DATE,
  "endDate"           DATE,
  "relatedJobDomains" JSONB        NOT NULL DEFAULT '[]',
  "createdAt"         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── ENROLLMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id               BIGSERIAL    PRIMARY KEY,
  "studentId"      BIGINT       NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "internshipId"   BIGINT       NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
  progress         SMALLINT     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  "completedTasks" JSONB        NOT NULL DEFAULT '[]',
  status           VARCHAR(20)  NOT NULL DEFAULT 'Enrolled' CHECK (status IN ('Enrolled','In Progress','Completed','Dropped')),
  "completedAt"    TIMESTAMPTZ,
  "taskLogs"       JSONB        NOT NULL DEFAULT '[]',
  "createdAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE ("studentId", "internshipId")
);

-- ── RESOURCES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resources (
  id             BIGSERIAL    PRIMARY KEY,
  title          VARCHAR(200) NOT NULL,
  type           VARCHAR(20)  NOT NULL DEFAULT 'Video' CHECK (type IN ('Video','Note','Article','PDF')),
  link           VARCHAR(500),
  domain         VARCHAR(100),
  category       VARCHAR(100),
  badge          VARCHAR(50),
  "isPublic"     BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdById"  BIGINT       REFERENCES users(id),
  "createdAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── CERTIFICATES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id                BIGSERIAL    PRIMARY KEY,
  "certificateId"   VARCHAR(50)  NOT NULL UNIQUE DEFAULT ('CERT-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8))),
  "studentId"       BIGINT       NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "enrollmentId"    BIGINT       REFERENCES enrollments(id),
  "internshipTitle" VARCHAR(200),
  "studentName"     VARCHAR(100),
  domain            VARCHAR(100),
  "issuedAt"        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "isValid"         BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── ENQUIRIES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id           BIGSERIAL    PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  email        VARCHAR(150) NOT NULL,
  phone        VARCHAR(20),
  interest     VARCHAR(50),
  message      TEXT         NOT NULL,
  "isRead"     BOOLEAN      NOT NULL DEFAULT FALSE,
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enquiries_read ON enquiries("isRead");
