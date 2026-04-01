import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, LogOut, ChevronLeft, ChevronRight, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function fmtDate(d: Date) { return d.toISOString().split("T")[0]; }

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${monday.getDate()}–${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);
  const [directions, setDirections] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");

  // Schedule
  const [weekOffset, setWeekOffset] = useState(0);
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookingsMap, setBookingsMap] = useState<Record<string, any[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const monday = useMemo(() => {
    const m = getMonday(new Date()); m.setDate(m.getDate() + weekOffset * 7); return m;
  }, [weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return fmtDate(d);
  }), [monday]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/"); return; }
      setUserEmail(session.user.email || "");

      // Find teacher record for this user
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!teacherData) {
        // Not a teacher, redirect to student dashboard
        navigate("/dashboard");
        return;
      }

      setTeacher(teacherData);

      const { data: dirs } = await supabase.from("directions").select("*").eq("active", true);
      if (dirs) setDirections(dirs);

      const { data: rms } = await supabase.from("rooms").select("*").eq("active", true);
      if (rms) setRooms(rms);

      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch classes and bookings for the week
  useEffect(() => {
    if (!teacher) return;
    const fetchSchedule = async () => {
      const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
      const { data: cls } = await supabase
        .from("schedule_classes")
        .select("*")
        .eq("teacher_id", teacher.id)
        .gte("date", fmtDate(monday))
        .lte("date", fmtDate(sunday))
        .eq("cancelled", false)
        .order("date")
        .order("start_time");

      const classesData = cls || [];
      setClasses(classesData);

      // Fetch bookings with profiles for these classes
      if (classesData.length > 0) {
        const classIds = classesData.map(c => c.id);
        const { data: bookings } = await supabase
          .from("bookings")
          .select("*")
          .in("class_id", classIds);

        if (bookings && bookings.length > 0) {
          // Get profiles for booked users
          const userIds = [...new Set(bookings.map(b => b.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, phone")
            .in("user_id", userIds);

          const profilesMap = new Map((profiles || []).map(p => [p.user_id, p]));

          const map: Record<string, any[]> = {};
          for (const b of bookings) {
            if (!map[b.class_id]) map[b.class_id] = [];
            map[b.class_id].push({
              ...b,
              profile: profilesMap.get(b.user_id),
            });
          }
          setBookingsMap(map);
        } else {
          setBookingsMap({});
        }
      } else {
        setBookingsMap({});
      }
    };
    fetchSchedule();
  }, [monday, teacher]);

  const getDir = (id: string) => directions.find(d => d.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const todayStr = fmtDate(new Date());

  const classesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const date of weekDates) map[date] = [];
    for (const c of classes) {
      if (map[c.date]) map[c.date].push(c);
    }
    return map;
  }, [classes, weekDates]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из системы");
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "УДАЛИТЬ") return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      await supabase.from("bookings").delete().eq("user_id", uid);
      await supabase.from("teachers").delete().eq("user_id", uid);
      await supabase.from("profiles").delete().eq("user_id", uid);

      await supabase.auth.signOut();
      toast.success("Аккаунт удалён");
      navigate("/");
    } catch {
      toast.error("Ошибка удаления аккаунта");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="font-display text-lg font-black tracking-tight text-foreground">
            <span className="text-sun">SUN</span> DANCE SCHOOL
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{userEmail}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="font-display text-2xl font-bold mb-6">Кабинет преподавателя</h1>

        <Tabs defaultValue="schedule">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-1">
              <User className="h-4 w-4" /> Профиль
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1">
              <Calendar className="h-4 w-4" /> Мои занятия
            </TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Мои данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Имя</p>
                    <p className="text-foreground font-medium">{teacher.first_name} {teacher.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground">{teacher.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Телефон</p>
                    <p className="text-foreground">{teacher.phone || "—"}</p>
                  </div>
                </div>
                {teacher.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">О себе</p>
                    <p className="text-foreground">{teacher.bio}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Направления</p>
                  <div className="flex flex-wrap gap-1">
                    {teacher.direction_ids.map((dId: string) => {
                      const dir = getDir(dId);
                      return dir ? (
                        <Badge key={dId} variant="outline" style={{ borderColor: dir.color, color: dir.color }} className="text-xs">
                          {dir.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule tab */}
          <TabsContent value="schedule">
            {/* Week nav */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-display text-sm font-semibold">{formatWeekLabel(monday)}</span>
              <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {classes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  На этой неделе у вас нет занятий
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {weekDates.map((date, idx) => {
                  const dayClasses = classesByDate[date] || [];
                  if (dayClasses.length === 0) return null;
                  const isToday = date === todayStr;
                  const dayDate = new Date(date);

                  return (
                    <div key={date}>
                      <h3 className={`font-display text-sm font-bold mb-2 ${isToday ? 'text-sun' : 'text-foreground'}`}>
                        {DAYS_SHORT[idx]}, {dayDate.getDate()}.{String(dayDate.getMonth() + 1).padStart(2, '0')}
                        {isToday && <span className="ml-2 text-xs font-normal text-sun">(сегодня)</span>}
                      </h3>
                      <div className="space-y-3">
                        {dayClasses.map(cls => {
                          const dir = getDir(cls.direction_id);
                          const room = getRoom(cls.room_id);
                          const classBookings = bookingsMap[cls.id] || [];

                          return (
                            <Card key={cls.id} className="border-l-4" style={{ borderLeftColor: dir?.color || 'hsl(var(--border))' }}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-display font-bold text-foreground">
                                      {dir?.name || "Направление"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {cls.start_time.slice(0, 5)} – {cls.end_time.slice(0, 5)} • {room?.name || "Зал"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span className="font-semibold text-foreground">{classBookings.length}</span>
                                    <span>/ {cls.max_spots}</span>
                                  </div>
                                </div>

                                {classBookings.length > 0 ? (
                                  <div className="mt-3 border-t border-border pt-3">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Записавшиеся ученики:</p>
                                    <div className="space-y-1.5">
                                      {classBookings.map((b, i) => (
                                        <div key={b.id} className="flex items-center justify-between text-sm">
                                          <div className="flex items-center gap-2">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sun/10 text-xs font-bold text-sun">
                                              {i + 1}
                                            </span>
                                            <span className="text-foreground">
                                              {b.profile ? `${b.profile.first_name} ${b.profile.last_name}`.trim() || "Без имени" : "Ученик"}
                                            </span>
                                          </div>
                                          {b.profile?.phone && (
                                            <span className="text-xs text-muted-foreground">{b.profile.phone}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="mt-2 text-xs text-muted-foreground italic">Пока нет записей</p>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
