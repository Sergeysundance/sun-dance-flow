-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
ON public.user_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow teachers to delete their own teacher record
CREATE POLICY "Teachers can delete own record"
ON public.teachers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);