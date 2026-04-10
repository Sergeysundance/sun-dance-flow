
-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

-- Add description column to schedule_classes
ALTER TABLE public.schedule_classes ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

-- Update handle_new_user trigger to store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, middle_name, phone, birth_date, preferred_directions, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'middle_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    CASE 
      WHEN NULLIF(NEW.raw_user_meta_data->>'birth_date', '') IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'birth_date')::date 
      ELSE NULL 
    END,
    COALESCE(
      (SELECT array_agg(val::text) FROM jsonb_array_elements_text(
        CASE WHEN NEW.raw_user_meta_data->'preferred_directions' IS NOT NULL 
             AND jsonb_typeof(NEW.raw_user_meta_data->'preferred_directions') = 'array'
        THEN NEW.raw_user_meta_data->'preferred_directions' 
        ELSE '[]'::jsonb END
      ) AS val),
      '{}'::text[]
    ),
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$;

-- Create site-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('site-photos', 'site-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for site-photos
CREATE POLICY "Anyone can view site photos" ON storage.objects FOR SELECT USING (bucket_id = 'site-photos');
CREATE POLICY "Anon can upload site photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-photos');
CREATE POLICY "Anon can update site photos" ON storage.objects FOR UPDATE USING (bucket_id = 'site-photos');
CREATE POLICY "Anon can delete site photos" ON storage.objects FOR DELETE USING (bucket_id = 'site-photos');
CREATE POLICY "Auth can upload site photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-photos');
CREATE POLICY "Auth can update site photos" ON storage.objects FOR UPDATE USING (bucket_id = 'site-photos');
CREATE POLICY "Auth can delete site photos" ON storage.objects FOR DELETE USING (bucket_id = 'site-photos');
