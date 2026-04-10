import { useState, useEffect, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SitePhotos {
  hero_images: string[];
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<SitePhotos>({ hero_images: [] });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("studio_settings").select("value").eq("key", "site_photos").maybeSingle().then(({ data }) => {
      if (data?.value) setPhotos(data.value as unknown as SitePhotos);
      setLoading(false);
    });
  }, []);

  const save = async (newPhotos: SitePhotos) => {
    const { data: existing } = await supabase.from("studio_settings").select("id").eq("key", "site_photos").maybeSingle();
    if (existing) {
      await supabase.from("studio_settings").update({ value: newPhotos as any }).eq("key", "site_photos");
    } else {
      await supabase.from("studio_settings").insert({ key: "site_photos", value: newPhotos as any });
    }
    setPhotos(newPhotos);
    toast.success("Сохранено");
  };

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Выберите изображение"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Макс. 5 МБ"); return; }
    setUploading(true);
    const path = `hero/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("site-photos").upload(path, file, { upsert: true });
    if (error) { toast.error("Ошибка загрузки"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("site-photos").getPublicUrl(path);
    const newPhotos = { ...photos, hero_images: [...photos.hero_images, urlData.publicUrl] };
    await save(newPhotos);
    setUploading(false);
  };

  const removeHero = async (idx: number) => {
    const newImages = photos.hero_images.filter((_, i) => i !== idx);
    await save({ ...photos, hero_images: newImages });
  };

  if (loading) return <div className="text-admin-muted p-8">Загрузка…</div>;

  return (
    <div className="space-y-6">
      <Card className="bg-white border-admin-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-admin-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Hero-изображения (шапка сайта)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-admin-muted">Загрузите изображения для блока hero на главной странице. Они будут показаны в верхней части сайта.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.hero_images.map((url, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-admin-border aspect-video">
                <img src={url} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeHero(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">#{i + 1}</div>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-admin-border aspect-video text-admin-muted hover:text-admin-foreground hover:border-admin-accent transition-colors"
              disabled={uploading}
            >
              <Upload className="h-6 w-6 mb-1" />
              <span className="text-xs">{uploading ? "Загрузка…" : "Добавить"}</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
