
-- Create a table to store pending teacher registration data
CREATE TABLE public.pending_teacher_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL DEFAULT '',
  middle_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  direction_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_teacher_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (needed during registration before email confirmation)
CREATE POLICY "Anyone can insert pending registrations"
ON public.pending_teacher_registrations
FOR INSERT
TO public
WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role full access"
ON public.pending_teacher_registrations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create a trigger function that processes pending teacher registrations when a profile is created
CREATE OR REPLACE FUNCTION public.process_pending_teacher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending RECORD;
BEGIN
  -- Check if there's a pending teacher registration for this user
  SELECT * INTO pending
  FROM public.pending_teacher_registrations
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF FOUND THEN
    -- Create the teacher record
    INSERT INTO public.teachers (first_name, last_name, phone, email, bio, direction_ids, user_id)
    VALUES (pending.first_name, pending.last_name, pending.phone, pending.email, pending.bio, pending.direction_ids, NEW.user_id);

    -- Update profile with the data
    UPDATE public.profiles
    SET first_name = pending.first_name,
        last_name = pending.last_name,
        middle_name = pending.middle_name,
        phone = pending.phone
    WHERE user_id = NEW.user_id;

    -- Clean up
    DELETE FROM public.pending_teacher_registrations WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to profiles table (fires after handle_new_user creates the profile)
CREATE TRIGGER on_profile_created_process_teacher
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.process_pending_teacher();
