
-- Add user_id to trial_requests
ALTER TABLE public.trial_requests ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop old insert policy that allowed anon
DROP POLICY IF EXISTS "Anyone can insert trial requests" ON public.trial_requests;

-- Only authenticated users can insert, and only for themselves
CREATE POLICY "Authenticated users can insert own trial requests"
  ON public.trial_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
