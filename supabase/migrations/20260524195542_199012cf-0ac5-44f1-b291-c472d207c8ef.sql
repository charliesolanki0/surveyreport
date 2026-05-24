ALTER TABLE public.reports ALTER COLUMN user_id DROP NOT NULL;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON public.reports;
CREATE POLICY "Public can view reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Public can create reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update reports" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "Public can delete reports" ON public.reports FOR DELETE USING (true);