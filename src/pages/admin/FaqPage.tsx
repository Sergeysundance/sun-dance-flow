import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export default function FaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });

  const fetchData = async () => {
    const { data } = await supabase
      .from("faq")
      .select("*")
      .order("sort_order");
    if (data) setItems(data as FaqItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ question: "", answer: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: FaqItem) => {
    setEditing(item);
    setForm({ question: item.question, answer: item.answer });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question.trim()) {
      toast.error("Введите вопрос");
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from("faq")
        .update({ question: form.question, answer: form.answer })
        .eq("id", editing.id);
      if (error) toast.error("Ошибка сохранения");
      else toast.success("Вопрос обновлён");
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
      const { error } = await supabase
        .from("faq")
        .insert({ question: form.question, answer: form.answer, sort_order: maxOrder });
      if (error) toast.error("Ошибка создания");
      else toast.success("Вопрос добавлен");
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleToggle = async (item: FaqItem) => {
    await supabase
      .from("faq")
      .update({ active: !item.active })
      .eq("id", item.id);
    toast.success(item.active ? "Вопрос скрыт" : "Вопрос активирован");
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("faq").delete().eq("id", deleteTarget.id);
    if (error) toast.error("Ошибка удаления");
    else toast.success("Вопрос удалён");
    setDeleteTarget(null);
    fetchData();
  };

  if (loading) return <p className="text-admin-muted">Загрузка…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-admin-muted">{items.length} вопросов</p>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Добавить вопрос
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-admin-muted border-admin-border bg-white">
          <p className="text-lg font-medium">Нет вопросов</p>
          <p className="text-sm">Добавьте первый вопрос</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`flex items-start gap-3 p-4 border-admin-border bg-white ${!item.active ? "opacity-50" : ""}`}
            >
              <GripVertical className="mt-1 h-4 w-4 shrink-0 text-admin-muted" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-admin-foreground text-sm">{item.question}</p>
                <p className="text-xs text-admin-muted mt-1 line-clamp-2">{item.answer}</p>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать вопрос" : "Новый вопрос"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Вопрос</label>
              <Input
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="Введите вопрос"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ответ</label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Введите ответ"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button onClick={handleSave}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить вопрос?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.question}» будет удалён без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
