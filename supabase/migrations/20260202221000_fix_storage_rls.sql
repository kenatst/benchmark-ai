-- Fix storage bucket RLS - prevent public access to reports

-- Drop the insecure public access policy
DROP POLICY IF EXISTS "Reports are publicly accessible" ON storage.objects;

-- Allow authenticated users to upload their own reports (path-based access control)
DROP POLICY IF EXISTS "Users can upload reports" ON storage.objects;
CREATE POLICY "Users can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reports'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to download their own reports
DROP POLICY IF EXISTS "Service role can manage reports" ON storage.objects;
CREATE POLICY "Users can download own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow service role (backend) full access for PDF generation
CREATE POLICY "Service role can manage reports"
ON storage.objects FOR ALL
USING (bucket_id = 'reports' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'reports' AND auth.role() = 'service_role');
