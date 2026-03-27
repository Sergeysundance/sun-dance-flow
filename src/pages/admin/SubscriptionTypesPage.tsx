import { useState, useEffect } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const typeLabels: Record<string, string> = {
  group: "Групповой", individual_solo: "Индивидуальный соло",
  individual_duo: "Индивидуальный дуэт", trial: "Пробный", single: "Разовый",
};
const typeColors: Record<string, string> = {
  group: "bg-blue-100 text-blue-800", individual_solo: "bg-purple-100 text-purple-800",
  individual_duo: "bg-purple-100 text-purple-800", trial: "bg-green-100 text-green-800",
  single: "bg-gray-100 text-gray-800",
};

const emptyForm = {
  name: "", description: "", class_count: "" as string, duration_days: "30",
  class_duration: "60", price: "", old_price: "", type: "group", active: true,
};

export default function SubscriptionTypesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const { data } = await supabase.from("subscription_types").select("*").order("created_at", { ascending: true });
    setItems(data || []);
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setForm({
      name: item.name, description: item.description || "",
      class_count: item.class_count?.toString() || "",
      duration_days: item.duration_days?.toString() || "30",
      class_duration: item.class_duration?.toString() || "60",
      price: item.price?.toString() || "", old_price: item.old_price?.toString() || "",
      type: item.type || "group", active: item.active,
    });
    setEditId(item.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.duration_days) {
      toast.error("Заполните обязательные поля"); return;
    }
    setLoading(true);
    const payload = {
      name: form.name, description: form.description,
      class_count: form.class_count ? parseInt(form.class_count) : null,
      duration_days: parseInt(form.duration_days),
      class_duration: parseInt(form.class_duration),
      price: parseInt(form.price),
      old_price: form.old_price ? parseInt(form.old_price) : null,
      type: form.type, active: form.active,
    };

    if (editId) {
      const { error } = await supabase.from("subscription_types").update(payload).eq("id", editId);
      if (error) toast.error("Ошибка сохранения");
      else toast.success("Тип абонемента обновлён");
    } else {
      const { error } = await supabase.from("subscription_types").insert(payload);
      if (error) toast.error("Ошибка создания");
      else toast.success("Тип абонемента создан");
    }
    setLoading(false);
    setDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (item: any) => {
    await supabase.from("subscription_types").update({ active: !item.active }).eq("id", item.id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("subscription_types").delete().eq("id", id);
    if (error) toast.error("Ошибка удаления");
    else { toast.success("Удалено"); fetchData(); }
  };

  const formatPrice = (p: number) => p.toLocaleString("ru-RU") + " ₽";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={openNew} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1">
          <Plus className="h-4 w-4" /> Новый тип
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-admin-border bg-gray-50 text-left text-xs font-medium text-admin-muted">
              <th className="px-4 py-3">Название</th>
              <th className="px-4 py-3">Занятий</th>
              <th className="px-4 py-3">Срок</th>
              <th className="px-4 py-3">Длительность</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3">Старая цена</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Активен</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((st, i) => (
              <tr key={st.id} className={`border-b border-admin-border last:border-0 hover:bg-gray-50 ${i % 2 === 1 ? "bg-gray-50/50" : ""}`}>
                <td className="px-4 py-3 font-medium text-admin-foreground">{st.name}</td>
                <td className="px-4 py-3">{st.class_count ?? "∞"}</td>
                <td className="px-4 py-3">{st.duration_days} дн.</td>
                <td className="px-4 py-3">{st.class_duration} мин</td>
                <td className="px-4 py-3 font-medium text-admin-foreground">{formatPrice(st.price)}</td>
                <td className="px-4 py-3 text-admin-muted">
                  {st.old_price ? <span className="line-through">{formatPrice(st.old_price)}</span> : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={typeColors[st.type] || "bg-gray-100 text-gray-800"}>
                    {typeLabels[st.type] || st.type}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Switch checked={st.active} onCheckedChange={() => toggleActive(st)} />
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-admin-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(st)}>Редактировать</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(st.id)}>Удалить</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-admin-muted">Нет типов абонементов</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-admin-foreground">
              {editId ? "Редактировать тип абонемента" : "Новый тип абонемента"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Название *</Label>
              <Input className="bg-white border-admin-border" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea className="bg-white border-admin-border" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Кол-во занятий</Label>
                <Input type="number" placeholder="Пусто = безлимит" className="bg-white border-admin-border" value={form.class_count} onChange={(e) => setForm({ ...form, class_count: e.target.value })} />
              </div>
              <div>
                <Label>Срок (дней) *</Label>
                <Input type="number" className="bg-white border-admin-border" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Длительность</Label>
              <Select value={form.class_duration} onValueChange={(v) => setForm({ ...form, class_duration: v })}>
                <SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60 мин</SelectItem>
                  <SelectItem value="90">90 мин</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Цена *</Label>
                <Input type="number" className="bg-white border-admin-border" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <Label>Старая цена</Label>
                <Input type="number" className="bg-white border-admin-border" value={form.old_price} onChange={(e) => setForm({ ...form, old_price: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Тип</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Групповой</SelectItem>
                  <SelectItem value="individual_solo">Индивидуальный соло</SelectItem>
                  <SelectItem value="individual_duo">Индивидуальный дуэт</SelectItem>
                  <SelectItem value="trial">Пробный</SelectItem>
                  <SelectItem value="single">Разовый</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={handleSave} disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
