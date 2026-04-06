
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  discount_percent integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  starts_at date,
  ends_at date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view promotions" ON public.promotions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert promotions" ON public.promotions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update promotions" ON public.promotions FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete promotions" ON public.promotions FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated can insert promotions" ON public.promotions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update promotions" ON public.promotions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete promotions" ON public.promotions FOR DELETE TO authenticated USING (true);
