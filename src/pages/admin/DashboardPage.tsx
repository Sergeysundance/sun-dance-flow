import { useEffect, useState } from "react";
import { CalendarDays, Mail, CreditCard, AlertTriangle, ArrowRight, UserPlus, CalendarPlus, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const today = new Date().toISOString().split("T")[0];

interface ScheduleClass {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  direction_id: string;
  teacher_id: string;
  room_id: string;
  max_spots: number;
  cancelled: boolean;
}

interface Direction {
  id: string;
  name: string;
  color: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
}

interface Room {
  id: string;
  name: string;
}

interface TrialRequest {
  id: string;
  name: string;
  phone: string;
  status: string;
  direction_id: string | null;
  created_at: string;
}

interface UserSubscription {
  id: string;
  active: boolean;
  expires_at: string;
  user_id: string;
}

const trialStatusColor: Record<string, string> = {
  new: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  enrolled: "bg-green-100 text-green-800",
  declined: "bg-gray-100 text-gray-800",
};

const trialStatusLabel: Record<string, string> = {
  new: "Новая",
  contacted: "Связались",
  enrolled: "Записан",
  declined: "Отказ",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayClasses, setTodayClasses] = useState<ScheduleClass[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [trialRequests, setTrialRequests] = useState<TrialRequest[]>([]);
  const [activeSubs, setActiveSubs] = useState<UserSubscription[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [newClientsCount, setNewClientsCount] = useState(0);
  const [newTeachersCount, setNewTeachersCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    const [classesRes, dirsRes, teachersRes, roomsRes, trialsRes, subsRes, newClientsRes, newTeachersRes] = await Promise.all([
      supabase.from("schedule_classes").select("*").eq("date", today).eq("cancelled", false).order("start_time", { ascending: true }),
      supabase.from("directions").select("id, name, color"),
      supabase.from("teachers").select("id, first_name, last_name"),
      supabase.from("rooms").select("id, name"),
      supabase.from("trial_requests").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("user_subscriptions").select("*").eq("active", true),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("seen_by_admin", false),
      supabase.from("teachers").select("id", { count: "exact", head: true }).eq("seen_by_admin", false),
    ]);

    const classes = (classesRes.data || []) as ScheduleClass[];
    setTodayClasses(classes);
    setDirections((dirsRes.data || []) as Direction[]);
    setTeachers((teachersRes.data || []) as Teacher[]);
    setRooms((roomsRes.data || []) as Room[]);
    setTrialRequests((trialsRes.data || []) as TrialRequest[]);
    setActiveSubs((subsRes.data || []) as UserSubscription[]);
    setNewClientsCount(newClientsRes.count || 0);
    setNewTeachersCount(newTeachersRes.count || 0);

    // Fetch booking counts for today's classes
    if (classes.length > 0) {
      const classIds = classes.map(c => c.id);
      const { data: bookings } = await supabase
        .from("bookings")
        .select("class_id")
        .in("class_id", classIds);

      const counts: Record<string, number> = {};
      (bookings || []).forEach((b: { class_id: string }) => {
        counts[b.class_id] = (counts[b.class_id] || 0) + 1;
      });
      setBookingCounts(counts);
    }

    setLoading(false);
  };

  const getDirection = (id: string) => directions.find(d => d.id === id);
  const getTeacher = (id: string) => teachers.find(t => t.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);

  const totalEnrolled = todayClasses.reduce((s, c) => s + (bookingCounts[c.id] || 0), 0);
  const newRequests = trialRequests.filter(r => r.status === "new");
  const expiringSoon = activeSubs.filter(s => {
    const diff = (new Date(s.expires_at).getTime() - Date.now()) / 86400000;
    return diff <= 7 && diff >= 0;
  });

  const totalNew = newClientsCount + newTeachersCount;
  const newSub = [newClientsCount > 0 ? `${newClientsCount} клиент(ов)` : "", newTeachersCount > 0 ? `${newTeachersCount} преподаватель(ей)` : ""].filter(Boolean).join(", ");

  const stats = [
    { label: "Сегодня занятий", value: todayClasses.length, sub: `записано ${totalEnrolled} человек`, icon: CalendarDays, color: "text-blue-500" },
    { label: "Новые регистрации", value: totalNew, sub: newSub || "все просмотрены", icon: UserPlus, color: "text-green-500", badge: totalNew > 0, onClick: () => navigate("/admin/clients") },
    { label: "Новые заявки", value: newRequests.length, sub: "", icon: Mail, color: "text-yellow-500", badge: newRequests.length > 0 },
    { label: "Истекают скоро", value: expiringSoon.length, sub: "в ближайшие 7 дней", icon: AlertTriangle, color: "text-red-500", badge: expiringSoon.length > 0 },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-admin-muted">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className={`bg-white border-admin-border shadow-sm ${(s as any).onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`} onClick={(s as any).onClick}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-gray-50 p-2.5 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-admin-foreground">{s.value}</span>
                  {s.badge && <Badge className="bg-red-500 text-white text-[10px] px-1.5">{s.value}</Badge>}
                </div>
                <div className="text-xs text-admin-muted">{s.label}</div>
                {s.sub && <div className="text-[11px] text-admin-muted">{s.sub}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate("/admin/clients")} className="bg-admin-accent text-black hover:bg-yellow-400 gap-2"><UserPlus className="h-4 w-4" /> Новый клиент</Button>
        <Button onClick={() => navigate("/admin/schedule")} variant="outline" className="border-admin-border text-admin-foreground gap-2"><CalendarPlus className="h-4 w-4" /> Новое занятие</Button>
        <Button onClick={() => navigate("/admin/check-in")} variant="outline" className="border-admin-border text-admin-foreground gap-2"><CheckSquare className="h-4 w-4" /> Отметка</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's classes */}
        <Card className="bg-white border-admin-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-admin-foreground">Сегодняшние занятия</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {todayClasses.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-admin-muted">Сегодня нет занятий</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-admin-border text-left text-xs text-admin-muted"><th className="px-4 py-2">Время</th><th className="px-4 py-2">Направление</th><th className="px-4 py-2">Преподаватель</th><th className="px-4 py-2">Зал</th><th className="px-4 py-2">Записано</th></tr></thead>
                  <tbody>
                    {todayClasses.map(c => {
                      const dir = getDirection(c.direction_id);
                      const teacher = getTeacher(c.teacher_id);
                      const room = getRoom(c.room_id);
                      const enrolled = bookingCounts[c.id] || 0;
                      return (
                        <tr key={c.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-admin-foreground">{c.start_time.slice(0, 5)}–{c.end_time.slice(0, 5)}</td>
                          <td className="px-4 py-2.5"><span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: dir?.color }} />{dir?.name}</td>
                          <td className="px-4 py-2.5 text-admin-muted">{teacher?.first_name} {teacher?.last_name?.[0]}.</td>
                          <td className="px-4 py-2.5 text-admin-muted">{room?.name}</td>
                          <td className="px-4 py-2.5">{enrolled}/{c.max_spots}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent trial requests */}
        <Card className="bg-white border-admin-border shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-admin-foreground">Последние заявки на пробное</CardTitle>
            <Button variant="ghost" size="sm" className="text-admin-muted gap-1" onClick={() => navigate("/admin/trial-requests")}>
              Все заявки <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {trialRequests.length === 0 ? (
              <div className="text-sm text-admin-muted">Нет заявок</div>
            ) : (
              trialRequests.slice(0, 4).map(r => {
                const dir = r.direction_id ? getDirection(r.direction_id) : null;
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-admin-border p-3">
                    <div>
                      <div className="text-sm font-medium text-admin-foreground">{r.name}</div>
                      <div className="text-xs text-admin-muted">{r.phone}{dir ? ` · ${dir.name}` : ""}</div>
                    </div>
                    <Badge className={trialStatusColor[r.status] || "bg-gray-100 text-gray-800"}>{trialStatusLabel[r.status] || r.status}</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
