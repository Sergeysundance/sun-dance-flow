CREATE POLICY "Teachers can view student profiles for their classes"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.schedule_classes sc ON sc.id = b.class_id
    JOIN public.teachers t ON t.id = sc.teacher_id
    WHERE b.user_id = profiles.user_id
      AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Teachers can view bookings for their classes"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.schedule_classes sc
    JOIN public.teachers t ON t.id = sc.teacher_id
    WHERE sc.id = bookings.class_id
      AND t.user_id = auth.uid()
  )
);