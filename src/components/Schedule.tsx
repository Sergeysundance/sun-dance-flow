import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthDialog from "./AuthDialog";
import WeeklyTimeGrid from "./WeeklyTimeGrid";
import { useBranch } from "@/contexts/BranchContext";

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${monday.getDate()}–${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

const Schedule = () => {
  const { selectedBranchId } = useBranch();
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [directions, setDirections] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const monday = useMemo(() => {
    const m = getMonday(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return fmt(d);
  }), [monday]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);

      let clsQuery = supabase.from("schedule_classes").select("*").gte("date", fmt(monday)).lte("date", fmt(sunday)).order("date").order("start_time");
      if (selectedBranchId) clsQuery = clsQuery.eq("branch_id", selectedBranchId);

      let dirsQuery = supabase.from("directions").select("*").eq("active", true);
      if (selectedBranchId) dirsQuery = dirsQuery.eq("branch_id", selectedBranchId);

      let roomsQuery = supabase.from("rooms").select("*").eq("active", true);
      if (selectedBranchId) roomsQuery = roomsQuery.eq("branch_id", selectedBranchId);

      const [classesRes, dirsRes, teachersRes, roomsRes] = await Promise.all([
        clsQuery,
        dirsQuery,
        supabase.from("teachers").select("*").eq("active", true),
        roomsQuery,
      ]);

      setScheduleData(classesRes.data || []);
      setDirections(dirsRes.data || []);
      setTeachers(teachersRes.data || []);
      setRooms(roomsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [monday, selectedBranchId]);

  const today = fmt(new Date());

  const handleSignUp = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="schedule" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 text-center font-display text-3xl font-black uppercase text-foreground sm:text-5xl"
        >
          РАСПИСАНИЕ
        </motion.h2>

        <div className="mb-6 flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w - 1)} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-body text-sm font-medium text-foreground sm:text-base">
            {formatWeekLabel(monday)}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setWeekOffset(w => w + 1)} className="text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-5 w-5" />
          </Button>
          {weekOffset !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-muted-foreground text-xs">
              Сегодня
            </Button>
          )}
        </div>

        {loading && (
          <p className="text-center text-muted-foreground">Загрузка...</p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl"
        >
          <WeeklyTimeGrid
            weekDates={weekDates}
            classes={scheduleData}
            directions={directions}
            teachers={teachers}
            rooms={rooms}
            today={today}
            renderClassAction={(cls) => (
              <Button
                variant="sun"
                size="sm"
                className="text-[8px] px-2 h-5 w-full"
                onClick={handleSignUp}
              >
                Записаться
              </Button>
            )}
          />
        </motion.div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </section>
  );
};

export default Schedule;
