import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, MoreHorizontal, Trash2, Upload, X, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";

export default function TeachersPage() {
  const { selectedBranchId } = useBranch();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [directions, setDirections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<any | null>(null);
  const [deactivateTeacher, setDeactivateTeacher] = useState<any | null>(null);
  const [deleteTeacher, setDeleteTeacher] = useState<any | null>(null);
  const [teacherStats, setTeacherStats] = useState<Record<string, { month: string; hours: number; salary: number }[]>>({});

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState(20);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editTeacher;

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
    fetchAllTeacherStats(allTeachers);
  };

  const fetchAllTeacherStats = useCallback(async (teacherList: any[]) => {
    if (teacherList.length === 0) return;
    const teacherIds = teacherList.map(t => t.id);
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

    const { data: allClasses } = await supabase
      .from("schedule_classes")
      .select("id, date, start_time, end_time, teacher_id")
      .in("teacher_id", teacherIds)
      .eq("cancelled", false)
      .lte("date", new Date().toISOString().split("T")[0]);

    if (!allClasses || allClasses.length === 0) { setTeacherStats({}); return; }

    const classIds = allClasses.map(c => c.id);
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("id, class_id, user_id")
      .in("class_id", classIds);

    const userIds = [...new Set((allBookings || []).map(b => b.user_id))];
    let typesMap = new Map<string, any>();
    let subsMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: userSubs } = await supabase
        .from("user_subscriptions")
        .select("id, user_id, subscription_type_id, hours_total")
        .in("user_id", userIds);

      const typeIds = [...new Set((userSubs || []).map(s => s.subscription_type_id))];
      const { data: subTypes } = await supabase
        .from("subscription_types")
        .select("id, price, hours_count")
        .in("id", typeIds.length > 0 ? typeIds : ["__none__"]);

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

    const result: Record<string, Record<string, { hours: number; salary: number }>> = {};

    for (const cls of allClasses) {
      const dt = new Date(cls.date);
      const key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, '0')}`;
      if (!result[cls.teacher_id]) result[cls.teacher_id] = {};
      if (!result[cls.teacher_id][key]) result[cls.teacher_id][key] = { hours: 0, salary: 0 };

      const [sh, sm] = cls.start_time.split(':').map(Number);
      const [eh, em] = cls.end_time.split(':').map(Number);
      const durationHours = (eh * 60 + em - sh * 60 - sm) / 60;
      result[cls.teacher_id][key].hours += durationHours;

      let classRevenue = 0;
      const classBookings = bookingsByClass[cls.id] || [];
      for (const b of classBookings) {
        const sub = subsMap.get(b.user_id);
        if (sub) {
          const subType = typesMap.get(sub.subscription_type_id);
          if (subType && subType.hours_count && subType.hours_count > 0) {
            const hourlyRate = subType.price / subType.hours_count;
            classRevenue += hourlyRate * durationHours;
          }
        }
      }
      result[cls.teacher_id][key].salary += (classRevenue * 0.95) / 2;
    }

    const statsMap: Record<string, { month: string; hours: number; salary: number }[]> = {};
    for (const [tid, grouped] of Object.entries(result)) {
      statsMap[tid] = Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 6)
        .map(([k, data]) => {
          const [y, m] = k.split('-');
          return { month: `${monthNames[parseInt(m)]} ${y}`, hours: Math.round(data.hours * 10) / 10, salary: Math.round(data.salary) };
        });
    }
    setTeacherStats(statsMap);
  }, []);

  useEffect(() => { fetchData(); }, [selectedBranchId]);

  const activeTeachers = teachers.filter(t => t.active);
  const inactiveTeachers = teachers.filter(t => !t.active);

  const getDirection = (id: string) => directions.find(d => d.id === id);

  const resetForm = () => {
    setFirstName(""); setLastName(""); setPhone(""); setEmail(""); setBio(""); setTelegramId(""); setSelectedDirections([]); setDiscountPercent(20);
    setPhotoFile(null); setPhotoPreview("");
  };

  const openNew = () => { setEditTeacher(null); resetForm(); setDialogOpen(true); };

  const openEdit = (t: any) => {
    setEditTeacher(t); setFirstName(t.first_name); setLastName(t.last_name); setPhone(t.phone); setEmail(t.email); setBio(t.bio); setTelegramId(t.telegram_id); setSelectedDirections([...t.direction_ids]); setDiscountPercent(t.discount_percent ?? 20);
    setPhotoFile(null);
    setPhotoPreview(t.photo_url || "");
    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Выберите изображение"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл слишком большой (макс. 5 МБ)"); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadPhoto = async (teacherId: string): Promise<string> => {
    if (!photoFile) return photoPreview; // keep existing URL or empty
    const ext = photoFile.name.split(".").pop();
    const path = `${teacherId}.${ext}`;
    const { error } = await supabase.storage.from("teacher-photos").upload(path, photoFile, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("teacher-photos").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSave = async () => {
    if (!firstName.trim()) { toast.error("Введите имя преподавателя"); return; }
    setUploading(true);
    try {
      const payload: any = { first_name: firstName.trim(), last_name: lastName.trim(), phone: phone.trim(), email: email.trim(), bio: bio.trim(), telegram_id: telegramId.trim(), direction_ids: selectedDirections, discount_percent: discountPercent };

      if (isEditing && editTeacher) {
        let branchIds = [...(editTeacher.branch_ids || [])];
        if (selectedBranchId && !branchIds.includes(selectedBranchId)) branchIds.push(selectedBranchId);
        payload.branch_ids = branchIds;

        const photoUrl = await uploadPhoto(editTeacher.id);
        payload.photo_url = photoUrl;

        const { error } = await supabase.from("teachers").update(payload).eq("id", editTeacher.id);
        if (error) { toast.error("Ошибка при обновлении"); return; }
        toast.success("Преподаватель обновлён");
      } else {
        payload.branch_ids = selectedBranchId ? [selectedBranchId] : [];
        // Insert first to get id, then upload photo
        const { data, error } = await supabase.from("teachers").insert(payload).select("id").single();
        if (error) { toast.error("Ошибка при создании"); return; }
        if (photoFile && data) {
          const photoUrl = await uploadPhoto(data.id);
          await supabase.from("teachers").update({ photo_url: photoUrl }).eq("id", data.id);
        }
        toast.success("Преподаватель создан");
      }
      setDialogOpen(false); resetForm(); setEditTeacher(null); fetchData();
    } catch (err: any) {
      toast.error("Ошибка загрузки фото: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeactivate = async (t: any) => {
    const { error } = await supabase.from("teachers").update({ active: !t.active }).eq("id", t.id);
    if (error) { toast.error("Ошибка"); return; }
    toast.success(t.active ? "Преподаватель деактивирован" : "Преподаватель активирован");
    fetchData();
  };

  const handleDelete = async (t: any) => {
    const { data: classes } = await supabase.from("schedule_classes").select("id").eq("teacher_id", t.id);
    if (classes && classes.length > 0) {
      const classIds = classes.map(c => c.id);
      await supabase.from("bookings").delete().in("class_id", classIds);
      await supabase.from("schedule_classes").delete().eq("teacher_id", t.id);
    }
    // Delete photo from storage
    if (t.photo_url) {
      const fileName = t.photo_url.split("/").pop()?.split("?")[0];
      if (fileName) await supabase.storage.from("teacher-photos").remove([fileName]);
    }
    const { error } = await supabase.from("teachers").delete().eq("id", t.id);
    if (error) { toast.error("Ошибка при удалении: " + error.message); return; }
    toast.success("Преподаватель удалён");
    fetchData();
  };

  const toggleDirection = (dirId: string) => {
    setSelectedDirections(prev => prev.includes(dirId) ? prev.filter(id => id !== dirId) : [...prev, dirId]);
  };

  const renderTeacherCard = (t: any) => (
    <Card key={t.id} className="bg-white border-admin-border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {t.photo_url ? (
                <AvatarImage src={t.photo_url} alt={`${t.first_name} ${t.last_name}`} />
              ) : null}
              <AvatarFallback className="bg-admin-accent/20 text-lg font-bold text-admin-foreground">
                {t.first_name[0]}{t.last_name?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-admin-foreground">{t.first_name} {t.last_name}</div>
              <div className="text-xs text-admin-muted">{t.phone}</div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-admin-muted"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(t)}>Редактировать</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeactivateTeacher(t)}>
                {t.active ? "Деактивировать" : "Активировать"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => setDeleteTeacher(t)}>
                <Trash2 className="h-4 w-4 mr-1" /> Удалить навсегда
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-3 flex flex-wrap gap-1">
          {t.direction_ids.map((dId: string) => {
            const dir = getDirection(dId);
            return dir ? <Badge key={dId} variant="outline" style={{ borderColor: dir.color, color: dir.color }} className="text-xs">{dir.name}</Badge> : null;
          })}
        </div>
        <p className="mt-2 text-xs text-admin-muted line-clamp-2">{t.bio}</p>
        {(t.discount_percent != null && t.discount_percent !== 20) ? (
          <p className="mt-1 text-xs font-medium text-admin-accent">Скидка: {t.discount_percent}%</p>
        ) : (
          <p className="mt-1 text-xs text-admin-muted">Скидка: {t.discount_percent ?? 20}%</p>
        )}
        {/* Monthly salary stats */}
        {teacherStats[t.id] && teacherStats[t.id].length > 0 && (
          <div className="mt-3 border-t border-admin-border pt-2 space-y-1">
            <div className="flex items-center gap-1 text-xs font-semibold text-admin-foreground mb-1">
              <DollarSign className="h-3.5 w-3.5" /> Зарплата / Часы
            </div>
            {teacherStats[t.id].map(s => (
              <div key={s.month} className="flex items-center justify-between text-xs">
                <span className="text-admin-muted">{s.month}</span>
                <span className="flex gap-3">
                  <span className="flex items-center gap-0.5 text-admin-foreground"><Clock className="h-3 w-3" />{s.hours}ч</span>
                  <span className="font-medium text-green-600">{s.salary.toLocaleString('ru-RU')} ₽</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) return <div className="text-admin-muted p-8">Загрузка…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={openNew} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый преподаватель</Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Активные ({activeTeachers.length})</TabsTrigger>
          <TabsTrigger value="inactive">Деактивированные ({inactiveTeachers.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {activeTeachers.length === 0 ? (
            <p className="text-admin-muted text-sm py-8 text-center">Нет активных преподавателей в этом филиале</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{activeTeachers.map(renderTeacherCard)}</div>
          )}
        </TabsContent>
        <TabsContent value="inactive">
          {inactiveTeachers.length === 0 ? (
            <p className="text-admin-muted text-sm py-8 text-center">Нет деактивированных преподавателей</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{inactiveTeachers.map(renderTeacherCard)}</div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle className="text-admin-foreground">{isEditing ? "Редактировать преподавателя" : "Новый преподаватель"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 overflow-y-auto flex-1 pr-1">
            {/* Photo upload */}
            <div>
              <Label>Фото</Label>
              <div className="mt-1 flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {photoPreview ? <AvatarImage src={photoPreview} alt="Preview" /> : null}
                  <AvatarFallback className="bg-admin-accent/20 text-2xl font-bold text-admin-foreground">
                    {firstName?.[0] || "?"}{lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                  <Button type="button" variant="outline" size="sm" className="border-admin-border gap-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Загрузить
                  </Button>
                  {photoPreview && (
                    <Button type="button" variant="ghost" size="sm" className="text-red-500 gap-1" onClick={removePhoto}>
                      <X className="h-3.5 w-3.5" /> Удалить
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Имя *</Label><Input className="bg-white border-admin-border" value={firstName} onChange={e => setFirstName(e.target.value)} /></div>
              <div><Label>Фамилия *</Label><Input className="bg-white border-admin-border" value={lastName} onChange={e => setLastName(e.target.value)} /></div>
            </div>
            <div><Label>Телефон</Label><Input className="bg-white border-admin-border" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" className="bg-white border-admin-border" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label>Био</Label><Textarea className="bg-white border-admin-border" value={bio} onChange={e => setBio(e.target.value)} /></div>
            <div>
              <Label>Направления</Label>
              <div className="mt-1 space-y-2">
                {directions.map(d => (
                  <div key={d.id} className="flex items-center gap-2">
                    <Checkbox id={`dir-${d.id}`} checked={selectedDirections.includes(d.id)} onCheckedChange={() => toggleDirection(d.id)} />
                    <label htmlFor={`dir-${d.id}`} className="text-sm text-admin-foreground">{d.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div><Label>Telegram ID</Label><Input className="bg-white border-admin-border" value={telegramId} onChange={e => setTelegramId(e.target.value)} /></div>
            <div>
              <Label>Скидка на абонементы (%)</Label>
              <Input type="number" min={0} max={100} className="bg-white border-admin-border" value={discountPercent} onChange={e => setDiscountPercent(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} />
              <p className="text-xs text-admin-muted mt-1">Применяется при покупке абонемента через личный кабинет преподавателя</p>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleSave} disabled={uploading}>
              {uploading ? "Загрузка…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate/Activate Dialog */}
      <AlertDialog open={!!deactivateTeacher} onOpenChange={(open) => { if (!open) setDeactivateTeacher(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{deactivateTeacher?.active ? "Деактивировать преподавателя?" : "Активировать преподавателя?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateTeacher?.active
                ? `${deactivateTeacher.first_name} ${deactivateTeacher.last_name} будет деактивирован и не будет отображаться в расписании.`
                : `${deactivateTeacher?.first_name} ${deactivateTeacher?.last_name} будет снова активирован.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className={deactivateTeacher?.active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              onClick={() => { if (deactivateTeacher) handleDeactivate(deactivateTeacher); setDeactivateTeacher(null); }}
            >
              {deactivateTeacher?.active ? "Деактивировать" : "Активировать"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Forever Dialog */}
      <AlertDialog open={!!deleteTeacher} onOpenChange={(open) => { if (!open) setDeleteTeacher(null); }}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить преподавателя навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTeacher?.first_name} {deleteTeacher?.last_name} будет удалён без возможности восстановления. Все связанные данные будут потеряны.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (deleteTeacher) handleDelete(deleteTeacher); setDeleteTeacher(null); }}
            >
              Удалить навсегда
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
