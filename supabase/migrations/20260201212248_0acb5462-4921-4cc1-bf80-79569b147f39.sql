-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access to reports
CREATE POLICY "Reports are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');

-- Policy to allow authenticated users to upload their reports
CREATE POLICY "Users can upload reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports' AND auth.role() = 'authenticated');

-- Policy to allow service role full access
CREATE POLICY "Service role can manage reports"
ON storage.objects FOR ALL
USING (bucket_id = 'reports')
WITH CHECK (bucket_id = 'reports');