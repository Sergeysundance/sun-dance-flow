import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAYS_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [directions, setDirections] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const monday = getMonday(new Date());
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      const fmt = (d: Date) => d.toISOString().split("T")[0];

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
  }, []);

  const getDir = (id: string) => directions.find((d: any) => d.id === id);
  const getTeacher = (id: string) => teachers.find((t: any) => t.id === id);
  const getRoom = (id: string) => rooms.find((r: any) => r.id === id);

  const grouped = useMemo(() => {
    const byDay: Record<string, any[]> = {};
    for (const c of scheduleData) {
      if (!byDay[c.date]) byDay[c.date] = [];
      byDay[c.date].push(c);
    }

    return Object.keys(byDay)
      .sort()
      .map(d => {
        const date = new Date(d);
        return {
          date: d,
          dayName: DAYS_FULL[date.getDay()],
          dayShort: DAYS_SHORT[date.getDay()],
          dayNum: date.getDate(),
          classes: byDay[d],
        };
      });
  }, [scheduleData]);

  return (
    <section id="schedule" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center font-display text-3xl font-black uppercase text-foreground sm:text-5xl"
        >
          РАСПИСАНИЕ
        </motion.h2>

        {loading && (
          <p className="text-center text-muted-foreground">Загрузка...</p>
        )}

        <div className="mx-auto max-w-4xl space-y-6">
          {grouped.map((day, di) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: di * 0.05 }}
            >
              {/* Day header */}
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun font-display text-sm font-bold text-black">
                  {day.dayNum}
                </span>
                <span className="font-display text-lg font-bold uppercase text-foreground">
                  {day.dayName}
                </span>
              </div>

              {/* Classes */}
              <div className="space-y-2 pl-[52px]">
                {day.classes.map(c => {
                  const dir = getDir(c.direction_id);
                  const teacher = getTeacher(c.teacher_id);
                  const room = getRoom(c.room_id);
                  return (
                    <div
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-border bg-card/50 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-body text-sm font-semibold text-foreground min-w-[100px]">
                          {c.start_time?.slice(0, 5)}–{c.end_time?.slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: dir?.color }}
                          />
                          <span className="font-body text-sm font-semibold text-foreground">
                            {dir?.name}
                          </span>
                        </span>
                        <span className="font-body text-sm text-muted-foreground">
                          {teacher?.first_name} {teacher?.last_name?.[0]}.
                        </span>
                        <span className="font-body text-xs text-muted-foreground">
                          {room?.name}
                        </span>
                      </div>
                      <a href="#cta" className="ml-auto">
                         <Button variant="sun" size="sm" className="text-xs px-4">
                           Записаться
                         </Button>
                       </a>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Schedule;
