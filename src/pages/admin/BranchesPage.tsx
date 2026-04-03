import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  address: string;
  active: boolean;
  sort_order: number;
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: "", address: "", sort_order: 0 });

  const fetchBranches = async () => {
    const { data } = await supabase.from("branches").select("*").order("sort_order");
    setBranches((data || []) as Branch[]);
    setLoading(false);
  };

  useEffect(() => { fetchBranches(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", address: "", sort_order: 0 });
    setDialogOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({ name: b.name, address: b.address, sort_order: b.sort_order });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Введите название"); return; }
    if (editing) {
      const { error } = await supabase.from("branches").update({ name: form.name, address: form.address, sort_order: form.sort_order }).eq("id", editing.id);
      if (error) { toast.error("Ошибка сохранения"); return; }
      toast.success("Филиал обновлён");
    } else {
      const { error } = await supabase.from("branches").insert({ name: form.name, address: form.address, sort_order: form.sort_order });
      if (error) { toast.error("Ошибка создания"); return; }
      toast.success("Филиал добавлен");
    }
    setDialogOpen(false);
    fetchBranches();
  };

  const toggleActive = async (b: Branch) => {
    await supabase.from("branches").update({ active: !b.active }).eq("id", b.id);
    fetchBranches();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from("branches").delete().eq("id", deleteId);
    toast.success("Филиал удалён");
    setDeleteId(null);
    fetchBranches();
  };

  if (loading) return <div className="text-admin-muted py-8 text-center">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-admin-foreground">Филиалы</h2>
        <Button onClick={openCreate} className="bg-admin-accent text-black hover:bg-yellow-400 gap-2">
          <Plus className="h-4 w-4" /> Добавить
        </Button>
      </div>

      {branches.length === 0 ? (
        <Card className="bg-white border-admin-border"><CardContent className="py-8 text-center text-admin-muted">Нет филиалов</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {branches.map(b => (
            <Card key={b.id} className={`bg-white border-admin-border shadow-sm ${!b.active ? "opacity-50" : ""}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-admin-foreground">{b.name}</div>
                  {b.address && <div className="text-sm text-admin-muted">{b.address}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={b.active} onCheckedChange={() => toggleActive(b)} />
                  <Button variant="outline" size="icon" className="border-admin-border" onClick={() => openEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteId(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader><DialogTitle>{editing ? "Редактировать филиал" : "Новый филиал"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Название</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Название филиала" /></div>
            <div><Label>Адрес</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Адрес" /></div>
            <div><Label>Порядок</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
            <Button onClick={save} className="w-full bg-admin-accent text-black hover:bg-yellow-400">{editing ? "Сохранить" : "Добавить"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить филиал?</AlertDialogTitle>
            <AlertDialogDescription>Это действие необратимо.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
