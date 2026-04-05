import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Direction = Tables<"directions">;
type UserSubscription = Tables<"user_subscriptions">;

export default function ClientsPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!editProfile;

  const fetchData = async () => {
    const [pRes, dRes, sRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("directions").select("*").order("sort_order"),
      supabase.from("user_subscriptions").select("*"),
    ]);
    if (pRes.data) setProfiles(pRes.data);
    if (dRes.data) setDirections(dRes.data);
    if (sRes.data) setSubscriptions(sRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setMiddleName("");
    setPhone("");
    setBirthDate("");
    setNotes("");
    setSelectedDirections([]);
    setDiscountPercent(0);
    setEditProfile(null);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (p: Profile) => {
    setEditProfile(p);
    setFirstName(p.first_name);
    setLastName(p.last_name);
    setMiddleName(p.middle_name);
    setPhone(p.phone);
    setBirthDate(p.birth_date || "");
    setNotes(p.notes || "");
    setSelectedDirections(p.preferred_directions || []);
    setDiscountPercent((p as any).discount_percent ?? 0);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Введите имя и фамилию");
      return;
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      middle_name: middleName.trim(),
      phone: phone.trim(),
      birth_date: birthDate || null,
      notes: notes.trim() || null,
      preferred_directions: selectedDirections,
      discount_percent: discountPercent,
    };

    if (isEditing && editProfile) {
      const { error } = await supabase.from("profiles").update(payload).eq("id", editProfile.id);
      if (error) { toast.error("Ошибка при обновлении"); return; }
      toast.success("Клиент обновлён");
    } else {
      toast.info("Создание клиентов доступно через регистрацию на сайте");
      setDialogOpen(false);
      resetForm();
      return;
    }

    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDeleteClient = async () => {
    if (!editProfile) return;
    setDeleting(true);
    // Delete related data first, then profile
    await supabase.from("bookings").delete().eq("user_id", editProfile.user_id);
    await supabase.from("user_subscriptions").delete().eq("user_id", editProfile.user_id);
    await supabase.from("notifications").delete().eq("user_id", editProfile.user_id);
    const { error } = await supabase.from("profiles").delete().eq("id", editProfile.id);
    setDeleting(false);
    if (error) { toast.error("Ошибка при удалении клиента"); return; }
    toast.success("Аккаунт клиента удалён");
    setDeleteConfirmOpen(false);
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const toggleDirection = (id: string) => {
    setSelectedDirections(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const getActiveSub = (userId: string) =>
    subscriptions.find(s => s.user_id === userId && s.active);

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      `${p.first_name} ${p.last_name} ${p.middle_name}`.toLowerCase().includes(q) ||
      p.phone.includes(q);
    if (!matchesSearch) return false;
    if (tab === "with") return !!getActiveSub(p.user_id);
    if (tab === "without") return !getActiveSub(p.user_id);
    return true;
  });

  if (loading) return <div className="text-admin-muted p-8">Загрузка…</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="with">С абонементом</TabsTrigger>
            <TabsTrigger value="without">Без абонемента</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <Input placeholder="Поиск по имени или телефону" className="pl-9 w-64 bg-white border-admin-border" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-border bg-gray-50 text-left text-xs font-medium text-admin-muted">
              <th className="px-4 py-3">Имя</th>
              <th className="px-4 py-3">Телефон</th>
              <th className="px-4 py-3">Бонусы</th>
              <th className="px-4 py-3">Абонемент</th>
              <th className="px-4 py-3">Регистрация</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const sub = getActiveSub(p.user_id);
              return (
                <tr
                  key={p.id}
                  className={`border-b border-admin-border last:border-0 hover:bg-gray-50 cursor-pointer ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                  onClick={() => navigate(`/admin/clients/${p.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-admin-foreground">
                    {p.last_name} {p.first_name} {p.middle_name}
                  </td>
                  <td className="px-4 py-3">
                    <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{p.phone}</a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-admin-foreground">{p.bonus_points ?? 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    {sub ? <Badge className="bg-green-100 text-green-800">Активен</Badge> : <span className="text-admin-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-admin-muted">{new Date(p.created_at).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-admin-muted hover:text-admin-foreground" onClick={(e) => { e.stopPropagation(); openEdit(p); }}>
                      Изменить
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-admin-muted">Клиенты не найдены</div>}
      </div>

      {/* Edit client dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-admin-foreground">
              {isEditing ? "Редактировать клиента" : "Новый клиент"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto grid gap-3 pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Фамилия *</Label><Input className="bg-white border-admin-border" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
              <div><Label>Имя *</Label><Input className="bg-white border-admin-border" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
            </div>
            <div><Label>Отчество</Label><Input className="bg-white border-admin-border" value={middleName} onChange={e => setMiddleName(e.target.value)} /></div>
            <div><Label>Телефон</Label><Input placeholder="+7 (___) ___-__-__" className="bg-white border-admin-border" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label>Дата рождения</Label><Input type="date" className="bg-white border-admin-border" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></div>
            <div>
              <Label>Предпочтительные направления</Label>
              <div className="mt-1.5 space-y-1.5 rounded-md border border-admin-border p-3">
                {directions.filter(d => d.active).map(d => (
                  <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={selectedDirections.includes(d.id)}
                      onCheckedChange={() => toggleDirection(d.id)}
                    />
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Скидка на абонементы (%)</Label>
              <Input type="number" min={0} max={100} className="bg-white border-admin-border" value={discountPercent} onChange={e => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} />
            </div>
            <div><Label>Заметки</Label><Textarea className="bg-white border-admin-border" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
