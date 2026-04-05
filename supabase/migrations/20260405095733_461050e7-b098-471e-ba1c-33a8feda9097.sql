CREATE POLICY "Anon can delete profiles"
ON public.profiles FOR DELETE TO anon
USING (true);

CREATE POLICY "Anon can delete bookings"
ON public.bookings FOR DELETE TO anon
USING (true);

CREATE POLICY "Anon can delete user_subscriptions"
ON public.user_subscriptions FOR DELETE TO anon
USING (true);

CREATE POLICY "Anon can delete notifications"
ON public.notifications FOR DELETE TO anon
USING (true);