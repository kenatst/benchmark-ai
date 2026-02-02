-- Allow users to delete their own reports
CREATE POLICY "Users can delete own reports"
ON public.reports
FOR DELETE
USING (auth.uid() = user_id);