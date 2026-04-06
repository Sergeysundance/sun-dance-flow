import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StudioSettings {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  telegram: string;
  whatsapp: string;
  vk: string;
  description: string;
  hours: { day: string; open: string; close: string }[];
}

const defaults: StudioSettings = {
  name: "Sun Dance School",
  slogan: "Пространство осознанного движения",
  address: "пр. Ветеранов 147В, Санкт-Петербург",
  phone: "+7 (921) 413-18-30",
  email: "",
  telegram: "https://t.me/bachatasolnechno",
  whatsapp: "",
  vk: "https://vk.ru/sunbachata",
  description: "Sun Dance School — это место, где каждый найдет свое направление и уровень.",
  hours: [],
};

let cachedSettings: StudioSettings | null = null;
let fetchPromise: Promise<StudioSettings> | null = null;

function fetchSettings(): Promise<StudioSettings> {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (fetchPromise) return fetchPromise;
  fetchPromise = supabase
    .from("studio_settings")
    .select("key, value")
    .eq("key", "studio")
    .maybeSingle()
    .then(({ data }) => {
      const s = data?.value ? (data.value as unknown as StudioSettings) : defaults;
      cachedSettings = s;
      return s;
    }) as Promise<StudioSettings>;
  return fetchPromise;
}

export function useStudioSettings() {
  const [settings, setSettings] = useState<StudioSettings>(cachedSettings || defaults);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    fetchSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  return { settings, loading };
}
