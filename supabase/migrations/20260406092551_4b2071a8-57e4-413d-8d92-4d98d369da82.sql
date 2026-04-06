
CREATE POLICY "Anon can update user_subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);
