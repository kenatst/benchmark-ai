-- Add progress tracking columns to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS processing_step TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS processing_progress INTEGER DEFAULT 0;