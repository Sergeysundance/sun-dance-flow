
-- Add photo_url column to teachers
ALTER TABLE public.teachers ADD COLUMN photo_url text NOT NULL DEFAULT '';

-- Create storage bucket for teacher photos
INSERT INTO storage.buckets (id, name, public) VALUES ('teacher-photos', 'teacher-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view teacher photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'teacher-photos');

CREATE POLICY "Anon can upload teacher photos"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'teacher-photos');

CREATE POLICY "Anon can update teacher photos"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'teacher-photos');

CREATE POLICY "Anon can delete teacher photos"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'teacher-photos');

CREATE POLICY "Auth can upload teacher photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'teacher-photos');

CREATE POLICY "Auth can update teacher photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'teacher-photos');

CREATE POLICY "Auth can delete teacher photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'teacher-photos');
