
CREATE TABLE public.studio_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.studio_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can update settings" ON public.studio_settings FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anon can insert settings" ON public.studio_settings FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Authenticated can update settings" ON public.studio_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can insert settings" ON public.studio_settings FOR INSERT TO authenticated WITH CHECK (true);

INSERT INTO public.studio_settings (key, value) VALUES
  ('studio', '{"name":"Sun Dance School","slogan":"Пространство осознанного движения","address":"пр. Ветеранов 147В, Санкт-Петербург","phone":"+7 (921) 413-18-30","email":"","telegram":"https://t.me/bachatasolnechno","whatsapp":"","vk":"https://vk.ru/sunbachata","description":"Sun Dance School — это место, где каждый найдет свое направление и уровень.","hours":[{"day":"Понедельник","open":"10:00","close":"22:00"},{"day":"Вторник","open":"10:00","close":"22:00"},{"day":"Среда","open":"10:00","close":"22:00"},{"day":"Четверг","open":"10:00","close":"22:00"},{"day":"Пятница","open":"10:00","close":"22:00"},{"day":"Суббота","open":"11:00","close":"20:00"},{"day":"Воскресенье","open":"11:00","close":"20:00"}]}'::jsonb),
  ('telegram', '{"bot_token":"","admin_chat_id":""}'::jsonb),
  ('rules', '{"cancel_hours":3,"auto_activate_days":7,"free_freeze_days":14,"paid_freeze_14_price":700,"paid_freeze_30_price":1000}'::jsonb);
