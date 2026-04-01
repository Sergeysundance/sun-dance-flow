import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const presetColors = ['#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];

type Room = Tables<"rooms">;

const emptyForm = { name: "", capacity: 20, area: 0, color: "#3B82F6", active: true };

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRooms = async () => {
    const { data } = await supabase.from("rooms").select("*").order("name");
    if (data) setRooms(data);
  };

  useEffect(() => { fetchRooms(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (r: Room) => {
    setEditing(r);
    setForm({ name: r.name, capacity: r.capacity, area: r.area, color: r.color, active: r.active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("rooms").update(form).eq("id", editing.id);
      if (error) { toast.error("Ошибка сохранения"); } else { toast.success("Зал обновлён"); }
    } else {
      const { error } = await supabase.from("rooms").insert(form);
      if (error) { toast.error("Ошибка создания"); } else { toast.success("Зал создан"); }
    }
    setSaving(false);
    setDialogOpen(false);
    fetchRooms();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый зал</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map(r => (
          <Card key={r.id} className="bg-white border-admin-border shadow-sm overflow-hidden">
            <div className="h-2" style={{ backgroundColor: r.color }} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-admin-foreground">{r.name}</h3>
                  <div className="mt-1 space-y-0.5 text-sm text-admin-muted">
                    <div>Вместимость: {r.capacity} чел.</div>
                    <div>Площадь: {r.area} м²</div>
                  </div>
                </div>
                <Badge className={r.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{r.active ? 'Активен' : 'Неактивен'}</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="border-admin-border" onClick={() => openEdit(r)}>Редактировать</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md">
          <DialogHeader><DialogTitle className="text-admin-foreground">{editing ? "Редактировать зал" : "Новый зал"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Название *</Label><Input className="bg-white border-admin-border" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Вместимость *</Label><Input type="number" className="bg-white border-admin-border" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} /></div>
              <div><Label>Площадь (м²)</Label><Input type="number" className="bg-white border-admin-border" value={form.area} onChange={e => setForm(f => ({ ...f, area: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>Цвет</Label>
              <Select value={form.color} onValueChange={v => setForm(f => ({ ...f, color: v }))}>
                <SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger>
                <SelectContent>{presetColors.map(c => <SelectItem key={c} value={c}><span className="inline-block h-3 w-3 rounded-full mr-2" style={{ backgroundColor: c }} />{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} /><Label>Активен</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleSave} disabled={saving}>{saving ? "Сохранение..." : "Сохранить"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
