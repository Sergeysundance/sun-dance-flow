import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { trialRequests, getDirection, getTrialStatusLabel } from "@/data/mockData";

const statusColors: Record<string, string> = { new: "bg-yellow-100 text-yellow-800", contacted: "bg-blue-100 text-blue-800", enrolled: "bg-green-100 text-green-800", declined: "bg-gray-100 text-gray-800" };

export default function TrialRequestsPage() {
  const [tab, setTab] = useState("all");
  const newCount = trialRequests.filter(r => r.status === "new").length;

  const filtered = trialRequests.filter(r => tab === "all" || r.status === tab);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="new" className="gap-1">Новые {newCount > 0 && <Badge className="bg-yellow-500 text-white text-[10px] px-1.5 ml-1">{newCount}</Badge>}</TabsTrigger>
          <TabsTrigger value="contacted">Связались</TabsTrigger>
          <TabsTrigger value="enrolled">Записаны</TabsTrigger>
          <TabsTrigger value="declined">Отклонены</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-admin-border bg-gray-50 text-left text-xs font-medium text-admin-muted">
            <th className="px-4 py-3">Имя</th><th className="px-4 py-3">Телефон</th><th className="px-4 py-3">Направление</th><th className="px-4 py-3">Комментарий</th><th className="px-4 py-3">Дата</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3">Действия</th>
          </tr></thead>
          <tbody>
            {filtered.map((r, i) => {
              const dir = getDirection(r.directionId);
              const isNew = r.status === 'new';
              return (
                <tr key={r.id} className={`border-b border-admin-border last:border-0 hover:bg-gray-50 ${isNew ? 'bg-yellow-50 border-l-2 border-l-yellow-400' : i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-admin-foreground">{r.name}</td>
                  <td className="px-4 py-3"><a href={`tel:${r.phone.replace(/[^\d+]/g,'')}`} className="text-blue-600 hover:underline">{r.phone}</a></td>
                  <td className="px-4 py-3">{dir?.name}</td>
                  <td className="px-4 py-3 text-admin-muted max-w-xs truncate">{r.comment || '—'}</td>
                  <td className="px-4 py-3 text-admin-muted whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3"><Badge className={statusColors[r.status]}>{getTrialStatusLabel(r.status)}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {r.status === 'new' && <Button size="sm" variant="outline" className="text-xs border-admin-border" onClick={() => toast.success("Статус: Связались")}>Связались</Button>}
                      {(r.status === 'new' || r.status === 'contacted') && <Button size="sm" variant="outline" className="text-xs border-admin-border text-green-600" onClick={() => toast.success("Клиент записан")}>Записать</Button>}
                      {r.status !== 'declined' && r.status !== 'enrolled' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-xs border-admin-border text-red-600">Отклонить</Button></AlertDialogTrigger>
                          <AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Отклонить заявку?</AlertDialogTitle><AlertDialogDescription>Заявка от {r.name} будет отклонена.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction onClick={() => toast.success("Заявка отклонена")} className="bg-red-600 text-white">Отклонить</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-admin-muted">Заявки не найдены</div>}
      </div>
    </div>
  );
}
