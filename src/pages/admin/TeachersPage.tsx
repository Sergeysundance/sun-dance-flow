import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Upload, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";

export default function TeachersPage() {
  const navigate = useNavigate();
  const { selectedBranchId } = useBranch();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [directions, setDirections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState(20);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const [tRes, dRes] = await Promise.all([
      supabase.from("teachers").select("*").order("created_at", { ascending: false }),
      supabase.from("directions").select("*").order("sort_order"),
    ]);
    let allTeachers = tRes.data || [];
    if (selectedBranchId) {
      allTeachers = allTeachers.filter((t: any) => t.branch_ids && t.branch_ids.includes(selectedBranchId));
    }
    setTeachers(allTeachers);
    if (dRes.data) setDirections(dRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [selectedBranchId]);

  const getDirection = (id: string) => directions.find(d => d.id === id);
  const activeTeachers = teachers.filter(t => t.active);
  const inactiveTeachers = teachers.filter(t => !t.active);

  const filterTeachers = (list: any[]) => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(t =>
      `${t.first_name} ${t.last_name}`.toLowerCase().includes(q) ||
      t.phone.includes(q) || t.email.toLowerCase().includes(q)
    );
  };

  const resetForm = () => {
    setFirstName(""); setLastName(""); setPhone(""); setEmail(""); setBio(""); setTelegramId(""); setSelectedDirections([]); setDiscountPercent(20);
    setPhotoFile(null); setPhotoPreview("");
  };

  const handleCreate = async () => {
    if (!firstName.trim()) { toast.error("Введите имя"); return; }
    setUploading(true);
    try {
      const payload: any = {
        first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim(),
        email: email.trim(), bio: bio.trim(), telegram_id: telegramId.trim(),
        direction_ids: selectedDirections, discount_percent: discountPercent,
        branch_ids: selectedBranchId ? [selectedBranchId] : [],
      };
      const { data, error } = await supabase.from("teachers").insert(payload).select("id").single();
      if (error) { toast.error("Ошибка"); return; }
      if (photoFile && data) {
        const ext = photoFile.name.split(".").pop();
        const path = `${data.id}.${ext}`;
        await supabase.storage.from("teacher-photos").upload(path, photoFile, { upsert: true });
        const { data: urlData } = supabase.storage.from("teacher-photos").getPublicUrl(path);
        await supabase.from("teachers").update({ photo_url: `${urlData.publicUrl}?t=${Date.now()}` }).eq("id", data.id);
      }
      toast.success("Преподаватель создан");
      setDialogOpen(false); resetForm(); fetchData();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRowClick = (t: any) => {
    if (!t.seen_by_admin) {
      supabase.from("teachers").update({ seen_by_admin: true }).eq("id", t.id).then(() => {
        setTeachers(prev => prev.map(tr => tr.id === t.id ? { ...tr, seen_by_admin: true } : tr));
      });
    }
    navigate(`/admin/teachers/${t.id}`);
  };

  const renderTable = (list: any[]) => {
    const filtered = filterTeachers(list);
    if (filtered.length === 0) return <div className="p-8 text-center text-admin-muted text-sm">Преподаватели не найдены</div>;
    return (
      <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-border bg-gray-50 text-left text-xs font-medium text-admin-muted">
              <th className="px-4 py-3">Преподаватель</th>
              <th className="px-4 py-3">Телефон</th>
              <th className="px-4 py-3">Направления</th>
              <th className="px-4 py-3">Скидка</th>
              <th className="px-4 py-3">Регистрация</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr
                key={t.id}
                className={`border-b border-admin-border last:border-0 hover:bg-gray-50 cursor-pointer ${!t.seen_by_admin ? 'bg-green-50 border-l-4 border-l-green-400' : i % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                onClick={() => handleRowClick(t)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {t.photo_url ? <AvatarImage src={t.photo_url} /> : null}
                      <AvatarFallback className="bg-admin-accent/20 text-xs font-bold text-admin-foreground">{t.first_name[0]}{t.last_name?.[0] || ""}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-admin-foreground">
                        {!t.seen_by_admin && <Badge className="bg-green-500 text-white text-[10px] mr-1.5">Новый</Badge>}
                        {t.first_name} {t.last_name}
                      </span>
                      {t.bio && <p className="text-xs text-admin-muted line-clamp-1 max-w-xs">{t.bio}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <a href={`tel:${t.phone.replace(/[^\d+]/g, '')}`} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{t.phone}</a>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {t.direction_ids.slice(0, 3).map((dId: string) => {
                      const dir = getDirection(dId);
                      return dir ? <Badge key={dId} variant="outline" style={{ borderColor: dir.color, color: dir.color }} className="text-[10px]">{dir.name}</Badge> : null;
                    })}
                    {t.direction_ids.length > 3 && <span className="text-xs text-admin-muted">+{t.direction_ids.length - 3}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {t.discount_percent !== 20
                    ? <Badge className="bg-orange-100 text-orange-800">{t.discount_percent}%</Badge>
                    : <span className="text-admin-muted">{t.discount_percent}%</span>}
                </td>
                <td className="px-4 py-3 text-admin-muted">{new Date(t.created_at).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) return <div className="text-admin-muted p-8">Загрузка…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
          <Input placeholder="Поиск по имени, телефону, email" className="pl-9 w-64 bg-white border-admin-border" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый преподаватель</Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="active">Активные ({activeTeachers.length})</TabsTrigger>
          <TabsTrigger value="inactive">Деактивированные ({inactiveTeachers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">{renderTable(activeTeachers)}</TabsContent>
        <TabsContent value="inactive">{renderTable(inactiveTeachers)}</TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Новый преподаватель</DialogTitle></DialogHeader>
          <div className="grid gap-3 overflow-y-auto flex-1 pr-1">
            <div>
              <Label>Фото</Label>
              <div className="mt-1 flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {photoPreview ? <AvatarImage src={photoPreview} /> : null}
                  <AvatarFallback className="bg-admin-accent/20 text-xl font-bold">{firstName?.[0] || "?"}{lastName?.[0] || ""}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) { toast.error("Выберите изображение"); return; }
                    if (file.size > 5 * 1024 * 1024) { toast.error("Макс. 5 МБ"); return; }
                    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file));
                  }} />
                  <Button type="button" variant="outline" size="sm" className="border-admin-border gap-1" onClick={() => fileInputRef.current?.click()}><Upload className="h-3.5 w-3.5" /> Загрузить</Button>
                  {photoPreview && <Button type="button" variant="ghost" size="sm" className="text-red-500 gap-1" onClick={() => { setPhotoFile(null); setPhotoPreview(""); }}><X className="h-3.5 w-3.5" /> Удалить</Button>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Имя *</Label><Input className="bg-white border-admin-border" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
              <div><Label>Фамилия</Label><Input className="bg-white border-admin-border" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
            </div>
            <div><Label>Телефон</Label><Input className="bg-white border-admin-border" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" className="bg-white border-admin-border" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Био</Label><Textarea className="bg-white border-admin-border" value={bio} onChange={e => setBio(e.target.value)} /></div>
            <div>
              <Label>Направления</Label>
              <div className="mt-1 space-y-2">
                {directions.map(d => (
                  <div key={d.id} className="flex items-center gap-2">
                    <Checkbox checked={selectedDirections.includes(d.id)} onCheckedChange={() => setSelectedDirections(p => p.includes(d.id) ? p.filter(x => x !== d.id) : [...p, d.id])} />
                    <label className="text-sm">{d.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div><Label>Telegram ID</Label><Input className="bg-white border-admin-border" value={telegramId} onChange={e => setTelegramId(e.target.value)} /></div>
            <div>
              <Label>Скидка (%)</Label>
              <Input type="number" min={0} max={100} className="bg-white border-admin-border" value={discountPercent} onChange={e => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleCreate} disabled={uploading}>{uploading ? "Загрузка…" : "Создать"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
