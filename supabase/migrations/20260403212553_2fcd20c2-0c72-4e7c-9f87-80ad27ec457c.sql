
CREATE TABLE public.faq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view faq" ON public.faq FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authenticated can insert faq" ON public.faq FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update faq" ON public.faq FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete faq" ON public.faq FOR DELETE TO authenticated USING (true);
CREATE POLICY "Anon can insert faq" ON public.faq FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update faq" ON public.faq FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can delete faq" ON public.faq FOR DELETE TO anon USING (true);
