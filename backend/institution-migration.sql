-- ============================================================
-- Institution Module SQL Migration
-- Run this after initial DB setup to add institution tables
-- ============================================================

-- institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id              BIGSERIAL PRIMARY KEY,
  "userId"        BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "institutionName" VARCHAR(200) NOT NULL,
  type            VARCHAR(50),
  "affiliatedTo"  VARCHAR(200),
  address         TEXT,
  city            VARCHAR(100),
  state           VARCHAR(100),
  pincode         VARCHAR(10),
  website         VARCHAR(300),
  phone           VARCHAR(20),
  logo            VARCHAR(500),
  description     TEXT,
  "contactName"   VARCHAR(100),
  "contactEmail"  VARCHAR(150),
  "contactPhone"  VARCHAR(20),
  "isVerified"    BOOLEAN DEFAULT FALSE,
  "isPartner"     BOOLEAN DEFAULT FALSE,
  "rejectionReason" TEXT,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- institution_students table
CREATE TABLE IF NOT EXISTS institution_students (
  id              BIGSERIAL PRIMARY KEY,
  "institutionId" BIGINT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  "careerId"      VARCHAR(20) UNIQUE,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  mobile          VARCHAR(20),
  dob             DATE,
  gender          VARCHAR(10),
  address         TEXT,
  department      VARCHAR(100),
  "rollNumber"    VARCHAR(50),
  year            INTEGER,
  skills          JSONB DEFAULT '[]',
  documents       JSONB DEFAULT '[]',
  photo           VARCHAR(500),
  "isInternshipEligible" BOOLEAN DEFAULT FALSE,
  "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_institution_students_institution ON institution_students("institutionId");
CREATE INDEX IF NOT EXISTS idx_institution_students_email ON institution_students(email);

-- batches table
CREATE TABLE IF NOT EXISTS batches (
  id              BIGSERIAL PRIMARY KEY,
  "institutionId" BIGINT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  description     TEXT,
  "startDate"     DATE,
  "endDate"       DATE,
  "trainerName"   VARCHAR(100),
  "trainerEmail"  VARCHAR(150),
  status          VARCHAR(20) DEFAULT 'Active',
  "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- batch_students junction
CREATE TABLE IF NOT EXISTS batch_students (
  id          BIGSERIAL PRIMARY KEY,
  "batchId"   BIGINT NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  "studentId" BIGINT NOT NULL REFERENCES institution_students(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("batchId", "studentId")
);

-- courses table
CREATE TABLE IF NOT EXISTS courses (
  id              BIGSERIAL PRIMARY KEY,
  "institutionId" BIGINT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  duration        VARCHAR(50),
  "durationUnit"  VARCHAR(20) DEFAULT 'Weeks',
  status          VARCHAR(20) DEFAULT 'Active',
  "createdAt"     TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ DEFAULT NOW()
);

-- course_students junction
CREATE TABLE IF NOT EXISTS course_students (
  id            BIGSERIAL PRIMARY KEY,
  "courseId"    BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  "studentId"   BIGINT NOT NULL REFERENCES institution_students(id) ON DELETE CASCADE,
  "enrolledAt"  TIMESTAMPTZ DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  status        VARCHAR(20) DEFAULT 'Enrolled',
  "createdAt"   TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("courseId", "studentId")
);

-- institution_certificates table
CREATE TABLE IF NOT EXISTS institution_certificates (
  id                BIGSERIAL PRIMARY KEY,
  "certificateId"   VARCHAR(50) UNIQUE NOT NULL,
  "institutionId"   BIGINT NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  "studentId"       BIGINT NOT NULL REFERENCES institution_students(id) ON DELETE CASCADE,
  "courseId"        BIGINT REFERENCES courses(id),
  type              VARCHAR(50) NOT NULL,
  "studentName"     VARCHAR(100) NOT NULL,
  "courseName"      VARCHAR(200),
  "institutionName" VARCHAR(200) NOT NULL,
  "issuedAt"        TIMESTAMPTZ DEFAULT NOW(),
  "isValid"         BOOLEAN DEFAULT TRUE,
  "emailSent"       BOOLEAN DEFAULT FALSE,
  "createdAt"       TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ DEFAULT NOW()
);

-- Also update users.role check constraint to include institution
-- (Skip if using Sequelize STRING with validate – no DB-level constraint needed)

-- Done!
SELECT 'Institution migration complete' AS status;
