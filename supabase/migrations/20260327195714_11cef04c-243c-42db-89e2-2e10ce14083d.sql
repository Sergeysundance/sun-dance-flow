
CREATE TABLE public.subscription_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  class_count integer, -- null = unlimited
  duration_days integer NOT NULL DEFAULT 30,
  class_duration integer NOT NULL DEFAULT 60,
  price integer NOT NULL DEFAULT 0,
  old_price integer,
  type text NOT NULL DEFAULT 'group',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active subscription types"
ON public.subscription_types FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can insert subscription_types"
ON public.subscription_types FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update subscription_types"
ON public.subscription_types FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subscription_types"
ON public.subscription_types FOR DELETE
TO authenticated
USING (true);
