import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { subscriptions, getClient, getSubscriptionType, getSubscriptionStatusLabel, formatPrice } from "@/data/mockData";

const statusColors: Record<string, string> = { active: "bg-green-100 text-green-800", expired: "bg-gray-100 text-gray-800", frozen: "bg-blue-100 text-blue-800", exhausted: "bg-red-100 text-red-800" };

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");

  const filtered = subscriptions.filter(s => {
    if (tab === "all") return true;
    if (tab === "expiring") {
      const diff = (new Date(s.expiresDate).getTime() - Date.now()) / 86400000;
      return s.status === "active" && diff <= 7 && diff >= 0;
    }
    return s.status === tab;
  });

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="expiring">Истекающие</TabsTrigger>
          <TabsTrigger value="frozen">Замороженные</TabsTrigger>
          <TabsTrigger value="exhausted">Исчерпанные</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-admin-border bg-gray-50 text-left text-xs font-medium text-admin-muted">
            <th className="px-4 py-3">Клиент</th><th className="px-4 py-3">Тип</th><th className="px-4 py-3">Куплен</th><th className="px-4 py-3">Истекает</th><th className="px-4 py-3">Использовано</th><th className="px-4 py-3">Статус</th><th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {filtered.map((s, i) => {
              const client = getClient(s.clientId);
              const st = getSubscriptionType(s.subscriptionTypeId);
              const pct = st?.classCount ? (s.usedClasses / st.classCount) * 100 : 50;
              const daysLeft = Math.ceil((new Date(s.expiresDate).getTime() - Date.now()) / 86400000);
              const isExpiring = s.status === "active" && daysLeft <= 7 && daysLeft >= 0;
              return (
                <tr key={s.id} className={`border-b border-admin-border last:border-0 hover:bg-gray-50 ${isExpiring ? 'bg-yellow-50' : i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-admin-foreground">{client?.firstName} {client?.lastName}</td>
                  <td className="px-4 py-3">{st?.name}</td>
                  <td className="px-4 py-3 text-admin-muted">{new Date(s.purchaseDate).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3 text-admin-muted">{new Date(s.expiresDate).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs whitespace-nowrap">{s.usedClasses}/{st?.classCount ?? '∞'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge className={statusColors[s.status]}>{getSubscriptionStatusLabel(s.status)}</Badge></td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-admin-muted"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {s.status === 'active' && <DropdownMenuItem onClick={() => toast.success("Абонемент заморожен")}>Заморозить</DropdownMenuItem>}
                        {s.status === 'frozen' && <DropdownMenuItem onClick={() => toast.success("Абонемент разморожен")}>Разморозить</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => navigate(`/admin/clients/${s.clientId}`)}>Подробнее</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-admin-muted">Абонементы не найдены</div>}
      </div>
    </div>
  );
}
