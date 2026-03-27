import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${monday.getDate()}–${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [directions, setDirections] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

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

      const [classesRes, dirsRes, teachersRes, roomsRes] = await Promise.all([
        supabase.from("schedule_classes").select("*").gte("date", fmt(monday)).lte("date", fmt(sunday)).eq("cancelled", false).order("date").order("start_time"),
        supabase.from("directions").select("*").eq("active", true),
        supabase.from("teachers").select("*").eq("active", true),
        supabase.from("rooms").select("*").eq("active", true),
      ]);

      setScheduleData(classesRes.data || []);
      setDirections(dirsRes.data || []);
      setTeachers(teachersRes.data || []);
      setRooms(roomsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [monday]);

  const getDir = (id: string) => directions.find((d: any) => d.id === id);
  const getTeacher = (id: string) => teachers.find((t: any) => t.id === id);
  const getRoom = (id: string) => rooms.find((r: any) => r.id === id);

  // Group classes by date
  const classesByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const date of weekDates) map[date] = [];
    for (const c of scheduleData) {
      if (map[c.date]) map[c.date].push(c);
    }
    return map;
  }, [scheduleData, weekDates]);

  // Find max classes in a day for row count
  const maxClasses = useMemo(() => Math.max(1, ...Object.values(classesByDate).map(arr => arr.length)), [classesByDate]);

  const today = fmt(new Date());

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

        {/* Week navigation */}
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

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl hidden md:block"
        >
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-7 bg-card/80">
              {DAYS_SHORT.map((day, i) => {
                const date = weekDates[i];
                const isToday = date === today;
                const dateObj = new Date(date + 'T00:00');
                return (
                  <div key={i} className={`border-r border-border last:border-r-0 px-2 py-3 text-center ${isToday ? 'bg-sun/10' : ''}`}>
                    <div className={`font-display text-xs uppercase ${isToday ? 'text-sun' : 'text-muted-foreground'}`}>{day}</div>
                    <div className={`font-display text-lg font-bold ${isToday ? 'text-sun' : 'text-foreground'}`}>{dateObj.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {/* Body rows */}
            {Array.from({ length: maxClasses }).map((_, rowIdx) => (
              <div key={rowIdx} className="grid grid-cols-7 border-t border-border">
                {weekDates.map((date, colIdx) => {
                  const cls = classesByDate[date]?.[rowIdx];
                  if (!cls) return <div key={colIdx} className="border-r border-border last:border-r-0 min-h-[90px]" />;
                  const dir = getDir(cls.direction_id);
                  const teacher = getTeacher(cls.teacher_id);
                  const room = getRoom(cls.room_id);
                  return (
                    <div key={colIdx} className="border-r border-border last:border-r-0 p-2 min-h-[90px]">
                      <div
                        className="rounded-lg p-2.5 h-full space-y-1"
                        style={{ backgroundColor: (dir?.color || '#3B82F6') + '15', borderLeft: `3px solid ${dir?.color || '#3B82F6'}` }}
                      >
                        <div className="font-body text-xs font-semibold text-foreground">
                          {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}
                        </div>
                        <div className="font-body text-sm font-bold" style={{ color: dir?.color }}>
                          {dir?.name}
                        </div>
                        <div className="font-body text-xs text-muted-foreground">
                          {teacher?.first_name} {teacher?.last_name?.[0]}.
                        </div>
                        <div className="font-body text-[11px] text-muted-foreground">
                          {room?.name}
                        </div>
                        <a href="#cta" className="block mt-1">
                          <Button variant="sun" size="sm" className="text-[10px] px-3 h-6 w-full">
                            Записаться
                          </Button>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {!loading && scheduleData.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Нет занятий на этой неделе</div>
            )}
          </div>
        </motion.div>

        {/* Mobile: stacked days */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-lg md:hidden space-y-4"
        >
          {weekDates.map((date, i) => {
            const dayClasses = classesByDate[date];
            if (!dayClasses || dayClasses.length === 0) return null;
            const dateObj = new Date(date + 'T00:00');
            const isToday = date === today;
            return (
              <div key={date}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold ${isToday ? 'bg-sun text-black' : 'bg-muted text-foreground'}`}>
                    {dateObj.getDate()}
                  </span>
                  <span className={`font-display text-sm font-bold uppercase ${isToday ? 'text-sun' : 'text-foreground'}`}>
                    {DAYS_SHORT[i]}
                  </span>
                </div>
                <div className="space-y-2 pl-11">
                  {dayClasses.map(cls => {
                    const dir = getDir(cls.direction_id);
                    const teacher = getTeacher(cls.teacher_id);
                    const room = getRoom(cls.room_id);
                    return (
                      <div
                        key={cls.id}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-lg border border-border bg-card/50 px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-body text-sm font-semibold text-foreground">
                            {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dir?.color }} />
                            <span className="font-body text-sm font-semibold text-foreground">{dir?.name}</span>
                          </span>
                          <span className="font-body text-xs text-muted-foreground">
                            {teacher?.first_name} {teacher?.last_name?.[0]}.
                          </span>
                        </div>
                        <a href="#cta">
                          <Button variant="sun" size="sm" className="text-xs px-4">Записаться</Button>
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!loading && scheduleData.length === 0 && (
            <p className="text-center text-muted-foreground">Нет занятий на этой неделе</p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Schedule;
