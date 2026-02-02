-- Add progress tracking columns to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS processing_step TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0;
