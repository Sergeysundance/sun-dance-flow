
CREATE POLICY "Anon can update teachers"
ON public.teachers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can insert teachers"
ON public.teachers
FOR INSERT
TO anon
WITH CHECK (true);
