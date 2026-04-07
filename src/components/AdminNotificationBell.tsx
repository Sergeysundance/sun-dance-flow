import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Mail, AlertTriangle, UserPlus, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AdminNotification {
  id: string;
  type: "trial" | "registration" | "expiring" | "support";
  title: string;
  description: string;
  time: string;
  route: string;
}

export default function AdminNotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    const items: AdminNotification[] = [];

    // 1. New trial requests
    const { data: trials } = await supabase
      .from("trial_requests")
      .select("id, name, phone, created_at")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(5);

    for (const t of trials || []) {
      items.push({
        id: `trial-${t.id}`,
        type: "trial",
        title: "Новая заявка на пробное",
        description: `${t.name} — ${t.phone}`,
        time: new Date(t.created_at).toLocaleDateString("ru-RU"),
        route: "/admin/trial-requests",
      });
    }

    // 2. New (unseen) registrations
    const { data: newClients } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, created_at")
      .eq("seen_by_admin", false)
      .order("created_at", { ascending: false })
      .limit(5);

    for (const c of newClients || []) {
      items.push({
        id: `client-${c.id}`,
        type: "registration",
        title: "Новая регистрация",
        description: `${c.first_name} ${c.last_name}`.trim() || "Новый клиент",
        time: new Date(c.created_at).toLocaleDateString("ru-RU"),
        route: "/admin/clients",
      });
    }

    const { data: newTeachers } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, created_at")
      .eq("seen_by_admin", false)
      .order("created_at", { ascending: false })
      .limit(5);

    for (const t of newTeachers || []) {
      items.push({
        id: `teacher-${t.id}`,
        type: "registration",
        title: "Новый преподаватель",
        description: `${t.first_name} ${t.last_name}`.trim(),
        time: new Date(t.created_at).toLocaleDateString("ru-RU"),
        route: `/admin/teachers/${t.id}`,
      });
    }

    // 3. Expiring subscriptions (7 days)
    const now = new Date();
    const sevenDays = new Date(now);
    sevenDays.setDate(sevenDays.getDate() + 7);
    const { data: expiring, count: expiringCount } = await supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .eq("frozen", false)
      .lte("expires_at", sevenDays.toISOString())
      .gte("expires_at", now.toISOString());

    if (expiringCount && expiringCount > 0) {
      items.push({
        id: "expiring-subs",
        type: "expiring",
        title: "Истекающие абонементы",
        description: `${expiringCount} абонемент(ов) истекают в ближайшие 7 дней`,
        time: "",
        route: "/admin/subscriptions?tab=expiring",
      });
    }

    // 4. Unread support messages
    const { data: unreadSupport, count: supportCount } = await supabase
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .eq("sender_role", "user");

    if (supportCount && supportCount > 0) {
      items.push({
        id: "support-unread",
        type: "support",
        title: "Сообщения поддержки",
        description: `${supportCount} непрочитанных сообщений`,
        time: "",
        route: "/admin/support",
      });
    }

    setNotifications(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const totalCount = notifications.length;

  const iconMap = {
    trial: <Mail className="h-4 w-4 text-yellow-500" />,
    registration: <UserPlus className="h-4 w-4 text-green-500" />,
    expiring: <AlertTriangle className="h-4 w-4 text-red-500" />,
    support: <MessageCircle className="h-4 w-4 text-blue-500" />,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-admin-muted" onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}>
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {totalCount > 99 ? "99+" : totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-white border-admin-border shadow-lg" align="end" sideOffset={8}>
        <div className="flex items-center justify-between border-b border-admin-border px-4 py-3">
          <span className="text-sm font-semibold text-admin-foreground">Уведомления</span>
          {totalCount > 0 && (
            <Badge className="bg-red-500 text-white text-[10px]">{totalCount}</Badge>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-admin-muted">Загрузка...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-admin-muted">Нет уведомлений</div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 border-b border-admin-border last:border-0"
                onClick={() => {
                  setOpen(false);
                  navigate(n.route);
                }}
              >
                <div className="mt-0.5 shrink-0">{iconMap[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-admin-foreground">{n.title}</div>
                  <div className="text-xs text-admin-muted truncate">{n.description}</div>
                  {n.time && <div className="text-[11px] text-admin-muted mt-0.5">{n.time}</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
