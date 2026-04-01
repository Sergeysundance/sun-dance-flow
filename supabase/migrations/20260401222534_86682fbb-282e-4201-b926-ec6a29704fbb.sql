
-- Allow authenticated users to view all profiles (for admin panel)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update all profiles (for admin panel)
CREATE POLICY "Authenticated users can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view all subscriptions (for admin panel)
CREATE POLICY "Authenticated users can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view all bookings (for admin client detail)
CREATE POLICY "Authenticated users can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (true);
