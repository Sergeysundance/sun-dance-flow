import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, CreditCard, LogOut, Edit2, Save, ChevronLeft, ChevronRight, Check, X, Clock, AlertTriangle, Trash2, Bell, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import BuySubscriptionDialog from "@/components/BuySubscriptionDialog";
import { BranchProvider, useBranch } from "@/contexts/BranchContext";
import BranchSelector from "@/components/BranchSelector";

interface Profile {
  first_name: string;
  last_name: string;
  middle_name: string;
  phone: string;
  birth_date: string | null;
  preferred_directions: string[] | null;
  notes: string | null;
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

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

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
function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
  const m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${monday.getDate()}–${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

const StudentDashboardInner = () => {
  const { selectedBranchId } = useBranch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [directions, setDirections] = useState<any[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [historySubscriptions, setHistorySubscriptions] = useState<UserSubscription[]>([]);

  // Schedule state
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [schedTeachers, setSchedTeachers] = useState<any[]>([]);
  const [schedRooms, setSchedRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<Set<string>>(new Set());
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyDialogType, setBuyDialogType] = useState<string>("group");
  const [noSubDialogOpen, setNoSubDialogOpen] = useState(false);
  const [confirmBookingClassId, setConfirmBookingClassId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [subTab, setSubTab] = useState("group");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [monthlyHours, setMonthlyHours] = useState<{ month: string; hours: number }[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allBookingsLoading, setAllBookingsLoading] = useState(false);

  const monday = useMemo(() => {
    const m = getMonday(new Date()); m.setDate(m.getDate() + weekOffset * 7); return m;
  }, [weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i); return fmtDate(d);
  }), [monday]);

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

  const fetchSubscriptions = async (uid: string) => {
    // Active subscriptions
    const { data: activeSubs } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", uid)
      .eq("active", true)
      .gte("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true });

    setUserSubscriptions(await enrichSubscriptions(activeSubs || []));

    // History: inactive or expired
    const { data: historySubs } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", uid)
      .or(`active.eq.false,expires_at.lt.${new Date().toISOString()}`)
      .order("expires_at", { ascending: false });

    setHistorySubscriptions(await enrichSubscriptions(historySubs || []));
  };

  const fetchMonthlyHours = async (uid: string) => {
    // Get all user subscription IDs first
    const { data: userSubs } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("user_id", uid);
    if (!userSubs || userSubs.length === 0) { setMonthlyHours([]); return; }
    const subIds = userSubs.map(s => s.id);
    const { data: deductions } = await supabase
      .from("subscription_deductions")
      .select("hours_deducted, deducted_at")
      .in("user_subscription_id", subIds)
      .order("deducted_at", { ascending: false });
    if (!deductions || deductions.length === 0) { setMonthlyHours([]); return; }
    const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    const grouped: Record<string, number> = {};
    for (const d of deductions) {
      const dt = new Date(d.deducted_at);
      const key = `${dt.getFullYear()}-${String(dt.getMonth()).padStart(2,'0')}`;
      grouped[key] = (grouped[key] || 0) + Number(d.hours_deducted);
    }
    const sorted = Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .map(([key, hours]) => {
        const [y, m] = key.split('-');
        return { month: `${monthNames[parseInt(m)]} ${y}`, hours };
      });
    setMonthlyHours(sorted);
  };

  const fetchAllBookings = async (uid: string) => {
    setAllBookingsLoading(true);
    const todayDate = fmtDate(new Date());
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (!bookingsData || bookingsData.length === 0) {
      setAllBookings([]);
      setAllBookingsLoading(false);
      return;
    }
    const classIds = bookingsData.map(b => b.class_id);
    const { data: classesData } = await supabase
      .from("schedule_classes")
      .select("*")
      .in("id", classIds)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });
    const classMap = new Map((classesData || []).map(c => [c.id, c]));
    const enriched = bookingsData
      .map(b => ({ ...b, class: classMap.get(b.class_id) }))
      .filter(b => b.class)
      .sort((a, b) => {
        const dateA = `${a.class.date}T${a.class.start_time}`;
        const dateB = `${b.class.date}T${b.class.start_time}`;
        return dateA.localeCompare(dateB);
      });
    setAllBookings(enriched);
    setAllBookingsLoading(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/"); return; }
      setUserEmail(session.user.email || "");
      setUserId(session.user.id);
      const [profileRes, dirsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", session.user.id).single(),
        supabase.from("directions").select("*").eq("active", true),
      ]);
      if (profileRes.data) { setProfile(profileRes.data); setEditData(profileRes.data); setBonusPoints((profileRes.data as any).bonus_points ?? 0); setDiscountPercent((profileRes.data as any).discount_percent ?? 0); }
      if (dirsRes.data) setDirections(dirsRes.data);
      await fetchSubscriptions(session.user.id);
      await fetchMonthlyHours(session.user.id);
      // Fetch notifications
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (notifs) {
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: any) => !n.read).length);
      }
      setLoading(false);
      // Fetch all upcoming bookings
      fetchAllBookings(session.user.id);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  // Fetch schedule + bookings when week changes
  useEffect(() => {
    const fetchSchedule = async () => {
      const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6);
      let clsQuery = supabase.from("schedule_classes").select("*").gte("date", fmtDate(monday)).lte("date", fmtDate(sunday)).eq("cancelled", false).order("date").order("start_time");
      if (selectedBranchId) clsQuery = clsQuery.eq("branch_id", selectedBranchId);
      const [clsRes, tchRes, rmRes] = await Promise.all([
        clsQuery,
        supabase.from("teachers").select("*").eq("active", true),
        supabase.from("rooms").select("*").eq("active", true),
      ]);
      setScheduleData(clsRes.data || []);
      setSchedTeachers(tchRes.data || []);
      setSchedRooms(rmRes.data || []);

      if (userId && clsRes.data && clsRes.data.length > 0) {
        const ids = clsRes.data.map((c: any) => c.id);
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("class_id")
          .eq("user_id", userId)
          .in("class_id", ids);
        setBookings(new Set((bookingsData || []).map((b: any) => b.class_id)));
      } else {
        setBookings(new Set());
      }
    };
    if (userId) fetchSchedule();
  }, [monday, userId, selectedBranchId]);

  const classesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const date of weekDates) map[date] = [];
    for (const c of scheduleData) {
      if (map[c.date]) {
        map[c.date].push(c);
      }
    }
    return map;
  }, [scheduleData, weekDates]);

  const maxClasses = useMemo(() => Math.max(1, ...Object.values(classesByDate).map(arr => arr.length)), [classesByDate]);
  const todayStr = fmtDate(new Date());
  const getDir = (id: string) => directions.find((d: any) => d.id === id);
  const getTeacher = (id: string) => schedTeachers.find((t: any) => t.id === id);
  const getRoom = (id: string) => schedRooms.find((r: any) => r.id === id);

  const isWithin6Hours = (cls: any) => {
    const classStart = new Date(`${cls.date}T${cls.start_time}`);
    return classStart.getTime() - Date.now() < 6 * 60 * 60 * 1000;
  };

  const handleBooking = async (classId: string) => {
    setBookingLoading(classId);
    if (bookings.has(classId)) {
      const cls = scheduleData.find((c: any) => c.id === classId);
      if (cls && isWithin6Hours(cls)) {
        toast.error("Отмена невозможна менее чем за 6 часов до начала занятия");
        setBookingLoading(null);
        return;
      }
      const { error } = await supabase.from("bookings").delete().eq("user_id", userId).eq("class_id", classId);
      if (error) { toast.error("Ошибка отмены записи"); }
      else {
        setBookings(prev => { const n = new Set(prev); n.delete(classId); return n; });
        toast.success("Запись отменена");
      }
    } else {
      // Check if subscription is frozen
      if (activeSubscription && (activeSubscription as any).frozen) {
        toast.error("Ваш абонемент заморожен. Запись на занятия временно недоступна.");
        setBookingLoading(null);
        return;
      }
      // Check for active subscription before booking
      if (!activeSubscription || activeSubscription.hours_remaining <= 0) {
        setActiveTab("subscriptions");
        setNoSubDialogOpen(true);
        setBookingLoading(null);
        return;
      }
      // Show confirmation dialog with cancellation warning
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
      setBookings(prev => new Set(prev).add(confirmBookingClassId));
      toast.success("Вы записаны на занятие!");
    }
    setBookingLoading(null);
  };

  const handleSave = async () => {
    if (!editData) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from("profiles").update({
      first_name: editData.first_name, last_name: editData.last_name,
      middle_name: editData.middle_name,
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "УДАЛИТЬ") return;
    setDeleting(true);
    try {
      // Delete profile and related data
      await supabase.from("bookings").delete().eq("user_id", userId);
      await supabase.from("user_subscriptions").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("user_id", userId);
      
      // Sign out (actual auth user deletion requires admin/service role)
      await supabase.auth.signOut();
      toast.success("Аккаунт удалён");
      navigate("/");
    } catch {
      toast.error("Ошибка удаления аккаунта");
    } finally {
      setDeleting(false);
    }
  };

  const formatHours = (n: number) => {
    if (n === 1) return "1 час";
    if (n >= 2 && n <= 4) return `${n} часа`;
    return `${n} часов`;
  };

  // Active subscription summary for profile tab
  const activeSubscription = userSubscriptions.length > 0 ? userSubscriptions[0] : null;
  const groupSubscriptions = userSubscriptions.filter(s => (s.subscription_type?.type || 'group') === 'group');
  const individualSubscriptions = userSubscriptions.filter(s => s.subscription_type?.type?.startsWith('individual'));

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
          <BranchSelector variant="dashboard" />
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <TabsTrigger value="schedule" className="gap-1">
              <Calendar className="h-4 w-4" /> Расписание
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 relative">
              <Bell className="h-4 w-4" /> Уведомления
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile">
            {/* Subscription cards on profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Group subscription */}
              {(() => {
                const groupSub = groupSubscriptions[0];
                if (groupSub) {
                  return (
                    <Card className="border-sun/30">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sun/20">
                            <CreditCard className="h-5 w-5 text-sun" />
                          </div>
                          <div>
                            <div className="font-display text-sm font-bold text-foreground">
                              {groupSub.subscription_type?.name || "Групповой абонемент"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              до {new Date(groupSub.expires_at).toLocaleDateString("ru-RU")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-sun" />
                          <span className="font-display text-lg font-black text-foreground">
                            {groupSub.hours_remaining}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            / {groupSub.hours_total} {formatHours(groupSub.hours_total)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sun transition-all"
                            style={{ width: `${Math.max(0, (groupSub.hours_remaining / groupSub.hours_total) * 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <Card className="border-border">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-display text-sm font-bold text-foreground">Групповой</div>
                            <div className="text-xs text-muted-foreground">не активен</div>
                          </div>
                        </div>
                        <Button variant="sun" size="sm" onClick={() => { setBuyDialogType("group"); setBuyDialogOpen(true); }}>
                          Купить
                        </Button>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-muted-foreground/20 w-0" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Individual subscription */}
              {(() => {
                const indSub = individualSubscriptions[0];
                if (indSub) {
                  return (
                    <Card className="border-sun/30">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sun/20">
                            <CreditCard className="h-5 w-5 text-sun" />
                          </div>
                          <div>
                            <div className="font-display text-sm font-bold text-foreground">
                              {indSub.subscription_type?.name || "Индивидуальный абонемент"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              до {new Date(indSub.expires_at).toLocaleDateString("ru-RU")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-sun" />
                          <span className="font-display text-lg font-black text-foreground">
                            {indSub.hours_remaining}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            / {indSub.hours_total} {formatHours(indSub.hours_total)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sun transition-all"
                            style={{ width: `${Math.max(0, (indSub.hours_remaining / indSub.hours_total) * 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <Card className="border-border">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-display text-sm font-bold text-foreground">Индивидуальный</div>
                            <div className="text-xs text-muted-foreground">не активен</div>
                          </div>
                        </div>
                        <Button variant="sun" size="sm" onClick={() => { setBuyDialogType("individual"); setBuyDialogOpen(true); }}>
                          Купить
                        </Button>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-muted-foreground/20 w-0" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>

            {/* Bonus points card */}
            <Card className="border-sun/30 mb-4">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sun/20">
                    <span className="text-sun text-lg">★</span>
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-foreground">Бонусные баллы</div>
                    <div className="text-xs text-muted-foreground">Используйте при оплате абонементов</div>
                  </div>
                  <span className="ml-auto font-display text-2xl font-black text-sun">{bonusPoints}</span>
                </div>
              </CardContent>
            </Card>

            {/* Discount card */}
            {discountPercent > 0 && (
              <Card className="border-sun/30 mb-4">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sun/20">
                      <span className="text-sun text-lg">🏷️</span>
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold text-foreground">Постоянная скидка</div>
                      <div className="text-xs text-muted-foreground">Применяется при покупке абонементов</div>
                    </div>
                    <span className="ml-auto font-display text-2xl font-black text-sun">{discountPercent}%</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border mb-4">
              <CardContent className="py-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-foreground">Мои часы занятий</div>
                    <div className="text-xs text-muted-foreground">Статистика по месяцам</div>
                  </div>
                </div>
                {monthlyHours.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Пока нет данных о посещениях</p>
                ) : (
                  <div className="space-y-2">
                    {monthlyHours.map((item) => (
                      <div key={item.month} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.month}</span>
                        <span className="font-display font-bold text-foreground">{item.hours} {item.hours === 1 ? 'час' : item.hours >= 2 && item.hours <= 4 ? 'часа' : 'часов'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
                    <Label>Фамилия</Label>
                    {editing ? (
                      <Input className="border-muted-foreground/40" value={editData?.last_name || ""} onChange={e => setEditData(prev => prev ? { ...prev, last_name: e.target.value } : prev)} />
                    ) : (
                      <p className="text-foreground mt-1">{profile?.last_name || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label>Имя</Label>
                    {editing ? (
                      <Input className="border-muted-foreground/40" value={editData?.first_name || ""} onChange={e => setEditData(prev => prev ? { ...prev, first_name: e.target.value } : prev)} />
                    ) : (
                      <p className="text-foreground mt-1">{profile?.first_name || "—"}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Отчество</Label>
                  {editing ? (
                    <Input className="border-muted-foreground/40" value={editData?.middle_name || ""} onChange={e => setEditData(prev => prev ? { ...prev, middle_name: e.target.value } : prev)} />
                  ) : (
                    <p className="text-foreground mt-1">{profile?.middle_name || "—"}</p>
                  )}
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
            <Tabs value={subTab} onValueChange={setSubTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="group">Групповые</TabsTrigger>
                <TabsTrigger value="individual">Индивидуальные</TabsTrigger>
                <TabsTrigger value="history">История</TabsTrigger>
              </TabsList>

              {/* Group subscriptions */}
              <TabsContent value="group">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Групповые абонементы</CardTitle>
                    <Button variant="sun" size="sm" onClick={() => { setBuyDialogType("group"); setBuyDialogOpen(true); }}>
                      <CreditCard className="h-4 w-4 mr-1" /> Купить
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {groupSubscriptions.length === 0 ? (
                      <p className="text-muted-foreground">У вас нет активных групповых абонементов.</p>
                    ) : (
                      <div className="space-y-3">
                        {groupSubscriptions.map(sub => {
                          const isFrozen = (sub as any).frozen === true;
                          const wasFrozen = (sub as any).was_frozen === true;
                          const frozenUntil = (sub as any).frozen_until ? new Date((sub as any).frozen_until) : null;
                          const frozenAt = (sub as any).frozen_at ? new Date((sub as any).frozen_at) : null;
                          return (
                          <div key={sub.id} className={`rounded-lg border p-4 ${isFrozen ? 'border-blue-300 bg-blue-50/30' : 'border-border'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <div className="font-display text-base font-bold text-foreground">
                                  {sub.subscription_type?.name || "Абонемент"}
                                  {isFrozen && <span className="ml-2 text-xs text-blue-600">❄️ Заморожен</span>}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Куплен: {new Date(sub.purchased_at).toLocaleDateString("ru-RU")} · Действует до: {new Date(sub.expires_at).toLocaleDateString("ru-RU")}
                                </div>
                                {isFrozen && frozenUntil && (
                                  <div className="text-xs text-blue-600 mt-0.5">
                                    Заморозка до {frozenUntil.toLocaleDateString("ru-RU")} · Срок действия продлён на 7 дней
                                  </div>
                                )}
                                {!isFrozen && wasFrozen && frozenAt && frozenUntil && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    ❄️ Был заморожен {frozenAt.toLocaleDateString("ru-RU")} — {frozenUntil.toLocaleDateString("ru-RU")}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-display text-xl font-black text-foreground">
                                  {sub.hours_remaining} <span className="text-sm font-normal text-muted-foreground">/ {sub.hours_total}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{formatHours(sub.hours_remaining)} осталось</div>
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-sun transition-all"
                                style={{ width: `${Math.max(0, (sub.hours_remaining / sub.hours_total) * 100)}%` }}
                              />
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Individual subscriptions */}
              <TabsContent value="individual">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Индивидуальные абонементы</CardTitle>
                    <Button variant="sun" size="sm" onClick={() => { setBuyDialogType("individual"); setBuyDialogOpen(true); }}>
                      <CreditCard className="h-4 w-4 mr-1" /> Купить
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {individualSubscriptions.length === 0 ? (
                      <p className="text-muted-foreground">У вас нет активных индивидуальных абонементов.</p>
                    ) : (
                      <div className="space-y-3">
                        {individualSubscriptions.map(sub => {
                          const isFrozen = (sub as any).frozen === true;
                          const wasFrozen = (sub as any).was_frozen === true;
                          const frozenUntil = (sub as any).frozen_until ? new Date((sub as any).frozen_until) : null;
                          const frozenAt = (sub as any).frozen_at ? new Date((sub as any).frozen_at) : null;
                          return (
                          <div key={sub.id} className={`rounded-lg border p-4 ${isFrozen ? 'border-blue-300 bg-blue-50/30' : 'border-border'}`}>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <div className="font-display text-base font-bold text-foreground">
                                  {sub.subscription_type?.name || "Абонемент"}
                                  {isFrozen && <span className="ml-2 text-xs text-blue-600">❄️ Заморожен</span>}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Куплен: {new Date(sub.purchased_at).toLocaleDateString("ru-RU")} · Действует до: {new Date(sub.expires_at).toLocaleDateString("ru-RU")}
                                </div>
                                {isFrozen && frozenUntil && (
                                  <div className="text-xs text-blue-600 mt-0.5">
                                    Заморозка до {frozenUntil.toLocaleDateString("ru-RU")} · Срок действия продлён на 7 дней
                                  </div>
                                )}
                                {!isFrozen && wasFrozen && frozenAt && frozenUntil && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    ❄️ Был заморожен {frozenAt.toLocaleDateString("ru-RU")} — {frozenUntil.toLocaleDateString("ru-RU")}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-display text-xl font-black text-foreground">
                                  {sub.hours_remaining} <span className="text-sm font-normal text-muted-foreground">/ {sub.hours_total}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">{formatHours(sub.hours_remaining)} осталось</div>
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-sun transition-all"
                                style={{ width: `${Math.max(0, (sub.hours_remaining / sub.hours_total) * 100)}%` }}
                              />
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>История абонементов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {historySubscriptions.length === 0 ? (
                      <p className="text-muted-foreground">Использованных абонементов пока нет.</p>
                    ) : (
                      <div className="space-y-3">
                        {historySubscriptions.map(sub => (
                          <div key={sub.id} className="rounded-lg border border-border p-4 opacity-80">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <div className="font-display text-base font-bold text-foreground">
                                  {sub.subscription_type?.name || "Абонемент"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Куплен: {new Date(sub.purchased_at).toLocaleDateString("ru-RU")} · Истёк: {new Date(sub.expires_at).toLocaleDateString("ru-RU")}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-display text-xl font-black text-muted-foreground">
                                  {sub.hours_remaining} <span className="text-sm font-normal">/ {sub.hours_total}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {sub.hours_remaining <= 0 ? "Исчерпан" : "Истёк"}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-muted-foreground/30 transition-all"
                                style={{ width: `${Math.max(0, (sub.hours_remaining / sub.hours_total) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

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
                ) : allBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">У вас пока нет записей на занятия</p>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      const now = new Date();
                      const upcoming = allBookings.filter(b => new Date(`${b.class.date}T${b.class.end_time}`) >= now);
                      const past = allBookings.filter(b => new Date(`${b.class.date}T${b.class.end_time}`) < now);
                      return (
                        <>
                          {upcoming.length > 0 && (
                            <>
                              <h3 className="font-display text-sm font-bold text-foreground">Предстоящие</h3>
                              {upcoming.map(b => {
                                const cls = b.class;
                                const dir = getDir(cls.direction_id);
                                const teacher = getTeacher(cls.teacher_id);
                                const room = getRoom(cls.room_id);
                                const canCancel = !isWithin6Hours(cls);
                                const dateObj = new Date(cls.date + 'T00:00');
                                const dayLabel = dateObj.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
                                return (
                                  <div key={b.id} className="rounded-lg p-3 border border-border" style={{ borderLeftWidth: 4, borderLeftColor: dir?.color || '#3B82F6' }}>
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="text-sm font-bold" style={{ color: dir?.color }}>{dir?.name}</div>
                                        <div className="text-xs font-medium text-foreground">{dayLabel}, {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}</div>
                                        <div className="text-xs text-muted-foreground">{teacher?.first_name} {teacher?.last_name}</div>
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
                                              setAllBookings(prev => prev.filter(x => x.id !== b.id));
                                              setBookings(prev => { const n = new Set(prev); n.delete(cls.id); return n; });
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
                                const teacher = getTeacher(cls.teacher_id);
                                const dateObj = new Date(cls.date + 'T00:00');
                                const dayLabel = dateObj.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
                                return (
                                  <div key={b.id} className="rounded-lg p-3 border border-border opacity-60">
                                    <div className="text-sm font-bold" style={{ color: dir?.color }}>{dir?.name}</div>
                                    <div className="text-xs font-medium text-foreground">{dayLabel}, {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}</div>
                                    <div className="text-xs text-muted-foreground">{teacher?.first_name} {teacher?.last_name}</div>
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
                {/* Mobile: card list */}
                <div className="sm:hidden space-y-3">
                  {weekDates.map((date, i) => {
                    const classes = classesByDate[date] || [];
                    if (classes.length === 0) return null;
                    const dateObj = new Date(date + 'T00:00');
                    const isToday = date === todayStr;
                    return (
                      <div key={date}>
                        <div className={`text-sm font-bold mb-1.5 ${isToday ? 'text-sun' : 'text-foreground'}`}>
                          {DAYS_SHORT[i]}, {dateObj.getDate()}{isToday ? ' — сегодня' : ''}
                        </div>
                        <div className="space-y-2">
                          {classes.map((cls: any) => {
                            const dir = getDir(cls.direction_id);
                            const teacher = getTeacher(cls.teacher_id);
                            const room = getRoom(cls.room_id);
                            const isBooked = bookings.has(cls.id);
                            return (
                              <div key={cls.id} className="rounded-lg p-3 border border-border" style={{ borderLeftWidth: 4, borderLeftColor: dir?.color || '#3B82F6' }}>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-sm font-bold" style={{ color: dir?.color }}>{dir?.name}</div>
                                    <div className="text-xs text-foreground font-medium">{cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}</div>
                                    <div className="text-xs text-muted-foreground">{teacher?.first_name} {teacher?.last_name}</div>
                                    <div className="text-xs text-muted-foreground">{room?.name}</div>
                                  </div>
                                  {isBooked && isWithin6Hours(cls) ? (
                                    <span className="text-[10px] text-muted-foreground italic">Отмена недоступна</span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant={isBooked ? "outline" : "sun"}
                                      disabled={bookingLoading === cls.id}
                                      onClick={() => handleBooking(cls.id)}
                                      className="shrink-0 text-xs"
                                    >
                                      {isBooked ? <><X className="h-3 w-3 mr-1" />Отменить</> : <><Check className="h-3 w-3 mr-1" />Записаться</>}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {!weekDates.some(d => (classesByDate[d] || []).length > 0) && (
                    <p className="text-center text-muted-foreground py-6">Нет занятий на этой неделе</p>
                  )}
                </div>

                {/* Desktop: table */}
                <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
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
                          if (!cls) return <div key={colIdx} className={`border-r border-border last:border-r-0 min-h-[90px] ${isToday ? 'bg-sun/5' : ''}`} />;
                          const dir = getDir(cls.direction_id);
                          const teacher = getTeacher(cls.teacher_id);
                          const room = getRoom(cls.room_id);
                          const isBooked = bookings.has(cls.id);
                          return (
                            <div key={colIdx} className={`border-r border-border last:border-r-0 p-1 min-h-[90px] ${isToday ? 'bg-sun/5' : ''}`}>
                              <div
                                className="rounded-md p-2 h-full space-y-0.5 flex flex-col"
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
                                <div className="mt-auto pt-1">
                                  {isBooked && isWithin6Hours(cls) ? (
                                    <div className="w-full text-[10px] font-medium rounded px-1 py-0.5 text-center text-muted-foreground bg-muted italic">
                                      Отмена недоступна
                                    </div>
                                  ) : (
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
                                  )}
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
              </CardContent>
            </Card>
          </TabsContent>
          {/* Notifications tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Уведомления</CardTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
                      for (const id of unreadIds) {
                        await supabase.from("notifications").update({ read: true }).eq("id", id);
                      }
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      setUnreadCount(0);
                    }}
                  >
                    Прочитать все
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Нет уведомлений</p>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-lg border ${!n.read ? 'bg-sun/5 border-sun/20' : 'border-border'}`}
                        onClick={async () => {
                          if (!n.read) {
                            await supabase.from("notifications").update({ read: true }).eq("id", n.id);
                            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                            setUnreadCount(prev => Math.max(0, prev - 1));
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-sun flex-shrink-0" />}
                            <div>
                              <p className="font-semibold text-sm text-foreground">{n.title}</p>
                              <p className="text-sm text-muted-foreground mt-1">{n.message}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {new Date(n.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <BuySubscriptionDialog
          open={buyDialogOpen}
          subscriptionType={buyDialogType}
          bonusPoints={bonusPoints}
          discountPercent={discountPercent}
          onOpenChange={async (open) => {
            setBuyDialogOpen(open);
            if (!open && userId) {
              fetchSubscriptions(userId);
              // Refresh bonus points and discount
              const { data: p } = await supabase.from("profiles").select("bonus_points, discount_percent").eq("user_id", userId).single();
              if (p) {
                setBonusPoints((p as any).bonus_points ?? 0);
                setDiscountPercent((p as any).discount_percent ?? 0);
              }
            }
          }}
        />

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

        {/* Delete confirmation dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={(o) => { setDeleteDialogOpen(o); if (!o) setDeleteConfirmText(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-destructive">Удаление аккаунта</DialogTitle>
              <DialogDescription>
                Все ваши данные, абонементы и записи на занятия будут безвозвратно удалены. Введите <strong>УДАЛИТЬ</strong> для подтверждения.
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
    </div>
  );
};

const StudentDashboard = () => (
  <BranchProvider>
    <StudentDashboardInner />
  </BranchProvider>
);

export default StudentDashboard;
