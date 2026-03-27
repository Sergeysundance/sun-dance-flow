import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, CreditCard, LogOut, Edit2, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string | null;
  preferred_directions: string[] | null;
  notes: string | null;
}

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function fmtDate(d: Date) { return d.toISOString().split("T")[0]; }
function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${monday.getDate()}–${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [directions, setDirections] = useState<any[]>([]);

  // Schedule state
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [schedTeachers, setSchedTeachers] = useState<any[]>([]);
  const [schedRooms, setSchedRooms] = useState<any[]>([]);

  const monday = useMemo(() => {
    const m = getMonday(new Date()); m.setDate(m.getDate() + weekOffset * 7); return m;
  }, [weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return fmtDate(d);
  }), [monday]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/"); return; }
      setUserEmail(session.user.email || "");
      const [profileRes, dirsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", session.user.id).single(),
        supabase.from("directions").select("*").eq("active", true),
      ]);
      if (profileRes.data) { setProfile(profileRes.data); setEditData(profileRes.data); }
      if (dirsRes.data) setDirections(dirsRes.data);
      setLoading(false);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch schedule data when week changes
  useEffect(() => {
    const fetchSchedule = async () => {
      const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
      const [clsRes, tchRes, rmRes] = await Promise.all([
        supabase.from("schedule_classes").select("*").gte("date", fmtDate(monday)).lte("date", fmtDate(sunday)).eq("cancelled", false).order("date").order("start_time"),
        supabase.from("teachers").select("*").eq("active", true),
        supabase.from("rooms").select("*").eq("active", true),
      ]);
      setScheduleData(clsRes.data || []);
      setSchedTeachers(tchRes.data || []);
      setSchedRooms(rmRes.data || []);
    };
    fetchSchedule();
  }, [monday]);

  const classesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const date of weekDates) map[date] = [];
    const preferredDirs = profile?.preferred_directions || [];
    for (const c of scheduleData) {
      if (map[c.date] && (preferredDirs.length === 0 || preferredDirs.includes(c.direction_id))) {
        map[c.date].push(c);
      }
    }
    return map;
  }, [scheduleData, weekDates, profile]);

  const maxClasses = useMemo(() => Math.max(1, ...Object.values(classesByDate).map(arr => arr.length)), [classesByDate]);
  const todayStr = fmtDate(new Date());
  const getDir = (id: string) => directions.find((d: any) => d.id === id);
  const getTeacher = (id: string) => schedTeachers.find((t: any) => t.id === id);
  const getRoom = (id: string) => schedRooms.find((r: any) => r.id === id);

  const handleSave = async () => {
    if (!editData) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("profiles").update({
      first_name: editData.first_name, last_name: editData.last_name,
      phone: editData.phone, birth_date: editData.birth_date,
      preferred_directions: editData.preferred_directions,
    }).eq("user_id", session.user.id);
    if (error) { toast.error("Ошибка сохранения"); }
    else { setProfile(editData); setEditing(false); toast.success("Профиль обновлён"); }
  };

  const toggleDirection = (id: string) => {
    if (!editData) return;
    const current = editData.preferred_directions || [];
    setEditData({
      ...editData,
      preferred_directions: current.includes(id) ? current.filter(d => d !== id) : [...current, id],
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из системы");
    navigate("/");
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
      {/* Header */}
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-display text-2xl font-bold mb-6">Личный кабинет</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-1">
              <User className="h-4 w-4" /> Профиль
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1">
              <CreditCard className="h-4 w-4" /> Абонементы
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1">
              <Calendar className="h-4 w-4" /> Расписание
            </TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Мои данные</CardTitle>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => { setEditData(profile); setEditing(true); }}>
                    <Edit2 className="h-4 w-4 mr-1" /> Редактировать
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Отмена</Button>
                    <Button variant="sun" size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" /> Сохранить
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Имя</Label>
                    {editing ? (
                      <Input className="border-muted-foreground/40" value={editData?.first_name || ""} onChange={e => setEditData(prev => prev ? { ...prev, first_name: e.target.value } : prev)} />
                    ) : (
                      <p className="text-foreground mt-1">{profile?.first_name || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label>Фамилия</Label>
                    {editing ? (
                      <Input className="border-muted-foreground/40" value={editData?.last_name || ""} onChange={e => setEditData(prev => prev ? { ...prev, last_name: e.target.value } : prev)} />
                    ) : (
                      <p className="text-foreground mt-1">{profile?.last_name || "—"}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Телефон</Label>
                  {editing ? (
                    <Input className="border-muted-foreground/40" value={editData?.phone || ""} onChange={e => setEditData(prev => prev ? { ...prev, phone: e.target.value } : prev)} />
                  ) : (
                    <p className="text-foreground mt-1">{profile?.phone || "—"}</p>
                  )}
                </div>
                <div>
                  <Label>Дата рождения</Label>
                  {editing ? (
                    <Input className="border-muted-foreground/40" type="date" value={editData?.birth_date || ""} onChange={e => setEditData(prev => prev ? { ...prev, birth_date: e.target.value || null } : prev)} />
                  ) : (
                    <p className="text-foreground mt-1">
                      {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString("ru-RU") : "—"}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-foreground mt-1">{userEmail}</p>
                </div>
                <div>
                  <Label>Предпочтительные направления</Label>
                  {editing ? (
                    <div className="mt-1.5 space-y-1.5 rounded-md border border-border p-3">
                      {directions.filter(d => d.active).map(d => (
                        <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={(editData?.preferred_directions || []).includes(d.id)}
                            onCheckedChange={() => toggleDirection(d.id)}
                          />
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(profile?.preferred_directions || []).length > 0
                        ? (profile?.preferred_directions || []).map(id => {
                            const dir = directions.find(d => d.id === id);
                            return dir ? (
                              <span key={id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-border">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dir.color }} />
                                {dir.name}
                              </span>
                            ) : null;
                          })
                        : <p className="text-muted-foreground">Не выбрано</p>
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Мои абонементы</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">У вас пока нет активных абонементов. Посмотрите доступные варианты на <a href="/#pricing" className="text-sun hover:underline">странице абонементов</a>.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Расписание на неделю</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-foreground min-w-[180px] text-center">
                    {formatWeekLabel(monday)}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {weekOffset !== 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-muted-foreground text-xs">
                      Сегодня
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {(profile?.preferred_directions || []).length === 0 ? (
                  <p className="text-muted-foreground">
                    Выберите предпочтительные направления в профиле, чтобы видеть расписание.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-7 border-b border-border">
                      {DAYS_SHORT.map((day, i) => {
                        const date = weekDates[i];
                        const isToday = date === todayStr;
                        const dateObj = new Date(date + 'T00:00');
                        return (
                          <div key={i} className={`border-r border-border last:border-r-0 px-2 py-2 text-center ${isToday ? 'bg-sun/10' : ''}`}>
                            <div className={`text-xs font-medium ${isToday ? 'text-sun' : 'text-muted-foreground'}`}>{day}</div>
                            <div className={`text-base font-bold ${isToday ? 'text-sun' : 'text-foreground'}`}>{dateObj.getDate()}</div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Body */}
                    {Object.values(classesByDate).some(arr => arr.length > 0) ? (
                      Array.from({ length: maxClasses }).map((_, rowIdx) => (
                        <div key={rowIdx} className="grid grid-cols-7 border-b border-border last:border-b-0">
                          {weekDates.map((date, colIdx) => {
                            const cls = classesByDate[date]?.[rowIdx];
                            const isToday = date === todayStr;
                            if (!cls) return <div key={colIdx} className={`border-r border-border last:border-r-0 min-h-[70px] ${isToday ? 'bg-sun/5' : ''}`} />;
                            const dir = getDir(cls.direction_id);
                            const teacher = getTeacher(cls.teacher_id);
                            const room = getRoom(cls.room_id);
                            return (
                              <div key={colIdx} className={`border-r border-border last:border-r-0 p-1 min-h-[70px] ${isToday ? 'bg-sun/5' : ''}`}>
                                <div
                                  className="rounded-md p-2 h-full space-y-0.5"
                                  style={{ backgroundColor: (dir?.color || '#3B82F6') + '15', borderLeft: `3px solid ${dir?.color || '#3B82F6'}` }}
                                >
                                  <div className="text-[11px] font-semibold text-foreground">
                                    {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}
                                  </div>
                                  <div className="text-xs font-bold" style={{ color: dir?.color }}>
                                    {dir?.name}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {teacher?.first_name} {teacher?.last_name?.[0]}.
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {room?.name}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">Нет занятий на этой неделе</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
