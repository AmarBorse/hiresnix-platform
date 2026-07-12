-- ============================================================
--  HIRESNIX AI ACADEMY — Phase 1 Database Migration
--  Run this in Supabase SQL Editor (in order)
--  All tables link to auth.users (existing Supabase Auth)
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────

CREATE TYPE lesson_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE assignment_status AS ENUM ('submitted', 'under_review', 'reviewed');
CREATE TYPE chat_mode AS ENUM ('teach', 'mentor', 'trace');
CREATE TYPE chat_role AS ENUM ('user', 'assistant');

-- ─── COURSES ─────────────────────────────────────────────────

CREATE TABLE courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── MODULES ─────────────────────────────────────────────────

CREATE TABLE modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_modules_course_id ON modules(course_id);

-- ─── LESSONS ─────────────────────────────────────────────────

CREATE TABLE lessons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  objective        TEXT,
  key_concepts     JSONB DEFAULT '[]'::jsonb,
  code_demo        JSONB DEFAULT '{}'::jsonb,
  generated_notes  TEXT,
  order_index      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_lessons_module_id ON lessons(module_id);

-- ─── LESSON PROGRESS ─────────────────────────────────────────

CREATE TABLE lesson_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status       lesson_status NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user_id    ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id  ON lesson_progress(lesson_id);

-- ─── QUIZ ATTEMPTS ───────────────────────────────────────────

CREATE TABLE quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  answers      JSONB NOT NULL DEFAULT '[]'::jsonb,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quiz_attempts_user_id   ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_lesson_id ON quiz_attempts(lesson_id);

-- ─── ASSIGNMENTS ─────────────────────────────────────────────

CREATE TABLE assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id        UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  submission_text  TEXT,
  status           assignment_status NOT NULL DEFAULT 'submitted',
  reviewed_at      TIMESTAMPTZ
);

CREATE INDEX idx_assignments_user_id   ON assignments(user_id);
CREATE INDEX idx_assignments_lesson_id ON assignments(lesson_id);

-- ─── CHAT HISTORY ────────────────────────────────────────────

CREATE TABLE chat_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id  UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  role       chat_role NOT NULL,
  message    TEXT NOT NULL,
  mode       chat_mode NOT NULL DEFAULT 'teach',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_history_user_id   ON chat_history(user_id);
CREATE INDEX idx_chat_history_lesson_id ON chat_history(lesson_id);

-- ─── CODE SESSIONS ───────────────────────────────────────────

CREATE TABLE code_sessions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  language  TEXT NOT NULL DEFAULT 'python',
  code      TEXT NOT NULL DEFAULT '',
  output    TEXT,
  saved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_code_sessions_user_id   ON code_sessions(user_id);
CREATE INDEX idx_code_sessions_lesson_id ON code_sessions(lesson_id);

-- ─── CERTIFICATES ────────────────────────────────────────────

CREATE TABLE certificates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id   UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verify_hash TEXT NOT NULL UNIQUE,
  pdf_url     TEXT,
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_certificates_user_id   ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_hash      ON certificates(verify_hash);

-- ============================================================
--  ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates    ENABLE ROW LEVEL SECURITY;

-- ─── COURSES — public can read published, admin manages ───────

CREATE POLICY "courses_public_read"
  ON courses FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "courses_admin_all"
  ON courses FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ─── MODULES — readable if parent course is published ─────────

CREATE POLICY "modules_public_read"
  ON modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
        AND courses.is_published = TRUE
    )
  );

CREATE POLICY "modules_admin_all"
  ON modules FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ─── LESSONS — readable if parent module's course is published ─

CREATE POLICY "lessons_public_read"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
        AND courses.is_published = TRUE
    )
  );

CREATE POLICY "lessons_admin_all"
  ON lessons FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ─── LESSON PROGRESS — own rows only ─────────────────────────

CREATE POLICY "lesson_progress_own_read"
  ON lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "lesson_progress_own_insert"
  ON lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lesson_progress_own_update"
  ON lesson_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── QUIZ ATTEMPTS — own rows only ───────────────────────────

CREATE POLICY "quiz_attempts_own_read"
  ON quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "quiz_attempts_own_insert"
  ON quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── ASSIGNMENTS — own rows only ─────────────────────────────

CREATE POLICY "assignments_own_read"
  ON assignments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "assignments_own_insert"
  ON assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assignments_own_update"
  ON assignments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'submitted')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assignments_admin_read"
  ON assignments FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "assignments_admin_update"
  ON assignments FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ─── CHAT HISTORY — own rows only ────────────────────────────

CREATE POLICY "chat_history_own_read"
  ON chat_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_history_own_insert"
  ON chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── CODE SESSIONS — own rows only ───────────────────────────

CREATE POLICY "code_sessions_own_read"
  ON code_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "code_sessions_own_insert"
  ON code_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "code_sessions_own_update"
  ON code_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── CERTIFICATES — own rows + public verify ─────────────────

CREATE POLICY "certificates_own_read"
  ON certificates FOR SELECT
  USING (auth.uid() = user_id);

-- Public read by verify_hash (for /verify/:hash page — no auth)
CREATE POLICY "certificates_public_verify"
  ON certificates FOR SELECT
  USING (TRUE);  -- RLS check at app layer via verify_hash match

CREATE POLICY "certificates_system_insert"
  ON certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
--  SAMPLE SEED DATA (optional — remove before production)
-- ============================================================

INSERT INTO courses (title, description, is_published) VALUES
  ('Python for Beginners', 'Learn Python from scratch with AI tutor', TRUE),
  ('Web Development Basics', 'HTML, CSS, JS fundamentals', FALSE);

-- ============================================================
--  DONE — Schema ready. Run Phase 2 next.
-- ============================================================
