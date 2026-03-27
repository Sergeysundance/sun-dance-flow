import { useState, useEffect } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Teacher = Tables<"teachers">;
type Direction = Tables<"directions">;

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);

  const isEditing = !!editTeacher;

  const fetchData = async () => {
    const [tRes, dRes] = await Promise.all([
      supabase.from("teachers").select("*").order("created_at", { ascending: false }),
      supabase.from("directions").select("*").order("sort_order"),
    ]);
    if (tRes.data) setTeachers(tRes.data);
    if (dRes.data) setDirections(dRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getDirection = (id: string) => directions.find(d => d.id === id);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setBio("");
    setTelegramId("");
    setSelectedDirections([]);
  };

  const openNew = () => {
    setEditTeacher(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditTeacher(t);
    setFirstName(t.first_name);
    setLastName(t.last_name);
    setPhone(t.phone);
    setEmail(t.email);
    setBio(t.bio);
    setTelegramId(t.telegram_id);
    setSelectedDirections([...t.direction_ids]);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast.error("Введите имя преподавателя");
      return;
    }

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      bio: bio.trim(),
      telegram_id: telegramId.trim(),
      direction_ids: selectedDirections,
    };

    if (isEditing && editTeacher) {
      const { error } = await supabase.from("teachers").update(payload).eq("id", editTeacher.id);
      if (error) { toast.error("Ошибка при обновлении"); return; }
      toast.success("Преподаватель обновлён");
    } else {
      const { error } = await supabase.from("teachers").insert(payload);
      if (error) { toast.error("Ошибка при создании"); return; }
      toast.success("Преподаватель создан");
    }

    setDialogOpen(false);
    resetForm();
    setEditTeacher(null);
    fetchData();
  };

  const handleDeactivate = async (t: Teacher) => {
    const { error } = await supabase.from("teachers").update({ active: !t.active }).eq("id", t.id);
    if (error) { toast.error("Ошибка"); return; }
    toast.success(t.active ? "Преподаватель деактивирован" : "Преподаватель активирован");
    fetchData();
  };

  const toggleDirection = (dirId: string) => {
    setSelectedDirections(prev =>
      prev.includes(dirId) ? prev.filter(id => id !== dirId) : [...prev, dirId]
    );
  };

  if (loading) return <div className="text-admin-muted p-8">Загрузка…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={openNew} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый преподаватель</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teachers.map(t => (
          <Card key={t.id} className="bg-white border-admin-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-accent/20 text-lg font-bold text-admin-foreground">
                    {t.first_name[0]}{t.last_name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-admin-foreground">{t.first_name} {t.last_name}</div>
                    <div className="text-xs text-admin-muted">{t.phone}</div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-admin-muted"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(t)}>Редактировать</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeactivate(t)}>
                      {t.active ? "Деактивировать" : "Активировать"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.direction_ids.map(dId => {
                  const dir = getDirection(dId);
                  return dir ? <Badge key={dId} variant="outline" style={{ borderColor: dir.color, color: dir.color }} className="text-xs">{dir.name}</Badge> : null;
                })}
              </div>
              <p className="mt-2 text-xs text-admin-muted line-clamp-2">{t.bio}</p>
              <Badge className={t.active ? "bg-green-100 text-green-800 mt-2" : "bg-gray-100 text-gray-800 mt-2"}>{t.active ? 'Активен' : 'Неактивен'}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md max-h-[85vh]">
          <DialogHeader><DialogTitle className="text-admin-foreground">{isEditing ? "Редактировать преподавателя" : "Новый преподаватель"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleSave}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
