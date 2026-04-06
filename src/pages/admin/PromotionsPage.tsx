import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_percent: number;
  active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export default function PromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [form, setForm] = useState({ name: "", description: "", discount_percent: 0, starts_at: "", ends_at: "" });

  const fetchData = async () => {
    const { data } = await supabase
      .from("promotions")
      .select("*")
      .order("sort_order");
    if (data) setItems(data as Promotion[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", discount_percent: 0, starts_at: "", ends_at: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: Promotion) => {
    setEditing(item);
    setForm({
      name: item.name,
      description: item.description,
      discount_percent: item.discount_percent,
      starts_at: item.starts_at || "",
      ends_at: item.ends_at || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Введите название акции"); return; }
    if (form.discount_percent < 0 || form.discount_percent > 100) { toast.error("Скидка должна быть от 0 до 100%"); return; }

    const payload = {
      name: form.name,
      description: form.description,
      discount_percent: form.discount_percent,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };

    if (editing) {
      const { error } = await supabase.from("promotions").update(payload).eq("id", editing.id);
      if (error) toast.error("Ошибка сохранения"); else toast.success("Акция обновлена");
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
      const { error } = await supabase.from("promotions").insert({ ...payload, sort_order: maxOrder });
      if (error) toast.error("Ошибка создания"); else toast.success("Акция добавлена");
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleToggle = async (item: Promotion) => {
    await supabase.from("promotions").update({ active: !item.active }).eq("id", item.id);
    toast.success(item.active ? "Акция скрыта" : "Акция активирована");
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("promotions").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Ошибка удаления"); else toast.success("Акция удалена");
    setDeleteTarget(null);
    fetchData();
  };

  if (loading) return <p className="text-admin-muted">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-admin-muted">{items.length} акций</p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Добавить акцию
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-admin-muted border-admin-border bg-white">
          <p className="text-lg font-medium">Нет акций</p>
          <p className="text-sm">Добавьте первую акцию или скидку</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Card key={item.id} className={`flex items-start gap-3 p-4 border-admin-border bg-white ${!item.active ? "opacity-50" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-admin-foreground text-sm">{item.name}</p>
                  <span className="rounded-sm bg-admin-accent px-2 py-0.5 text-xs font-bold text-black">
                    -{item.discount_percent}%
                  </span>
                </div>
                <p className="text-xs text-admin-muted mt-1 line-clamp-2">{item.description}</p>
                {(item.starts_at || item.ends_at) && (
                  <p className="text-xs text-admin-muted mt-1">
                    {item.starts_at && `с ${new Date(item.starts_at).toLocaleDateString("ru-RU")}`}
                    {item.starts_at && item.ends_at && " "}
                    {item.ends_at && `до ${new Date(item.ends_at).toLocaleDateString("ru-RU")}`}
                    {!item.ends_at && " — бессрочно"}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleToggle(item)} title={item.active ? "Скрыть" : "Показать"}>
                  {item.active ? <Eye className="h-4 w-4 text-admin-muted" /> : <EyeOff className="h-4 w-4 text-admin-muted" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4 text-admin-muted" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать акцию" : "Новая акция"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Например: Летняя скидка" />
            </div>
            <div>
              <label className="text-sm font-medium">Описание</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Условия акции" rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium">Скидка (%)</label>
              <Input type="number" min={0} max={100} value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Дата начала</label>
                <Input type="date" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Дата окончания</label>
                <Input type="date" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSave}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить акцию?</AlertDialogTitle>
            <AlertDialogDescription>«{deleteTarget?.name}» будет удалена без возможности восстановления.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
