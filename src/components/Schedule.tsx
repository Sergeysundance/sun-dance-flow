import { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { scheduleClasses, getDirection, getTeacher, getRoom } from "@/data/mockData";

const DAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAYS_FULL = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

const Schedule = () => {
  const grouped = useMemo(() => {
    const monday = getMonday(new Date());
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    const classes = scheduleClasses
      .filter(c => weekDates.includes(c.date) && !c.cancelled)
      .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

    const byDay: Record<string, typeof classes> = {};
    for (const c of classes) {
      if (!byDay[c.date]) byDay[c.date] = [];
      byDay[c.date].push(c);
    }

    return weekDates
      .filter(d => byDay[d])
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
  }, []);

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
                  const dir = getDirection(c.directionId);
                  const teacher = getTeacher(c.teacherId);
                  const room = getRoom(c.roomId);
                  return (
                    <div
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-border bg-card/50 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="font-body text-sm font-semibold text-foreground min-w-[100px]">
                          {c.startTime}–{c.endTime}
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
                          {teacher?.firstName} {teacher?.lastName?.[0]}.
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
