
-- Allow authenticated users to manage schedule_classes
CREATE POLICY "Authenticated users can insert schedule_classes"
  ON public.schedule_classes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update schedule_classes"
  ON public.schedule_classes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete schedule_classes"
  ON public.schedule_classes FOR DELETE
  TO authenticated
  USING (true);
