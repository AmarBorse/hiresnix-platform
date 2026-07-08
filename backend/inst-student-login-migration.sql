-- ============================================================
-- Institution Student Login Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- Add password and lastLogin columns to institution_students
ALTER TABLE institution_students
  ADD COLUMN IF NOT EXISTS password    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMPTZ;

SELECT 'Institution student login migration complete' AS status;
