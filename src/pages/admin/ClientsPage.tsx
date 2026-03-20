import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  clients, subscriptions, directions, getSubscriptionType, getClientActiveSubscription,
  getSourceLabel, getSubscriptionStatusLabel,
} from "@/data/mockData";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
  frozen: "bg-blue-100 text-blue-800",
  exhausted: "bg-red-100 text-red-800",
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q || `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.phone.includes(q);
    if (!matchesSearch) return false;
    if (tab === "with") return !!getClientActiveSubscription(c.id);
    if (tab === "without") return !getClientActiveSubscription(c.id);
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="all">Все</TabsTrigger>
            <TabsTrigger value="with">С абонементом</TabsTrigger>
            <TabsTrigger value="without">Без абонемента</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <Input placeholder="Поиск по имени или телефону" className="pl-9 w-64 bg-white border-admin-border" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый клиент</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-admin-border bg-gray-50 text-left text-xs font-medium text-admin-muted">
            <th className="px-4 py-3">Имя</th><th className="px-4 py-3">Телефон</th><th className="px-4 py-3">Абонемент</th><th className="px-4 py-3">Осталось</th><th className="px-4 py-3">Источник</th><th className="px-4 py-3">Регистрация</th>
          </tr></thead>
          <tbody>
            {filtered.map((c, i) => {
              const sub = subscriptions.find(s => s.clientId === c.id && (s.status === 'active' || s.status === 'frozen'));
              const subType = sub ? getSubscriptionType(sub.subscriptionTypeId) : null;
              const remaining = sub && subType?.classCount ? subType.classCount - sub.usedClasses : null;
              return (
                <tr key={c.id} onClick={() => navigate(`/admin/clients/${c.id}`)} className={`cursor-pointer border-b border-admin-border last:border-0 hover:bg-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-admin-foreground">{c.firstName} {c.lastName}</td>
                  <td className="px-4 py-3"><a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>{c.phone}</a></td>
                  <td className="px-4 py-3">{sub ? <Badge className={statusColors[sub.status]}>{subType?.name}</Badge> : <span className="text-admin-muted">—</span>}</td>
                  <td className="px-4 py-3">{remaining !== null ? remaining : sub ? '∞' : '—'}</td>
                  <td className="px-4 py-3 text-admin-muted">{getSourceLabel(c.source)}</td>
                  <td className="px-4 py-3 text-admin-muted">{new Date(c.createdAt).toLocaleDateString('ru-RU')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-admin-muted">Клиенты не найдены</div>}
      </div>

      {/* New client dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md">
          <DialogHeader><DialogTitle className="text-admin-foreground">Новый клиент</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Имя *</Label><Input className="bg-white border-admin-border" /></div>
              <div><Label>Фамилия *</Label><Input className="bg-white border-admin-border" /></div>
            </div>
            <div><Label>Телефон *</Label><Input placeholder="+7 (___) ___-__-__" className="bg-white border-admin-border" /></div>
            <div><Label>Email</Label><Input type="email" className="bg-white border-admin-border" /></div>
            <div><Label>Дата рождения</Label><Input type="date" className="bg-white border-admin-border" /></div>
            <div><Label>Источник</Label>
              <Select><SelectTrigger className="bg-white border-admin-border"><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>{["Сайт","Instagram","VK","Telegram","Рекомендация","Другое"].map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Заметки</Label><Textarea className="bg-white border-admin-border" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => { setDialogOpen(false); toast.success("Клиент сохранён"); }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
