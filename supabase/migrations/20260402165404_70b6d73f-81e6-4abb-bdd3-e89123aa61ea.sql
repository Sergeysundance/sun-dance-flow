
CREATE TABLE public.trial_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  direction_id UUID REFERENCES public.directions(id),
  comment TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  payment_id TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert trial requests"
  ON public.trial_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view trial requests"
  ON public.trial_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update trial requests"
  ON public.trial_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete trial requests"
  ON public.trial_requests FOR DELETE
  TO authenticated
  USING (true);
