
-- Directions table
CREATE TABLE public.directions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#3B82F6',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.directions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active directions"
  ON public.directions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Rooms table
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  capacity int NOT NULL DEFAULT 20,
  area int NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#3B82F6',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms"
  ON public.rooms FOR SELECT
  TO anon, authenticated
  USING (true);

-- Teachers table
CREATE TABLE public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  direction_ids uuid[] NOT NULL DEFAULT '{}',
  telegram_id text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active teachers"
  ON public.teachers FOR SELECT
  TO anon, authenticated
  USING (true);

-- Schedule classes table
CREATE TABLE public.schedule_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction_id uuid NOT NULL REFERENCES public.directions(id),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id),
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  max_spots int NOT NULL DEFAULT 20,
  cancelled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedule"
  ON public.schedule_classes FOR SELECT
  TO anon, authenticated
  USING (true);
