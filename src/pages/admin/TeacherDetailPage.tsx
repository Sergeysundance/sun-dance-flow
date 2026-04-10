import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, X, Trash2, Clock, DollarSign, ChevronDown, ChevronRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [directions, setDirections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit dialog
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

  const [deleteOpen, setDeleteOpen] = useState(false);

  // Salary stats
  const [stats, setStats] = useState<{ month: string; hours: number; salary: number; days: { date: string; hours: number; salary: number; classes: { time: string; direction: string; students: number; salary: number }[] }[] }[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Deduct
  const [deductOpen, setDeductOpen] = useState(false);
  const [deductSubs, setDeductSubs] = useState<any[]>([]);
  const [deductSubId, setDeductSubId] = useState("");
  const [deductHours, setDeductHours] = useState("1");

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [tRes, dRes] = await Promise.all([
      supabase.from("teachers").select("*").eq("id", id).single(),
      supabase.from("directions").select("*").order("sort_order"),
    ]);
    if (tRes.error || !tRes.data) { navigate("/admin/teachers"); return; }
    setTeacher(tRes.data);
    if (dRes.data) setDirections(dRes.data);

    // Mark seen
    if (!tRes.data.seen_by_admin) {
      await supabase.from("teachers").update({ seen_by_admin: true }).eq("id", id);
    }

    setLoading(false);
  }, [id, navigate]);

  const fetchStats = useCallback(async () => {
    if (!id) return;
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const dayNames = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

    const { data: allClasses } = await supabase
      .from("schedule_classes")
      .select("id, date, start_time, end_time, teacher_id, direction_id")
      .eq("teacher_id", id)
      .eq("cancelled", false)
      .lte("date", new Date().toISOString().split("T")[0]);

    if (!allClasses || allClasses.length === 0) { setStats([]); return; }

    const dirIds = [...new Set(allClasses.map(c => c.direction_id))];
    const { data: dirData } = await supabase.from("directions").select("id, name").in("id", dirIds);
    const dirMap = new Map((dirData || []).map(d => [d.id, d.name]));

    const classIds = allClasses.map(c => c.id);
    const { data: allBookings } = await supabase.from("bookings").select("id, class_id, user_id").in("class_id", classIds);

    const userIds = [...new Set((allBookings || []).map(b => b.user_id))];
    let typesMap = new Map<string, any>();
    let subsMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: userSubs } = await supabase.from("user_subscriptions").select("id, user_id, subscription_type_id, hours_total").in("user_id", userIds);
      const typeIds = [...new Set((userSubs || []).map(s => s.subscription_type_id))];
      const { data: subTypes } = await supabase.from("subscription_types").select("id, price, hours_count").in("id", typeIds.length > 0 ? typeIds : ["__none__"]);
      typesMap = new Map((subTypes || []).map(t => [t.id, t]));
      for (const s of (userSubs || [])) {
        if (!subsMap.has(s.user_id) || s.hours_total > (subsMap.get(s.user_id)?.hours_total || 0)) {
          subsMap.set(s.user_id, s);
        }
      }
    }

    const bookingsByClass: Record<string, any[]> = {};
    for (const b of (allBookings || [])) {
      if (!bookingsByClass[b.class_id]) bookingsByClass[b.class_id] = [];
      bookingsByClass[b.class_id].push(b);
    }

    const result: Record<string, Record<string, { hours: number; salary: number; classes: { time: string; direction: string; students: number; salary: number }[] }>> = {};

    for (const cls of allClasses) {
      const dt = new Date(cls.date);
      const monthKey = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, '0')}`;
      const dayKey = cls.date;

      if (!result[monthKey]) result[monthKey] = {};
      if (!result[monthKey][dayKey]) result[monthKey][dayKey] = { hours: 0, salary: 0, classes: [] };

      const [sh, sm] = cls.start_time.split(':').map(Number);
      const [eh, em] = cls.end_time.split(':').map(Number);
      const durationHours = (eh * 60 + em - sh * 60 - sm) / 60;

      let classRevenue = 0;
      const classBookings = bookingsByClass[cls.id] || [];
      for (const b of classBookings) {
        const sub = subsMap.get(b.user_id);
        if (sub) {
          const subType = typesMap.get(sub.subscription_type_id);
          if (subType && subType.hours_count && subType.hours_count > 0) {
            classRevenue += (subType.price / subType.hours_count) * durationHours;
          }
        }
      }
      const classSalary = (classRevenue * 0.95) / 2;

      result[monthKey][dayKey].hours += durationHours;
      result[monthKey][dayKey].salary += classSalary;
      result[monthKey][dayKey].classes.push({
        time: `${cls.start_time.slice(0,5)}–${cls.end_time.slice(0,5)}`,
        direction: dirMap.get(cls.direction_id) || '—',
        students: classBookings.length,
        salary: Math.round(classSalary),
      });
    }

    const statsArr = Object.entries(result)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([mKey, daysObj]) => {
        const [y, m] = mKey.split('-');
        let totalHours = 0, totalSalary = 0;
        const days = Object.entries(daysObj)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([dateStr, dayData]) => {
            totalHours += dayData.hours;
            totalSalary += dayData.salary;
            const d = new Date(dateStr);
            return {
              date: `${dayNames[d.getDay()]} ${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}`,
              hours: Math.round(dayData.hours * 10) / 10,
              salary: Math.round(dayData.salary),
              classes: dayData.classes,
            };
          });
        return { month: `${monthNames[parseInt(m)]} ${y}`, hours: Math.round(totalHours * 10) / 10, salary: Math.round(totalSalary), days };
      });
    setStats(statsArr);
  }, [id]);

  useEffect(() => { fetchData(); fetchStats(); }, [fetchData, fetchStats]);

  const getDirection = (dirId: string) => directions.find(d => d.id === dirId);

  const openEdit = () => {
    if (!teacher) return;
    setFirstName(teacher.first_name);
    setLastName(teacher.last_name);
    setPhone(teacher.phone);
    setEmail(teacher.email);
    setBio(teacher.bio);
    setTelegramId(teacher.telegram_id);
    setSelectedDirections([...teacher.direction_ids]);
    setDiscountPercent(teacher.discount_percent ?? 20);
    setPhotoFile(null);
    setPhotoPreview(teacher.photo_url || "");
    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Выберите изображение"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Макс. 5 МБ"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (teacherId: string): Promise<string> => {
    if (!photoFile) return photoPreview;
    const ext = photoFile.name.split(".").pop();
    const path = `${teacherId}.${ext}`;
    const { error } = await supabase.storage.from("teacher-photos").upload(path, photoFile, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("teacher-photos").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    if (!firstName.trim() || !teacher) { toast.error("Введите имя"); return; }
    setUploading(true);
    try {
      const photoUrl = await uploadPhoto(teacher.id);
      const { error } = await supabase.from("teachers").update({
        first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim(),
        email: email.trim(), bio: bio.trim(), telegram_id: telegramId.trim(),
        direction_ids: selectedDirections, discount_percent: discountPercent, photo_url: photoUrl,
      }).eq("id", teacher.id);
      if (error) { toast.error("Ошибка"); return; }
      toast.success("Сохранено");
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!teacher) return;
    const { data: classes } = await supabase.from("schedule_classes").select("id").eq("teacher_id", teacher.id);
    if (classes && classes.length > 0) {
      const classIds = classes.map(c => c.id);
      await supabase.from("bookings").delete().in("class_id", classIds);
      await supabase.from("schedule_classes").delete().eq("teacher_id", teacher.id);
    }
    if (teacher.photo_url) {
      const fileName = teacher.photo_url.split("/").pop()?.split("?")[0];
      if (fileName) await supabase.storage.from("teacher-photos").remove([fileName]);
    }
    const { error } = await supabase.from("teachers").delete().eq("id", teacher.id);
    if (error) { toast.error("Ошибка"); return; }
    toast.success("Преподаватель удалён");
    navigate("/admin/teachers");
  };

  const openDeduct = async () => {
    if (!teacher?.user_id) { toast.error("Нет привязанного аккаунта"); return; }
    const { data } = await supabase.from("user_subscriptions").select("*, subscription_types(*)").eq("user_id", teacher.user_id).eq("active", true).gt("hours_remaining", 0);
    const individual = (data || []).map((s: any) => ({ ...s, type: s.subscription_types })).filter((s: any) => s.type?.type && s.type.type !== 'group');
    if (individual.length === 0) { toast.error("Нет активных индивидуальных абонементов"); return; }
    setDeductSubs(individual);
    setDeductSubId(individual[0].id);
    setDeductHours("1");
    setDeductOpen(true);
  };

  if (loading || !teacher) return <div className="text-admin-muted p-8">Загрузка…</div>;

  return (
    <div className="space-y-4">
      <Button variant="ghost" className="text-admin-muted gap-1 -ml-2" onClick={() => navigate("/admin/teachers")}>
        <ArrowLeft className="h-4 w-4" /> Назад к списку
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Profile info */}
        <Card className="bg-white border-admin-border shadow-sm lg:col-span-1">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-3">
                {teacher.photo_url ? <AvatarImage src={teacher.photo_url} /> : null}
                <AvatarFallback className="bg-admin-accent/20 text-3xl font-bold text-admin-foreground">
                  {teacher.first_name[0]}{teacher.last_name?.[0] || ""}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold text-admin-foreground">{teacher.first_name} {teacher.last_name}</h2>
              {!teacher.active && <Badge className="bg-gray-200 text-gray-600 mt-1">Деактивирован</Badge>}
            </div>

            <div className="space-y-2 text-sm">
              {teacher.phone && <div><span className="text-admin-muted">Телефон:</span> <a href={`tel:${teacher.phone}`} className="text-blue-600 hover:underline">{teacher.phone}</a></div>}
              {teacher.email && <div><span className="text-admin-muted">Email:</span> <span>{teacher.email}</span></div>}
              {teacher.telegram_id && <div><span className="text-admin-muted">Telegram:</span> <span>{teacher.telegram_id}</span></div>}
              <div><span className="text-admin-muted">Скидка:</span> <span className="font-medium">{teacher.discount_percent ?? 20}%</span></div>
            </div>

            <div>
              <span className="text-xs text-admin-muted font-medium">Направления</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {teacher.direction_ids.map((dId: string) => {
                  const dir = getDirection(dId);
                  return dir ? <Badge key={dId} variant="outline" style={{ borderColor: dir.color, color: dir.color }} className="text-xs">{dir.name}</Badge> : null;
                })}
                {teacher.direction_ids.length === 0 && <span className="text-xs text-admin-muted">—</span>}
              </div>
            </div>

            {teacher.bio && (
              <div>
                <span className="text-xs text-admin-muted font-medium">Био</span>
                <p className="text-sm mt-1">{teacher.bio}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-admin-border">
              <div className="flex items-center gap-2 w-full mb-2">
                <label className="text-xs text-admin-muted">Показывать на сайте</label>
                <button
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${teacher.seen_by_admin ? 'bg-green-500' : 'bg-gray-300'}`}
                  onClick={async () => {
                    const newVal = !teacher.seen_by_admin;
                    await supabase.from("teachers").update({ seen_by_admin: newVal }).eq("id", teacher.id);
                    setTeacher((prev: any) => ({ ...prev, seen_by_admin: newVal }));
                    toast.success(newVal ? "Преподаватель отображается на сайте" : "Преподаватель скрыт с сайта");
                  }}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${teacher.seen_by_admin ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <Button size="sm" className="bg-admin-accent text-black hover:bg-yellow-400" onClick={openEdit}>Редактировать</Button>
              <Button size="sm" variant="outline" className="border-admin-border" onClick={openDeduct}><Minus className="h-3.5 w-3.5 mr-1" /> Списать часы</Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Удалить</Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Salary stats */}
        <Card className="bg-white border-admin-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-admin-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Зарплата / Часы
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {stats.length === 0 ? (
              <p className="text-sm text-admin-muted">Нет данных о занятиях</p>
            ) : stats.map(s => {
              const monthId = s.month;
              const isOpen = expandedMonths[monthId];
              return (
                <div key={s.month} className="space-y-0.5">
                  <button onClick={() => setExpandedMonths(p => ({ ...p, [monthId]: !p[monthId] }))} className="flex items-center justify-between w-full text-sm hover:bg-muted/50 rounded px-2 py-1.5">
                    <span className="flex items-center gap-1 text-admin-muted">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      {s.month}
                    </span>
                    <span className="flex gap-4">
                      <span className="flex items-center gap-1 text-admin-foreground"><Clock className="h-3.5 w-3.5" />{s.hours}ч</span>
                      <span className="font-medium text-emerald-600">{s.salary.toLocaleString('ru-RU')} ₽</span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="ml-4 border-l-2 border-admin-border pl-3 space-y-0.5">
                      {s.days.map(day => {
                        const dayId = `${monthId}-${day.date}`;
                        const isDayOpen = expandedDays[dayId];
                        return (
                          <div key={day.date}>
                            <button onClick={() => setExpandedDays(p => ({ ...p, [dayId]: !p[dayId] }))} className="flex items-center justify-between w-full text-xs hover:bg-muted/50 rounded px-1 py-0.5">
                              <span className="flex items-center gap-1 text-admin-muted">
                                {isDayOpen ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                                {day.date}
                              </span>
                              <span className="flex gap-3">
                                <span className="text-admin-foreground">{day.hours}ч</span>
                                <span className="font-medium text-emerald-600">{day.salary.toLocaleString('ru-RU')} ₽</span>
                              </span>
                            </button>
                            {isDayOpen && (
                              <div className="ml-3 border-l border-admin-border/50 pl-2 space-y-0.5">
                                {day.classes.map((cl, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs px-1 py-0.5 text-admin-muted">
                                    <span>{cl.time} · {cl.direction} · {cl.students} уч.</span>
                                    <span className="font-medium text-emerald-600">{cl.salary.toLocaleString('ru-RU')} ₽</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Редактировать преподавателя</DialogTitle></DialogHeader>
          <div className="grid gap-3 overflow-y-auto flex-1 pr-1">
            <div>
              <Label>Фото</Label>
              <div className="mt-1 flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {photoPreview ? <AvatarImage src={photoPreview} /> : null}
                  <AvatarFallback className="bg-admin-accent/20 text-2xl font-bold">{firstName?.[0] || "?"}{lastName?.[0] || ""}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
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
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleSave} disabled={uploading}>{uploading ? "Загрузка…" : "Сохранить"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить преподавателя навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              {teacher.first_name} {teacher.last_name} будет удалён без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Удалить навсегда</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deduct Dialog */}
      <Dialog open={deductOpen} onOpenChange={setDeductOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-sm">
          <DialogHeader><DialogTitle>Списать часы</DialogTitle></DialogHeader>
          {deductSubs.length > 0 && (
            <div className="space-y-3">
              {deductSubs.length > 1 && (
                <div>
                  <Label>Абонемент</Label>
                  <select className="w-full mt-1 rounded-md border border-admin-border bg-white px-3 py-2 text-sm" value={deductSubId} onChange={e => setDeductSubId(e.target.value)}>
                    {deductSubs.map((s: any) => <option key={s.id} value={s.id}>{s.type?.name} ({s.hours_remaining}/{s.hours_total} ч)</option>)}
                  </select>
                </div>
              )}
              {(() => { const sel = deductSubs.find((s: any) => s.id === deductSubId); return sel ? <p className="text-sm text-admin-muted">Остаток: <span className="font-medium text-admin-foreground">{sel.hours_remaining}/{sel.hours_total} ч</span></p> : null; })()}
              <div>
                <Label>Часов для списания</Label>
                <Input type="number" min={0.5} step={0.5} className="bg-white border-admin-border mt-1" value={deductHours} onChange={e => setDeductHours(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeductOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-orange-500 text-white hover:bg-orange-600" onClick={async () => {
              const sel = deductSubs.find((s: any) => s.id === deductSubId);
              if (!sel) return;
              const hrs = parseFloat(deductHours);
              if (!hrs || hrs <= 0) { toast.error("Введите часы"); return; }
              if (hrs > Number(sel.hours_remaining)) { toast.error("Недостаточно часов"); return; }
              const newR = Number(sel.hours_remaining) - hrs;
              const { error } = await supabase.from("user_subscriptions").update({ hours_remaining: newR, active: newR > 0 }).eq("id", sel.id);
              if (error) { toast.error("Ошибка"); return; }
              toast.success(`Списано ${hrs} ч`);
              setDeductOpen(false);
            }}>Списать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
