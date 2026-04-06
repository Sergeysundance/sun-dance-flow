
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS seen_by_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS seen_by_admin boolean NOT NULL DEFAULT false;
