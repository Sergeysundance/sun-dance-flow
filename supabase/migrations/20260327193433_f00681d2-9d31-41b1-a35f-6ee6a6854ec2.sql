
CREATE POLICY "Authenticated users can insert teachers"
ON public.teachers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update teachers"
ON public.teachers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete teachers"
ON public.teachers FOR DELETE
TO authenticated
USING (true);
