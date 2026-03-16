import { useState } from "react";
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
import { subscriptionTypes, formatPrice, getSubscriptionTypeLabel } from "@/data/mockData";

const typeColors: Record<string, string> = { group: "bg-blue-100 text-blue-800", individual_solo: "bg-purple-100 text-purple-800", individual_duo: "bg-purple-100 text-purple-800", trial: "bg-green-100 text-green-800", single: "bg-gray-100 text-gray-800" };

export default function SubscriptionTypesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый тип</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-admin-border bg-gray-50 text-left text-xs font-medium text-admin-muted">
            <th className="px-4 py-3">Название</th><th className="px-4 py-3">Занятий</th><th className="px-4 py-3">Срок</th><th className="px-4 py-3">Длительность</th><th className="px-4 py-3">Цена</th><th className="px-4 py-3">Старая цена</th><th className="px-4 py-3">Тип</th><th className="px-4 py-3">Активен</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {subscriptionTypes.map((st, i) => (
              <tr key={st.id} className={`border-b border-admin-border last:border-0 hover:bg-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <td className="px-4 py-3 font-medium text-admin-foreground">{st.name}</td>
                <td className="px-4 py-3">{st.classCount ?? '∞'}</td>
                <td className="px-4 py-3">{st.durationDays} дн.</td>
                <td className="px-4 py-3">{st.classDuration} мин</td>
                <td className="px-4 py-3 font-medium text-admin-foreground">{formatPrice(st.price)}</td>
                <td className="px-4 py-3 text-admin-muted">{st.oldPrice ? <span className="line-through">{formatPrice(st.oldPrice)}</span> : '—'}</td>
                <td className="px-4 py-3"><Badge className={typeColors[st.type]}>{getSubscriptionTypeLabel(st.type)}</Badge></td>
                <td className="px-4 py-3"><Switch checked={st.active} /></td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-admin-muted"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end"><DropdownMenuItem>Редактировать</DropdownMenuItem><DropdownMenuItem className="text-red-600">Удалить</DropdownMenuItem></DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader><DialogTitle className="text-admin-foreground">Новый тип абонемента</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Название *</Label><Input className="bg-white border-admin-border" /></div>
            <div><Label>Описание</Label><Textarea className="bg-white border-admin-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Кол-во занятий</Label><Input type="number" placeholder="Пусто = безлимит" className="bg-white border-admin-border" /></div>
              <div><Label>Срок (дней) *</Label><Input type="number" className="bg-white border-admin-border" /></div>
            </div>
            <div><Label>Длительность</Label><Select><SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="60">60 мин</SelectItem><SelectItem value="90">90 мин</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Цена *</Label><Input type="number" className="bg-white border-admin-border" /></div>
              <div><Label>Старая цена</Label><Input type="number" className="bg-white border-admin-border" /></div>
            </div>
            <div><Label>Тип</Label><Select><SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="group">Групповой</SelectItem><SelectItem value="individual_solo">Индивидуальный соло</SelectItem><SelectItem value="individual_duo">Индивидуальный дуэт</SelectItem><SelectItem value="trial">Пробный</SelectItem><SelectItem value="single">Разовый</SelectItem></SelectContent></Select></div>
            <div className="flex items-center gap-2"><Switch defaultChecked /><Label>Активен</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => { setDialogOpen(false); toast.success("Тип абонемента сохранён"); }}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
