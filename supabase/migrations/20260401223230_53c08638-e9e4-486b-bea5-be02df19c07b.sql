
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, middle_name, phone, birth_date, preferred_directions)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'middle_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'birth_date', ''),
    COALESCE(
      (SELECT array_agg(val::text) FROM jsonb_array_elements_text(
        CASE WHEN NEW.raw_user_meta_data->'preferred_directions' IS NOT NULL 
             AND jsonb_typeof(NEW.raw_user_meta_data->'preferred_directions') = 'array'
        THEN NEW.raw_user_meta_data->'preferred_directions' 
        ELSE '[]'::jsonb END
      ) AS val),
      '{}'::text[]
    )
  );
  RETURN NEW;
END;
$$;
