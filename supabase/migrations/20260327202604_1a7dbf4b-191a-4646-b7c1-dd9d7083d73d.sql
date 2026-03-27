
-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_type_id uuid REFERENCES public.subscription_types(id) NOT NULL,
  hours_remaining numeric(6,2) NOT NULL,
  hours_total numeric(6,2) NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service can insert subscriptions" ON public.user_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service can update subscriptions" ON public.user_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Subscription deductions log
CREATE TABLE public.subscription_deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_subscription_id uuid REFERENCES public.user_subscriptions(id) NOT NULL,
  booking_id uuid REFERENCES public.bookings(id) NOT NULL,
  hours_deducted numeric(6,2) NOT NULL DEFAULT 1,
  deducted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deductions" ON public.subscription_deductions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_subscriptions us
      WHERE us.id = user_subscription_id AND us.user_id = auth.uid()
    )
  );

-- Allow service role to insert/update for the cron deduction function
CREATE POLICY "Service role can insert deductions" ON public.subscription_deductions
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role can manage subscriptions" ON public.user_subscriptions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
