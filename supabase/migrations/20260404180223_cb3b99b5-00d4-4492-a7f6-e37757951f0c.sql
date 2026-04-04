
CREATE POLICY "Anon can update schedule_classes"
ON public.schedule_classes
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can insert schedule_classes"
ON public.schedule_classes
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon can delete schedule_classes"
ON public.schedule_classes
FOR DELETE
TO anon
USING (true);
