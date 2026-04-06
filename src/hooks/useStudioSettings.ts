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

interface LegalSettings {
  entity_name: string;
  inn: string;
  ogrn: string;
  email: string;
  work_hours: string;
}

const studioDefaults: StudioSettings = {
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

const legalDefaults: LegalSettings = {
  entity_name: "",
  inn: "",
  ogrn: "",
  email: "",
  work_hours: "Пн-Вс: 09:00–22:00",
};

let cachedSettings: StudioSettings | null = null;
let cachedLegal: LegalSettings | null = null;
let fetchPromise: Promise<{ studio: StudioSettings; legal: LegalSettings }> | null = null;

function fetchAllSettings(): Promise<{ studio: StudioSettings; legal: LegalSettings }> {
  if (cachedSettings && cachedLegal) return Promise.resolve({ studio: cachedSettings, legal: cachedLegal });
  if (fetchPromise) return fetchPromise;
  fetchPromise = supabase
    .from("studio_settings")
    .select("key, value")
    .in("key", ["studio", "legal"])
    .then(({ data }) => {
      let studio = studioDefaults;
      let legal = legalDefaults;
      if (data) {
        for (const row of data) {
          if (row.key === "studio") studio = row.value as unknown as StudioSettings;
          if (row.key === "legal") legal = row.value as unknown as LegalSettings;
        }
      }
      cachedSettings = studio;
      cachedLegal = legal;
      return { studio, legal };
    }) as Promise<{ studio: StudioSettings; legal: LegalSettings }>;
  return fetchPromise;
}

export function useStudioSettings() {
  const [settings, setSettings] = useState<StudioSettings>(cachedSettings || studioDefaults);
  const [legal, setLegal] = useState<LegalSettings>(cachedLegal || legalDefaults);
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    fetchAllSettings().then(({ studio, legal: l }) => {
      setSettings(studio);
      setLegal(l);
      setLoading(false);
    });
  }, []);

  return { settings, legal, loading };
}
