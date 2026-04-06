
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  sender_role TEXT NOT NULL DEFAULT 'user',
  subject TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own support messages"
ON public.support_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own messages
CREATE POLICY "Users can create own support messages"
ON public.support_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND sender_role = 'user');

-- Users can mark messages as read
CREATE POLICY "Users can update own support messages"
ON public.support_messages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Anon (CRM admin) full access
CREATE POLICY "Anon can view all support messages"
ON public.support_messages FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert support messages"
ON public.support_messages FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update support messages"
ON public.support_messages FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete support messages"
ON public.support_messages FOR DELETE TO anon USING (true);
