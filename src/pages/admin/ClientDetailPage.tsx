import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Direction = Tables<"directions">;
type UserSubscription = Tables<"user_subscriptions">;
type SubscriptionType = Tables<"subscription_types">;

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [subscriptions, setSubscriptions] = useState<(UserSubscription & { type?: SubscriptionType })[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bonusAmount, setBonusAmount] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);

  const fetchData = async () => {
    if (!id) return;

    const { data: p } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    if (!p) { setLoading(false); return; }
    setProfile(p);

    const [dRes, sRes, bRes] = await Promise.all([
      supabase.from("directions").select("*").order("sort_order"),
      supabase.from("user_subscriptions").select("*, subscription_types(*)").eq("user_id", p.user_id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("*, schedule_classes(*, directions(*), rooms(*), teachers(*))").eq("user_id", p.user_id).order("created_at", { ascending: false }),
    ]);

    if (dRes.data) setDirections(dRes.data);
    if (sRes.data) setSubscriptions(sRes.data.map((s: any) => ({ ...s, type: s.subscription_types })));
    if (bRes.data) setBookings(bRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const openEdit = () => {
    if (!profile) return;
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setMiddleName(profile.middle_name);
    setPhone(profile.phone);
    setBirthDate(profile.birth_date || "");
    setNotes(profile.notes || "");
    setSelectedDirections(profile.preferred_directions || []);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!profile || !firstName.trim() || !lastName.trim()) {
      toast.error("Введите имя и фамилию");
      return;
    }

    const { error } = await supabase.from("profiles").update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      middle_name: middleName.trim(),
      phone: phone.trim(),
      birth_date: birthDate || null,
      notes: notes.trim() || null,
      preferred_directions: selectedDirections,
    }).eq("id", profile.id);

    if (error) { toast.error("Ошибка при сохранении"); return; }
    toast.success("Клиент обновлён");
    setEditOpen(false);
    fetchData();
  };

  const toggleDirection = (dirId: string) => {
    setSelectedDirections(prev =>
      prev.includes(dirId) ? prev.filter(d => d !== dirId) : [...prev, dirId]
    );
  };

  const getDir = (dirId: string) => directions.find(d => d.id === dirId);

  if (loading) return <div className="text-admin-muted p-8">Загрузка…</div>;
  if (!profile) return <div className="p-8 text-center text-admin-muted">Клиент не найден</div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/clients")} className="text-admin-muted gap-1 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Клиенты
      </Button>

      <Card className="bg-white border-admin-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-admin-foreground">
                {profile.last_name} {profile.first_name} {profile.middle_name}
              </h2>
              <div className="mt-1 space-y-0.5 text-sm text-admin-muted">
                {profile.phone && <div>📞 <a href={`tel:${profile.phone.replace(/[^\d+]/g, '')}`} className="text-blue-600 hover:underline">{profile.phone}</a></div>}
                {profile.birth_date && <div>🎂 {new Date(profile.birth_date).toLocaleDateString('ru-RU')}</div>}
                {profile.notes && <div>📝 {profile.notes}</div>}
                <div>⭐ Бонусные баллы: <span className="font-bold text-admin-foreground">{profile.bonus_points ?? 0}</span></div>
              </div>
              {(profile.preferred_directions || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(profile.preferred_directions || []).map(dId => {
                    const dir = getDir(dId);
                    return dir ? (
                      <Badge key={dId} variant="outline" style={{ borderColor: dir.color, color: dir.color }} className="text-xs">{dir.name}</Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Баллы"
                className="w-24 bg-white border-admin-border"
                value={bonusAmount}
                onChange={e => setBonusAmount(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="border-admin-border gap-1"
                onClick={async () => {
                  const amt = parseInt(bonusAmount);
                  if (!amt || amt <= 0) { toast.error("Введите положительное число"); return; }
                  const current = profile.bonus_points ?? 0;
                  const { error } = await supabase.from("profiles").update({ bonus_points: current + amt }).eq("id", profile.id);
                  if (error) { toast.error("Ошибка начисления"); return; }
                  toast.success(`+${amt} баллов начислено`);
                  setBonusAmount("");
                  fetchData();
                }}
              >
                <Plus className="h-4 w-4" /> Начислить
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-admin-border gap-1"
                onClick={async () => {
                  const amt = parseInt(bonusAmount);
                  if (!amt || amt <= 0) { toast.error("Введите положительное число"); return; }
                  const current = (profile as any).bonus_points ?? 0;
                  if (amt > current) { toast.error("Недостаточно баллов"); return; }
                  const { error } = await supabase.from("profiles").update({ bonus_points: current - amt } as any).eq("id", profile.id);
                  if (error) { toast.error("Ошибка списания"); return; }
                  toast.success(`-${amt} баллов списано`);
                  setBonusAmount("");
                  fetchData();
                }}
              >
                <Minus className="h-4 w-4" /> Списать
              </Button>
            </div>
            <Button variant="outline" className="border-admin-border gap-1" onClick={openEdit}>
              <Edit className="h-4 w-4" /> Редактировать
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="subscriptions">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="subscriptions">Абонементы</TabsTrigger>
          <TabsTrigger value="bookings">Записи на занятия</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-4">
          {subscriptions.length === 0 ? (
            <div className="rounded-lg border border-admin-border bg-white p-8 text-center text-admin-muted">Нет абонементов</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-admin-border bg-gray-50 text-left text-xs text-admin-muted">
                    <th className="px-4 py-3">Тип</th>
                    <th className="px-4 py-3">Период</th>
                    <th className="px-4 py-3">Остаток</th>
                    <th className="px-4 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map(s => {
                    const pct = s.hours_total > 0 ? ((s.hours_total - s.hours_remaining) / s.hours_total) * 100 : 0;
                    return (
                      <tr key={s.id} className="border-b border-admin-border last:border-0">
                        <td className="px-4 py-3 font-medium text-admin-foreground">{s.type?.name || "—"}</td>
                        <td className="px-4 py-3 text-admin-muted">
                          {new Date(s.purchased_at).toLocaleDateString('ru-RU')} — {new Date(s.expires_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="px-4 py-3 w-40">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs">{s.hours_remaining}/{s.hours_total} ч</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={s.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {s.active ? "Активен" : "Неактивен"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          {bookings.length === 0 ? (
            <div className="rounded-lg border border-admin-border bg-white p-8 text-center text-admin-muted">Нет записей</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-admin-border bg-gray-50 text-left text-xs text-admin-muted">
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3">Направление</th>
                    <th className="px-4 py-3">Время</th>
                    <th className="px-4 py-3">Преподаватель</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any) => {
                    const cls = b.schedule_classes;
                    const dir = cls?.directions;
                    const teacher = cls?.teachers;
                    return (
                      <tr key={b.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3">{cls?.date ? new Date(cls.date).toLocaleDateString('ru-RU') : "—"}</td>
                        <td className="px-4 py-3">
                          {dir && <><span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: dir.color }} />{dir.name}</>}
                        </td>
                        <td className="px-4 py-3">{cls ? `${cls.start_time?.slice(0, 5)}–${cls.end_time?.slice(0, 5)}` : "—"}</td>
                        <td className="px-4 py-3 text-admin-muted">{teacher ? `${teacher.first_name} ${teacher.last_name}` : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-admin-foreground">Редактировать клиента</DialogTitle>
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
                    <Checkbox checked={selectedDirections.includes(d.id)} onCheckedChange={() => toggleDirection(d.id)} />
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </label>
                ))}
              </div>
            </div>
            <div><Label>Заметки</Label><Textarea className="bg-white border-admin-border" value={notes} onChange={e => setNotes(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
