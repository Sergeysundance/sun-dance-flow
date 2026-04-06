ALTER TABLE public.user_subscriptions
  ADD COLUMN was_frozen boolean NOT NULL DEFAULT false;