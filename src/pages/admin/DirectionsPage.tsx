import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const presetColors = [
  '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#10B981', '#3B82F6',
  '#F97316', '#14B8A6', '#A855F7', '#E11D48', '#0EA5E9', '#84CC16', '#D946EF',
  '#FACC15', '#64748B', '#FB923C', '#2DD4BF', '#818CF8', '#F43F5E',
];

type Direction = Tables<"directions">;

const emptyForm = { name: "", description: "", color: "#3B82F6", sort_order: 0, active: true };

export default function DirectionsPage() {
  const [directions, setDirections] = useState<Direction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Direction | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchDirections = async () => {
    const { data } = await supabase.from("directions").select("*").order("sort_order");
    if (data) setDirections(data);
  };

  useEffect(() => { fetchDirections(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (d: Direction) => {
    setEditing(d);
    setForm({ name: d.name, description: d.description, color: d.color, sort_order: d.sort_order, active: d.active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название"); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("directions").update(form).eq("id", editing.id);
      if (error) toast.error("Ошибка сохранения");
      else toast.success("Направление обновлено");
    } else {
      const { error } = await supabase.from("directions").insert(form);
      if (error) toast.error("Ошибка создания");
      else toast.success("Направление создано");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchDirections();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1">
          <Plus className="h-4 w-4" /> Новое направление
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {directions.map(d => (
          <Card key={d.id} className="bg-white border-admin-border shadow-sm overflow-hidden">
            <div className="h-2" style={{ backgroundColor: d.color }} />
            <CardContent className="p-5">
              <div className="mb-2 h-24 rounded-md bg-gray-100 flex items-center justify-center text-xs text-admin-muted">фото</div>
              <h3 className="text-lg font-semibold text-admin-foreground">{d.name}</h3>
              <p className="mt-1 text-sm text-admin-muted line-clamp-2">{d.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <Badge className={d.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                  {d.active ? 'Активно' : 'Скрыто'}
                </Badge>
                <Button variant="outline" size="sm" className="border-admin-border" onClick={() => openEdit(d)}>
                  Редактировать
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-admin-foreground">
              {editing ? "Редактировать направление" : "Новое направление"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Название *</Label>
              <Input className="bg-white border-admin-border" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea className="bg-white border-admin-border" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Цвет</Label>
              <Select value={form.color} onValueChange={v => setForm(f => ({ ...f, color: v }))}>
                <SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {presetColors.map(c => (
                    <SelectItem key={c} value={c}>
                      <span className="inline-block h-3 w-3 rounded-full mr-2" style={{ backgroundColor: c }} />{c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Порядок отображения</Label>
              <Input type="number" className="bg-white border-admin-border" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Активно</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleSave} disabled={saving}>
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
