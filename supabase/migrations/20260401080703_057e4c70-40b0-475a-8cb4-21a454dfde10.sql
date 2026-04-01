
CREATE POLICY "Authenticated users can insert rooms"
ON public.rooms FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update rooms"
ON public.rooms FOR UPDATE TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rooms"
ON public.rooms FOR DELETE TO authenticated
USING (true);
