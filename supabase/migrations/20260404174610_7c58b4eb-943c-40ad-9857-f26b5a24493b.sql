CREATE POLICY "Anon can delete teachers"
ON public.teachers
FOR DELETE
TO anon
USING (true);