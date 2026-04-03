CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view branches" ON public.branches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert branches" ON public.branches FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update branches" ON public.branches FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete branches" ON public.branches FOR DELETE TO anon USING (true);
CREATE POLICY "Authenticated can insert branches" ON public.branches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update branches" ON public.branches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete branches" ON public.branches FOR DELETE TO authenticated USING (true);