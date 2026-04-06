ALTER TABLE public.user_subscriptions
  ADD COLUMN frozen boolean NOT NULL DEFAULT false,
  ADD COLUMN frozen_at timestamp with time zone,
  ADD COLUMN frozen_until timestamp with time zone,
  ADD COLUMN original_expires_at timestamp with time zone;