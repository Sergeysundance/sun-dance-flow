import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MoreHorizontal, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SubRow {
  id: string;
  user_id: string;
  subscription_type_id: string;
  hours_remaining: number;
  hours_total: number;
  purchased_at: string;
  expires_at: string;
  active: boolean;
  frozen: boolean;
  was_frozen: boolean;
  profile?: { first_name: string; last_name: string; id: string };
  type?: { name: string; hours_count: number | null };
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
  frozen: "bg-blue-100 text-blue-800",
  exhausted: "bg-red-100 text-red-800",
};

function getStatus(s: SubRow): string {
  if (s.frozen) return "frozen";
  if (!s.active || new Date(s.expires_at) < new Date()) return "expired";
  if (s.hours_remaining <= 0) return "exhausted";
  return "active";
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = { active: "Активен", expired: "Истёк", frozen: "Заморожен", exhausted: "Исчерпан" };
  return map[status] || status;
}

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "all");
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setTab(t);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setTab(value);
    setSearchParams(value === "all" ? {} : { tab: value });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: subsData } = await supabase
      .from("user_subscriptions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!subsData || subsData.length === 0) { setSubs([]); setLoading(false); return; }

    const userIds = [...new Set(subsData.map(s => s.user_id))];
    const typeIds = [...new Set(subsData.map(s => s.subscription_type_id))];

    const [profilesRes, typesRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, first_name, last_name").in("user_id", userIds),
      supabase.from("subscription_types").select("id, name, hours_count").in("id", typeIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.user_id, p]));
    const typeMap = new Map((typesRes.data || []).map(t => [t.id, t]));

    const enriched: SubRow[] = subsData.map(s => ({
      ...s,
      profile: profileMap.get(s.user_id),
      type: typeMap.get(s.subscription_type_id),
    }));

    setSubs(enriched);
    setLoading(false);
  };

  const filtered = subs.filter(s => {
    const status = getStatus(s);
    if (tab === "all") return true;
    if (tab === "expiring") {
      const diff = (new Date(s.expires_at).getTime() - Date.now()) / 86400000;
      return status === "active" && diff <= 7 && diff >= 0;
    }
    return status === tab;
  });

  const handleFreeze = async (s: SubRow) => {
    if (s.was_frozen) { toast.error("Заморозка уже использована"); return; }
    const now = new Date();
    const freezeUntil = new Date(now); freezeUntil.setDate(freezeUntil.getDate() + 7);
    const newExpires = new Date(s.expires_at); newExpires.setDate(newExpires.getDate() + 7);
    const { error } = await supabase.from("user_subscriptions").update({
      frozen: true, was_frozen: true, frozen_at: now.toISOString(),
      frozen_until: freezeUntil.toISOString(), original_expires_at: s.expires_at,
      expires_at: newExpires.toISOString(),
    }).eq("id", s.id);
    if (error) { toast.error("Ошибка заморозки"); return; }
    toast.success("Абонемент заморожен"); fetchData();
  };

  const handleUnfreeze = async (s: SubRow) => {
    const { error } = await supabase.from("user_subscriptions").update({ frozen: false }).eq("id", s.id);
    if (error) { toast.error("Ошибка разморозки"); return; }
    toast.success("Абонемент разморожен"); fetchData();
  };

  const handleRemind = async (s: SubRow) => {
    if (!s.profile) return;
    const { error } = await supabase.from("notifications").insert({
      user_id: s.user_id,
      title: "Абонемент скоро истекает",
      message: `Ваш абонемент "${s.type?.name || ''}" истекает ${new Date(s.expires_at).toLocaleDateString('ru-RU')}. Рекомендуем продлить его, чтобы не потерять доступ к занятиям.`,
      type: "warning",
    });
    if (error) { toast.error("Ошибка отправки уведомления"); return; }
    toast.success(`Уведомление отправлено: ${s.profile.first_name} ${s.profile.last_name}`);
  };

  if (loading) return <div className="flex items-center justify-center py-12 text-admin-muted">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={handleTabChange}>
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
              const status = getStatus(s);
              const pct = s.hours_total > 0 ? ((s.hours_total - s.hours_remaining) / s.hours_total) * 100 : 0;
              const daysLeft = Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / 86400000);
              const isExpiring = status === "active" && daysLeft <= 7 && daysLeft >= 0;
              return (
                <tr key={s.id} className={`border-b border-admin-border last:border-0 hover:bg-gray-50 ${isExpiring ? 'bg-yellow-50' : i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-admin-foreground cursor-pointer hover:underline" onClick={() => s.profile && navigate(`/admin/clients/${s.profile.id}`)}>
                    {s.profile ? `${s.profile.first_name} ${s.profile.last_name}` : "—"}
                  </td>
                  <td className="px-4 py-3">{s.type?.name || "—"}</td>
                  <td className="px-4 py-3 text-admin-muted">{new Date(s.purchased_at).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3 text-admin-muted">
                    {new Date(s.expires_at).toLocaleDateString('ru-RU')}
                    {isExpiring && <span className="ml-1 text-xs text-red-500">({daysLeft} дн.)</span>}
                  </td>
                  <td className="px-4 py-3 w-36">
                    <div className="flex items-center gap-2">
                      <Progress value={pct} className="h-2 flex-1" />
                      <span className="text-xs whitespace-nowrap">{s.hours_remaining}/{s.hours_total} ч</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge className={statusColors[status]}>{getStatusLabel(status)}</Badge></td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="text-admin-muted"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {status === 'active' && !s.was_frozen && <DropdownMenuItem onClick={() => handleFreeze(s)}>Заморозить</DropdownMenuItem>}
                        {status === 'frozen' && <DropdownMenuItem onClick={() => handleUnfreeze(s)}>Разморозить</DropdownMenuItem>}
                        {isExpiring && <DropdownMenuItem onClick={() => handleRemind(s)} className="gap-2"><Bell className="h-3.5 w-3.5" /> Напомнить</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => s.profile && navigate(`/admin/clients/${s.profile.id}`)}>Подробнее</DropdownMenuItem>
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
