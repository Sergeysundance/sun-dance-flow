import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, LogOut, ChevronLeft, ChevronRight, Users, Trash2, XCircle, CreditCard, Clock, DollarSign, Check, X, AlertTriangle, BookOpen } from "lucide-react";
import WeeklyTimeGrid from "@/components/WeeklyTimeGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BranchProvider, useBranch } from "@/contexts/BranchContext";
import BranchSelector from "@/components/BranchSelector";
import BuySubscriptionDialog from "@/components/BuySubscriptionDialog";

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${monday.getDate()}–${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

interface UserSubscription {
  id: string;
  hours_remaining: number;
  hours_total: number;
  purchased_at: string;
  expires_at: string;
  active: boolean;
  subscription_type_id: string;
  subscription_type?: {
    name: string;
    hours_count: number | null;
    price: number;
    type: string;
  };
}

function TeacherDashboardInner() {
  const { selectedBranchId } = useBranch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<any>(null);
  const [directions, setDirections] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [bonusPoints, setBonusPoints] = useState(0);

  // Subscriptions
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [historySubscriptions, setHistorySubscriptions] = useState<UserSubscription[]>([]);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyDialogType, setBuyDialogType] = useState<string>("group");
  const [subTab, setSubTab] = useState("group");
  const [hasSchedule, setHasSchedule] = useState(false);

  // Stats: hours taught & salary
  const [monthlyStats, setMonthlyStats] = useState<{ month: string; hours: number; salary: number }[]>([]);
  // Schedule
  const [weekOffset, setWeekOffset] = useState(0);
  const [classes, setClasses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookingsMap, setBookingsMap] = useState<Record<string, any[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [cancellingClassId, setCancellingClassId] = useState<string | null>(null);
  const [cancelDialogClassId, setCancelDialogClassId] = useState<string | null>(null);

  // Browse schedule (all classes, for booking as student)
  const [browseClasses, setBrowseClasses] = useState<any[]>([]);
  const [browseTeachers, setBrowseTeachers] = useState<any[]>([]);
  const [browseRooms, setBrowseRooms] = useState<any[]>([]);
  const [browseBookings, setBrowseBookings] = useState<Set<string>>(new Set());
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [confirmBookingClassId, setConfirmBookingClassId] = useState<string | null>(null);
  const [noSubDialogOpen, setNoSubDialogOpen] = useState(false);
  const [browseWeekOffset, setBrowseWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState("schedule");
  const [allTeacherBookings, setAllTeacherBookings] = useState<any[]>([]);
  const [allBookingsLoading, setAllBookingsLoading] = useState(false);

  const monday = useMemo(() => {
    const m = getMonday(new Date()); m.setDate(m.getDate() + weekOffset * 7); return m;
  }, [weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return fmtDate(d);
  }), [monday]);

  const browseMonday = useMemo(() => {
    const m = getMonday(new Date()); m.setDate(m.getDate() + browseWeekOffset * 7); return m;
  }, [browseWeekOffset]);
  const browseWeekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(browseMonday); d.setDate(d.getDate() + i); return fmtDate(d);
  }), [browseMonday]);

  const enrichSubscriptions = async (subs: any[]) => {
    if (!subs || subs.length === 0) return [];
    const typeIds = [...new Set(subs.map((s: any) => s.subscription_type_id))];
    const { data: types } = await supabase
      .from("subscription_types")
      .select("id, name, hours_count, price, type")
      .in("id", typeIds);
    const typesMap = new Map((types || []).map((t: any) => [t.id, t]));
    return subs.map((s: any) => ({ ...s, subscription_type: typesMap.get(s.subscription_type_id) }));
  };

  const fetchTeacherStats = async (teacherId: string) => {
    // Get all classes taught by this teacher (past, not cancelled)
    const { data: allClasses } = await supabase
      .from("schedule_classes")
      .select("id, date, start_time, end_time")
      .eq("teacher_id", teacherId)
      .eq("cancelled", false)
      .lte("date", fmtDate(new Date()))
      .order("date", { ascending: false });

    if (!allClasses || allClasses.length === 0) { setMonthlyStats([]); return; }

    const classIds = allClasses.map(c => c.id);
    // Get bookings for these classes
    const { data: allBookings } = await supabase
      .from("bookings")
      .select("id, class_id, user_id")
      .in("class_id", classIds);

    // Get user subscriptions & types for salary calculation
    const userIds = [...new Set((allBookings || []).map(b => b.user_id))];
    let typesMap = new Map<string, any>();
    let subsMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: userSubs } = await supabase
        .from("user_subscriptions")
        .select("id, user_id, subscription_type_id, hours_total")
        .in("user_id", userIds);

      const typeIds = [...new Set((userSubs || []).map(s => s.subscription_type_id))];
      const { data: subTypes } = await supabase
        .from("subscription_types")
        .select("id, price, hours_count")
        .in("id", typeIds.length > 0 ? typeIds : ["__none__"]);

      typesMap = new Map((subTypes || []).map(t => [t.id, t]));
      for (const s of (userSubs || [])) {
        if (!subsMap.has(s.user_id) || s.hours_total > (subsMap.get(s.user_id)?.hours_total || 0)) {
          subsMap.set(s.user_id, s);
        }
      }
    }

    // Group bookings by class_id
    const bookingsByClass: Record<string, any[]> = {};
    for (const b of (allBookings || [])) {
      if (!bookingsByClass[b.class_id]) bookingsByClass[b.class_id] = [];
      bookingsByClass[b.class_id].push(b);
    }

    // Calculate hours and salary per month
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const grouped: Record<string, { hours: number; salary: number }> = {};

    for (const cls of allClasses) {
      const dt = new Date(cls.date);
      const key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2, '0')}`;
      if (!grouped[key]) grouped[key] = { hours: 0, salary: 0 };

      // Calculate class duration in hours
      const [sh, sm] = cls.start_time.split(':').map(Number);
      const [eh, em] = cls.end_time.split(':').map(Number);
      const durationHours = (eh * 60 + em - sh * 60 - sm) / 60;
      grouped[key].hours += durationHours;

      // Salary: for each student, hourly rate from their subscription × duration
      const classBookings = bookingsByClass[cls.id] || [];
      let classRevenue = 0;
      for (const b of classBookings) {
        const sub = subsMap.get(b.user_id);
        if (sub) {
          const subType = typesMap.get(sub.subscription_type_id);
          if (subType && subType.hours_count && subType.hours_count > 0) {
            const hourlyRate = subType.price / subType.hours_count;
            classRevenue += hourlyRate * durationHours;
          }
        }
      }
      // Minus 5% tax, then divide by 2
      grouped[key].salary += (classRevenue * 0.95) / 2;
    }

    const sorted = Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([key, data]) => {
        const [y, m] = key.split('-');
        return { month: `${monthNames[parseInt(m)]} ${y}`, hours: Math.round(data.hours * 10) / 10, salary: Math.round(data.salary) };
      });

    setMonthlyStats(sorted);
  };

  const fetchSubscriptions = async (uid: string) => {
    const { data: activeSubs } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", uid)
      .eq("active", true)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true });
    setUserSubscriptions(await enrichSubscriptions(activeSubs || []));

    const { data: historySubs } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", uid)
      .or(`active.eq.false,expires_at.lt.${new Date().toISOString()}`)
      .order("expires_at", { ascending: false });
    setHistorySubscriptions(await enrichSubscriptions(historySubs || []));
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/"); return; }
      setUserEmail(session.user.email || "");
      setUserId(session.user.id);

      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!teacherData) {
        navigate("/dashboard");
        return;
      }

      setTeacher(teacherData);

      const [dirsRes, rmsRes, profileRes, scheduleCheck] = await Promise.all([
        supabase.from("directions").select("*").eq("active", true),
        supabase.from("rooms").select("*").eq("active", true),
        supabase.from("profiles").select("bonus_points").eq("user_id", session.user.id).single(),
        supabase.from("schedule_classes").select("id").eq("teacher_id", teacherData.id).limit(1),
      ]);
      if (dirsRes.data) setDirections(dirsRes.data);
      if (rmsRes.data) setRooms(rmsRes.data);
      if (profileRes.data) setBonusPoints((profileRes.data as any).bonus_points ?? 0);
      setHasSchedule((scheduleCheck.data?.length || 0) > 0);

      await fetchSubscriptions(session.user.id);
      await fetchTeacherStats(teacherData.id);

      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Refresh teacher data (discount, etc.) from DB
  const refreshTeacherData = async () => {
    if (!userId) return;
    const [teacherRes, scheduleRes] = await Promise.all([
      supabase.from("teachers").select("*").eq("user_id", userId).maybeSingle(),
      teacher ? supabase.from("schedule_classes").select("id").eq("teacher_id", teacher.id).limit(1) : Promise.resolve({ data: [] }),
    ]);
    if (teacherRes.data) setTeacher(teacherRes.data);
    setHasSchedule((scheduleRes.data?.length || 0) > 0);
  };

  // Fetch classes and bookings for the week
  useEffect(() => {
    if (!teacher) return;
    const fetchSchedule = async () => {
      const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
      let clsQuery = supabase
        .from("schedule_classes")
        .select("*")
        .eq("teacher_id", teacher.id)
        .gte("date", fmtDate(monday))
        .lte("date", fmtDate(sunday))
        .eq("cancelled", false)
        .order("date")
        .order("start_time");
      if (selectedBranchId) clsQuery = clsQuery.eq("branch_id", selectedBranchId);

      const { data: cls } = await clsQuery;
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
  }, [monday, teacher, selectedBranchId]);

  const getDir = (id: string) => directions.find(d => d.id === id);
  const getBrowseTeacher = (id: string) => browseTeachers.find(t => t.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const getBrowseRoom = (id: string) => browseRooms.find(r => r.id === id);
  const todayStr = fmtDate(new Date());

  const formatHours = (n: number) => {
    if (n === 1) return "1 час";
    if (n >= 2 && n <= 4) return `${n} часа`;
    return `${n} часов`;
  };

  const groupSubscriptions = userSubscriptions.filter(s => (s.subscription_type?.type || 'group') === 'group');
  const individualSubscriptions = userSubscriptions.filter(s => s.subscription_type?.type?.startsWith('individual'));
  const activeSubscription = userSubscriptions.length > 0 ? userSubscriptions[0] : null;

  const classesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const date of weekDates) map[date] = [];
    for (const c of classes) {
      if (map[c.date]) map[c.date].push(c);
    }
    return map;
  }, [classes, weekDates]);

  const browseClassesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const date of browseWeekDates) map[date] = [];
    for (const c of browseClasses) {
      if (map[c.date]) map[c.date].push(c);
    }
    return map;
  }, [browseClasses, browseWeekDates]);

  const browseMaxClasses = useMemo(() => Math.max(1, ...Object.values(browseClassesByDate).map(arr => arr.length)), [browseClassesByDate]);

  // Fetch browse schedule
  useEffect(() => {
    if (!userId) return;
    const fetchBrowseSchedule = async () => {
      const sunday = new Date(browseMonday); sunday.setDate(sunday.getDate() + 6);
      let clsQuery = supabase.from("schedule_classes").select("*").gte("date", fmtDate(browseMonday)).lte("date", fmtDate(sunday)).eq("cancelled", false).order("date").order("start_time");
      if (selectedBranchId) clsQuery = clsQuery.eq("branch_id", selectedBranchId);
      const [clsRes, tchRes, rmRes] = await Promise.all([
        clsQuery,
        supabase.from("teachers").select("*").eq("active", true),
        supabase.from("rooms").select("*").eq("active", true),
      ]);
      setBrowseClasses(clsRes.data || []);
      setBrowseTeachers(tchRes.data || []);
      setBrowseRooms(rmRes.data || []);

      if (clsRes.data && clsRes.data.length > 0) {
        const ids = clsRes.data.map((c: any) => c.id);
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("class_id")
          .eq("user_id", userId)
          .in("class_id", ids);
        setBrowseBookings(new Set((bookingsData || []).map((b: any) => b.class_id)));
      } else {
        setBrowseBookings(new Set());
      }
    };
    fetchBrowseSchedule();
  }, [browseMonday, userId, selectedBranchId]);

  // Fetch all teacher bookings
  const fetchAllTeacherBookings = async (uid: string) => {
    setAllBookingsLoading(true);
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (!bookingsData || bookingsData.length === 0) {
      setAllTeacherBookings([]);
      setAllBookingsLoading(false);
      return;
    }
    const classIds = bookingsData.map(b => b.class_id);
    const { data: classesData } = await supabase
      .from("schedule_classes")
      .select("*")
      .in("id", classIds)
      .order("date").order("start_time");
    const classMap = new Map((classesData || []).map(c => [c.id, c]));
    const enriched = bookingsData
      .map(b => ({ ...b, class: classMap.get(b.class_id) }))
      .filter(b => b.class)
      .sort((a, b) => `${a.class.date}T${a.class.start_time}`.localeCompare(`${b.class.date}T${b.class.start_time}`));
    setAllTeacherBookings(enriched);
    setAllBookingsLoading(false);
  };

  const isWithin6Hours = (cls: any) => {
    const classStart = new Date(`${cls.date}T${cls.start_time}`);
    return classStart.getTime() - Date.now() < 6 * 60 * 60 * 1000;
  };

  const handleBooking = async (classId: string) => {
    setBookingLoading(classId);
    if (browseBookings.has(classId)) {
      const cls = browseClasses.find((c: any) => c.id === classId);
      if (cls && isWithin6Hours(cls)) {
        toast.error("Отмена невозможна менее чем за 6 часов до начала занятия");
        setBookingLoading(null);
        return;
      }
      const { error } = await supabase.from("bookings").delete().eq("user_id", userId).eq("class_id", classId);
      if (error) { toast.error("Ошибка отмены записи"); }
      else {
        setBrowseBookings(prev => { const n = new Set(prev); n.delete(classId); return n; });
        toast.success("Запись отменена");
      }
    } else {
      if (activeSubscription && (activeSubscription as any).frozen) {
        toast.error("Ваш абонемент заморожен. Запись на занятия временно недоступна.");
        setBookingLoading(null);
        return;
      }
      if (!activeSubscription || activeSubscription.hours_remaining <= 0) {
        setActiveTab("subscriptions");
        setNoSubDialogOpen(true);
        setBookingLoading(null);
        return;
      }
      setConfirmBookingClassId(classId);
      setBookingLoading(null);
      return;
    }
    setBookingLoading(null);
  };

  const confirmBooking = async () => {
    if (!confirmBookingClassId) return;
    setBookingLoading(confirmBookingClassId);
    setConfirmBookingClassId(null);
    const { error } = await supabase.from("bookings").insert({ user_id: userId, class_id: confirmBookingClassId });
    if (error) { toast.error("Ошибка записи на занятие"); }
    else {
      setBrowseBookings(prev => new Set(prev).add(confirmBookingClassId));
      toast.success("Вы записаны на занятие!");
    }
    setBookingLoading(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из системы");
    navigate("/");
  };

  const handleCancelClass = async (classId: string) => {
    setCancellingClassId(classId);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-class', {
        body: { classId },
      });
      if (error) throw error;
      toast.success(`Занятие отменено. Уведомлено учеников: ${data?.cancelledBookings || 0}`);
      setCancelDialogClassId(null);
      // Refresh schedule
      setWeekOffset(w => w); // trigger re-fetch
      // Re-fetch classes
      const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
      let clsQuery = supabase
        .from("schedule_classes")
        .select("*")
        .eq("teacher_id", teacher.id)
        .gte("date", fmtDate(monday))
        .lte("date", fmtDate(sunday))
        .eq("cancelled", false)
        .order("date")
        .order("start_time");
      if (selectedBranchId) clsQuery = clsQuery.eq("branch_id", selectedBranchId);
      const { data: cls } = await clsQuery;
      setClasses(cls || []);
      setBookingsMap({});
    } catch {
      toast.error("Ошибка при отмене занятия");
    } finally {
      setCancellingClassId(null);
    }
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
          <BranchSelector variant="dashboard" />
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

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "subscriptions") refreshTeacherData(); if (v === "bookings") fetchAllTeacherBookings(userId); }}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-1">
              <User className="h-4 w-4" /> Профиль
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1">
              <CreditCard className="h-4 w-4" /> Абонементы
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1">
              <BookOpen className="h-4 w-4" /> Мои записи
            </TabsTrigger>
            <TabsTrigger value="browse-schedule" className="gap-1">
              <Calendar className="h-4 w-4" /> Расписание
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1">
              <Users className="h-4 w-4" /> Мои занятия
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

            {/* Hours & Salary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-sun" />
                    Часы проведённых занятий
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyStats.length > 0 ? (
                    <div className="space-y-2">
                      {monthlyStats.map(s => (
                        <div key={s.month} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{s.month}</span>
                          <span className="font-display font-bold text-foreground">{s.hours} ч</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Нет данных за последние месяцы</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4 text-sun" />
                    Заработная плата
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Формула: стоимость часа × учеников − 5% налог, ÷ 2</p>
                </CardHeader>
                <CardContent>
                  {monthlyStats.length > 0 ? (
                    <div className="space-y-2">
                      {monthlyStats.map(s => (
                        <div key={s.month} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{s.month}</span>
                          <span className="font-display font-bold text-foreground">{s.salary.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Нет данных за последние месяцы</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscriptions tab */}
          <TabsContent value="subscriptions">
            {hasSchedule && (teacher?.discount_percent ?? 20) > 0 ? (
              <div className="mb-4 rounded-lg border border-sun/30 bg-sun/5 p-3">
                <p className="text-sm text-foreground font-medium">🎓 Скидка преподавателя: <span className="text-sun font-bold">{teacher?.discount_percent ?? 20}%</span> на все абонементы</p>
              </div>
            ) : (
              <div className="mb-4 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">{hasSchedule ? "Скидка преподавателя не установлена." : "Скидка станет доступна после того, как администратор добавит вас в расписание занятий."}</p>
              </div>
            )}
            <Tabs value={subTab} onValueChange={setSubTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="group">Групповые</TabsTrigger>
                <TabsTrigger value="individual">Индивидуальные</TabsTrigger>
                <TabsTrigger value="history">История</TabsTrigger>
              </TabsList>

              <TabsContent value="group">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Групповой абонемент</CardTitle>
                    <Button variant="sun" size="sm" onClick={() => { setBuyDialogType("group"); setBuyDialogOpen(true); }}>
                      <CreditCard className="h-4 w-4 mr-1" /> Купить
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {groupSubscriptions.length === 0 ? (
                      <p className="text-muted-foreground">У вас нет активного группового абонемента.</p>
                    ) : (
                      <div className="space-y-3">
                        {groupSubscriptions.map(sub => (
                          <div key={sub.id} className="rounded-lg border border-border p-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <div className="font-display text-base font-bold text-foreground">{sub.subscription_type?.name || "Абонемент"}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Куплен: {new Date(sub.purchased_at).toLocaleDateString("ru-RU")} · Действует до: {new Date(sub.expires_at).toLocaleDateString("ru-RU")}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-display text-xl font-black text-foreground">
                                  {sub.hours_remaining} <span className="text-sm font-normal text-muted-foreground">/ {sub.hours_total}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{formatHours(sub.hours_remaining)} осталось</div>
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-sun transition-all" style={{ width: `${Math.max(0, (sub.hours_remaining / sub.hours_total) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="individual">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Индивидуальный абонемент</CardTitle>
                    <Button variant="sun" size="sm" onClick={() => { setBuyDialogType("individual"); setBuyDialogOpen(true); }}>
                      <CreditCard className="h-4 w-4 mr-1" /> Купить
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {individualSubscriptions.length === 0 ? (
                      <p className="text-muted-foreground">У вас нет активного индивидуального абонемента.</p>
                    ) : (
                      <div className="space-y-3">
                        {individualSubscriptions.map(sub => (
                          <div key={sub.id} className="rounded-lg border border-border p-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <div className="font-display text-base font-bold text-foreground">{sub.subscription_type?.name || "Абонемент"}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Куплен: {new Date(sub.purchased_at).toLocaleDateString("ru-RU")} · Действует до: {new Date(sub.expires_at).toLocaleDateString("ru-RU")}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-display text-xl font-black text-foreground">
                                  {sub.hours_remaining} <span className="text-sm font-normal text-muted-foreground">/ {sub.hours_total}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{formatHours(sub.hours_remaining)} осталось</div>
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-sun transition-all" style={{ width: `${Math.max(0, (sub.hours_remaining / sub.hours_total) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader><CardTitle>История абонемента</CardTitle></CardHeader>
                  <CardContent>
                    {historySubscriptions.length === 0 ? (
                      <p className="text-muted-foreground">Истории абонемента пока нет.</p>
                    ) : (
                      <div className="space-y-3">
                        {historySubscriptions.map(sub => (
                          <div key={sub.id} className="rounded-lg border border-border p-4 opacity-80">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <div className="font-display text-base font-bold text-foreground">{sub.subscription_type?.name || "Абонемент"}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Куплен: {new Date(sub.purchased_at).toLocaleDateString("ru-RU")} · Истёк: {new Date(sub.expires_at).toLocaleDateString("ru-RU")}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-display text-xl font-black text-muted-foreground">
                                  {sub.hours_remaining} <span className="text-sm font-normal">/ {sub.hours_total}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{sub.hours_remaining <= 0 ? "Исчерпан" : "Истёк"}</div>
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-muted-foreground/30 transition-all" style={{ width: `${Math.max(0, (sub.hours_remaining / sub.hours_total) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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

                                <div className="mt-3 pt-3 border-t border-border">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10 w-full"
                                    onClick={() => setCancelDialogClassId(cls.id)}
                                    disabled={cancellingClassId === cls.id}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {cancellingClassId === cls.id ? "Отмена..." : "Отменить занятие"}
                                  </Button>
                                </div>
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

          {/* Browse Schedule tab (booking as student) */}
          <TabsContent value="browse-schedule">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Расписание на неделю</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setBrowseWeekOffset(w => w - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium text-foreground min-w-[180px] text-center">
                    {formatWeekLabel(browseMonday)}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setBrowseWeekOffset(w => w + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {browseWeekOffset !== 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setBrowseWeekOffset(0)} className="text-muted-foreground text-xs">
                      Сегодня
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <WeeklyTimeGrid
                  weekDates={browseWeekDates}
                  classes={browseClasses}
                  directions={directions}
                  teachers={browseTeachers}
                  rooms={browseRooms}
                  today={todayStr}
                  renderClassAction={(cls, dir) => {
                    const isBooked = browseBookings.has(cls.id);
                    if (isBooked && isWithin6Hours(cls)) {
                      return (
                        <div className="w-full text-[10px] font-medium rounded px-1 py-0.5 text-center text-muted-foreground bg-muted italic">
                          Отмена недоступна
                        </div>
                      );
                    }
                    return (
                      <button
                        disabled={bookingLoading === cls.id}
                        onClick={() => handleBooking(cls.id)}
                        className={`w-full text-[10px] font-bold rounded px-1 py-0.5 transition-colors ${
                          isBooked
                            ? 'bg-muted text-foreground hover:bg-destructive/20 hover:text-destructive'
                            : 'text-white hover:opacity-90'
                        }`}
                        style={!isBooked ? { backgroundColor: dir?.color || '#3B82F6' } : undefined}
                      >
                        {isBooked ? 'Отменить' : 'Записаться'}
                      </button>
                    );
                  }}
                />
              </CardContent>
            </Card>

            {/* Confirm booking dialog */}
            <Dialog open={!!confirmBookingClassId} onOpenChange={(open) => { if (!open) setConfirmBookingClassId(null); }}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-sun" />
                    Подтверждение записи
                  </DialogTitle>
                  <DialogDescription>
                    Обратите внимание: отменить запись менее чем за 6 часов до начала занятия будет невозможно. Час абонемента будет списан автоматически.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setConfirmBookingClassId(null)}>Отмена</Button>
                  <Button variant="sun" onClick={confirmBooking}>Записаться</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={noSubDialogOpen} onOpenChange={setNoSubDialogOpen}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="h-5 w-5 text-sun" />
                    Нет активного абонемента
                  </DialogTitle>
                  <DialogDescription>
                    Для записи на занятие необходимо приобрести абонемент. Выберите подходящий вариант и оплатите его.
                  </DialogDescription>
                </DialogHeader>
                <Button
                  variant="sun"
                  className="w-full mt-2"
                  onClick={() => {
                    setNoSubDialogOpen(false);
                    setActiveTab("subscriptions");
                    setSubTab("group");
                    setBuyDialogType("group");
                    setBuyDialogOpen(true);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Купить абонемент
                </Button>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* My Bookings tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Мои записи</CardTitle>
              </CardHeader>
              <CardContent>
                {allBookingsLoading ? (
                  <p className="text-center text-muted-foreground py-6">Загрузка...</p>
                ) : allTeacherBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">У вас пока нет записей на занятия</p>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const now = new Date();
                      const upcoming = allTeacherBookings.filter(b => new Date(`${b.class.date}T${b.class.end_time}`) >= now);
                      const past = allTeacherBookings.filter(b => new Date(`${b.class.date}T${b.class.end_time}`) < now);
                      return (
                        <>
                          {upcoming.length > 0 && (
                            <>
                              <h3 className="font-display text-sm font-bold text-foreground">Предстоящие</h3>
                              {upcoming.map(b => {
                                const cls = b.class;
                                const dir = getDir(cls.direction_id);
                                const tch = getBrowseTeacher(cls.teacher_id);
                                const room = getBrowseRoom(cls.room_id);
                                const canCancel = !isWithin6Hours(cls);
                                const dateObj = new Date(cls.date + 'T00:00');
                                const dayLabel = dateObj.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
                                return (
                                  <div key={b.id} className="rounded-lg p-3 border border-border" style={{ borderLeftWidth: 4, borderLeftColor: dir?.color || '#3B82F6' }}>
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="text-sm font-bold" style={{ color: dir?.color }}>{dir?.name}</div>
                                        <div className="text-xs font-medium text-foreground">{dayLabel}, {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}</div>
                                        <div className="text-xs text-muted-foreground">{tch?.first_name} {tch?.last_name}</div>
                                        {room && <div className="text-xs text-muted-foreground">{room.name}</div>}
                                      </div>
                                      {canCancel ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="shrink-0 text-xs"
                                          disabled={bookingLoading === cls.id}
                                          onClick={async () => {
                                            setBookingLoading(cls.id);
                                            const { error } = await supabase.from("bookings").delete().eq("id", b.id);
                                            if (error) { toast.error("Ошибка отмены записи"); }
                                            else {
                                              setAllTeacherBookings(prev => prev.filter(x => x.id !== b.id));
                                              setBrowseBookings(prev => { const n = new Set(prev); n.delete(cls.id); return n; });
                                              toast.success("Запись отменена");
                                            }
                                            setBookingLoading(null);
                                          }}
                                        >
                                          <X className="h-3 w-3 mr-1" /> Отменить
                                        </Button>
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground italic shrink-0">Отмена недоступна</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </>
                          )}
                          {past.length > 0 && (
                            <>
                              <h3 className="font-display text-sm font-bold text-muted-foreground mt-4">Прошедшие</h3>
                              {past.slice(0, 20).map(b => {
                                const cls = b.class;
                                const dir = getDir(cls.direction_id);
                                const tch = getBrowseTeacher(cls.teacher_id);
                                const dateObj = new Date(cls.date + 'T00:00');
                                const dayLabel = dateObj.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
                                return (
                                  <div key={b.id} className="rounded-lg p-3 border border-border opacity-60">
                                    <div className="text-sm font-bold" style={{ color: dir?.color }}>{dir?.name}</div>
                                    <div className="text-xs font-medium text-foreground">{dayLabel}, {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}</div>
                                    <div className="text-xs text-muted-foreground">{tch?.first_name} {tch?.last_name}</div>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cancel class confirmation dialog */}
        <Dialog open={!!cancelDialogClassId} onOpenChange={(o) => { if (!o) setCancelDialogClassId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Отмена занятия</DialogTitle>
              <DialogDescription>
                Вы уверены, что хотите отменить это занятие? Все записи учеников будут удалены, и они получат уведомление об отмене.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogClassId(null)}>Назад</Button>
              <Button
                variant="destructive"
                disabled={!!cancellingClassId}
                onClick={() => cancelDialogClassId && handleCancelClass(cancelDialogClassId)}
              >
                {cancellingClassId ? "Отмена..." : "Подтвердить отмену"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete account section */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-destructive">Удаление аккаунта</h3>
              <p className="text-xs text-muted-foreground mt-1">Это действие необратимо. Все данные будут удалены.</p>
            </div>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Удалить аккаунт
            </Button>
          </div>
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={(o) => { setDeleteDialogOpen(o); if (!o) setDeleteConfirmText(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Удаление аккаунта</DialogTitle>
              <DialogDescription>
                Все ваши данные и профиль преподавателя будут безвозвратно удалены. Введите <strong>УДАЛИТЬ</strong> для подтверждения.
              </DialogDescription>
            </DialogHeader>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Введите УДАЛИТЬ"
              className="border-destructive/40"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
              <Button
                variant="destructive"
                disabled={deleteConfirmText !== "УДАЛИТЬ" || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "Удаление..." : "Подтвердить удаление"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <BuySubscriptionDialog
        open={buyDialogOpen}
        onOpenChange={(open) => { setBuyDialogOpen(open); if (!open) { refreshTeacherData(); if (userId) fetchSubscriptions(userId); } }}
        subscriptionType={buyDialogType}
        bonusPoints={bonusPoints}
        discountPercent={hasSchedule ? (teacher?.discount_percent ?? 20) : 0}
      />
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <BranchProvider>
      <TeacherDashboardInner />
    </BranchProvider>
  );
}
