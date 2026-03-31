
CREATE POLICY "Authenticated users can insert directions"
ON public.directions FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update directions"
ON public.directions FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete directions"
ON public.directions FOR DELETE TO authenticated
USING (true);
