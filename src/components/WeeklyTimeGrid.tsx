import { useMemo, ReactNode } from "react";

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOUR_HEIGHT = 80; // px per hour — taller to fit buttons

interface ScheduleClass {
  id: string;
  direction_id: string;
  teacher_id: string;
  room_id: string;
  date: string;
  start_time: string;
  end_time: string;
  cancelled?: boolean;
  [key: string]: any;
}

interface Direction {
  id: string;
  name: string;
  color: string;
}

interface Teacher {
  id: string;
  first_name: string;
  last_name?: string;
}

interface Room {
  id: string;
  name: string;
}

interface WeeklyTimeGridProps {
  weekDates: string[];
  classes: ScheduleClass[];
  directions: Direction[];
  teachers: Teacher[];
  rooms: Room[];
  today: string;
  /** Render action area inside the class card (button, etc). Return null to skip. */
  renderClassAction?: (cls: ScheduleClass, dir: Direction | undefined) => ReactNode;
  /** Called when a class card is clicked (admin use) */
  onClassClick?: (cls: ScheduleClass) => void;
  /** Admin theme styling */
  variant?: "default" | "admin";
  emptyMessage?: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToLabel(m: number): string {
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:00`;
}

export default function WeeklyTimeGrid({
  weekDates,
  classes,
  directions,
  teachers,
  rooms,
  today,
  renderClassAction,
  onClassClick,
  variant = "default",
  emptyMessage = "Нет занятий на этой неделе",
}: WeeklyTimeGridProps) {
  const isAdmin = variant === "admin";

  const getDir = (id: string) => directions.find(d => d.id === id);
  const getTeacher = (id: string) => teachers.find(t => t.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);

  // Group classes by date
  const classesByDate = useMemo(() => {
    const map: Record<string, ScheduleClass[]> = {};
    for (const date of weekDates) map[date] = [];
    for (const c of classes) {
      if (map[c.date]) map[c.date].push(c);
    }
    return map;
  }, [classes, weekDates]);

  // Calculate time range
  const { startHour, endHour, timeSlots } = useMemo(() => {
    if (classes.length === 0) return { startHour: 9, endHour: 21, timeSlots: [] as number[] };
    let minMin = Infinity, maxMin = -Infinity;
    for (const c of classes) {
      const s = timeToMinutes(c.start_time);
      const e = timeToMinutes(c.end_time);
      if (s < minMin) minMin = s;
      if (e > maxMin) maxMin = e;
    }
    const sH = Math.floor(minMin / 60);
    const eH = Math.ceil(maxMin / 60);
    const slots: number[] = [];
    for (let h = sH; h <= eH; h++) slots.push(h * 60);
    return { startHour: sH, endHour: eH, timeSlots: slots };
  }, [classes]);

  const totalMinutes = (endHour - startHour) * 60;
  const totalHeight = (totalMinutes / 60) * HOUR_HEIGHT;
  const hasClasses = classes.length > 0;

  const borderClass = isAdmin ? "border-admin-border" : "border-border";
  const todayBg = isAdmin ? "bg-yellow-50" : "bg-sun/10";
  const todayBgLight = isAdmin ? "bg-yellow-50/50" : "bg-sun/5";
  const todayText = isAdmin ? "text-admin-accent" : "text-sun";
  const mutedText = isAdmin ? "text-admin-muted" : "text-muted-foreground";
  const fgText = isAdmin ? "text-admin-foreground" : "text-foreground";

  // ---- Mobile view ----
  const mobileView = (
    <div className="sm:hidden space-y-3">
      {weekDates.map((date, i) => {
        const dayClasses = classesByDate[date] || [];
        if (dayClasses.length === 0) return null;
        const dateObj = new Date(date + "T00:00");
        const isToday = date === today;
        const sorted = [...dayClasses].sort((a, b) => a.start_time.localeCompare(b.start_time));
        return (
          <div key={date}>
            <div className={`text-sm font-bold mb-1.5 ${isToday ? todayText : fgText}`}>
              {DAYS_SHORT[i]}, {dateObj.getDate()}{isToday ? " — сегодня" : ""}
            </div>
            <div className="space-y-2">
              {sorted.map(cls => {
                const dir = getDir(cls.direction_id);
                const teacher = getTeacher(cls.teacher_id);
                const room = getRoom(cls.room_id);
                return (
                  <div
                    key={cls.id}
                    className={`rounded-lg p-3 border ${borderClass} ${cls.cancelled ? "opacity-50" : ""}`}
                    style={{ borderLeftWidth: 4, borderLeftColor: dir?.color || "#3B82F6" }}
                    onClick={() => onClassClick?.(cls)}
                    role={onClassClick ? "button" : undefined}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-sm font-bold ${cls.cancelled ? "line-through" : ""}`} style={{ color: dir?.color }}>
                          {dir?.name}
                        </div>
                        <div className={`text-xs font-medium ${fgText} ${cls.cancelled ? "line-through" : ""}`}>
                          {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}
                        </div>
                        {cls.cancelled && <div className="text-xs font-semibold text-destructive">Отменено</div>}
                        {!cls.cancelled && (
                          <>
                            <div className={`text-xs ${mutedText}`}>{teacher?.first_name} {teacher?.last_name?.[0]}.</div>
                            <div className={`text-xs ${mutedText}`}>{room?.name}</div>
                          </>
                        )}
                      </div>
                      {!cls.cancelled && renderClassAction && (
                        <div className="shrink-0">{renderClassAction(cls, dir)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {!hasClasses && <p className={`text-center ${mutedText} py-6`}>{emptyMessage}</p>}
    </div>
  );

  // ---- Desktop time grid ----
  const desktopView = (
    <div className={`hidden sm:block rounded-lg border ${borderClass} ${isAdmin ? "bg-white" : ""} overflow-hidden`}>
      {/* Header: time col + 7 day cols */}
      <div className={`grid border-b ${borderClass}`} style={{ gridTemplateColumns: "50px repeat(7, 1fr)" }}>
        <div className={`border-r ${borderClass} px-1 py-3`} />
        {DAYS_SHORT.map((day, i) => {
          const date = weekDates[i];
          const isToday = date === today;
          const dateObj = new Date(date + "T00:00");
          return (
            <div key={i} className={`border-r ${borderClass} last:border-r-0 px-2 py-3 text-center ${isToday ? todayBg : ""}`}>
              <div className={`text-xs font-medium uppercase ${isToday ? todayText : mutedText}`}>{day}</div>
              <div className={`text-lg font-bold ${isToday ? todayText : fgText}`}>{dateObj.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      {hasClasses ? (
        <div className="relative" style={{ gridTemplateColumns: "50px repeat(7, 1fr)" }}>
          <div className="grid" style={{ gridTemplateColumns: "50px repeat(7, 1fr)", height: totalHeight }}>
            {/* Time labels column */}
            <div className={`relative border-r ${borderClass}`}>
              {timeSlots.map((slotMin, idx) => {
                if (idx === timeSlots.length - 1) return null;
                const top = ((slotMin - startHour * 60) / totalMinutes) * totalHeight;
                return (
                  <div
                    key={slotMin}
                    className={`absolute right-0 left-0 flex items-start justify-end pr-1.5 ${mutedText} text-[11px]`}
                    style={{ top }}
                  >
                    {minutesToLabel(slotMin)}
                  </div>
                );
              })}
              {/* Hour lines */}
              {timeSlots.map((slotMin, idx) => {
                if (idx === 0) return null;
                const top = ((slotMin - startHour * 60) / totalMinutes) * totalHeight;
                return (
                  <div
                    key={`line-${slotMin}`}
                    className={`absolute left-0 right-0 border-t ${borderClass}`}
                    style={{ top, opacity: 0.4 }}
                  />
                );
              })}
            </div>

            {/* Day columns */}
            {weekDates.map((date, colIdx) => {
              const isToday = date === today;
              const dayClasses = classesByDate[date] || [];
              return (
                <div
                  key={colIdx}
                  className={`relative border-r ${borderClass} last:border-r-0 ${isToday ? todayBgLight : ""}`}
                >
                  {/* Hour grid lines */}
                  {timeSlots.map((slotMin, idx) => {
                    if (idx === 0) return null;
                    const top = ((slotMin - startHour * 60) / totalMinutes) * totalHeight;
                    return (
                      <div
                        key={`grid-${slotMin}`}
                        className={`absolute left-0 right-0 border-t ${borderClass}`}
                        style={{ top, opacity: 0.4 }}
                      />
                    );
                  })}

                  {/* Class cards */}
                  {dayClasses.map(cls => {
                    const sMin = timeToMinutes(cls.start_time);
                    const eMin = timeToMinutes(cls.end_time);
                    const top = ((sMin - startHour * 60) / totalMinutes) * totalHeight;
                    const height = ((eMin - sMin) / totalMinutes) * totalHeight;
                    const dir = getDir(cls.direction_id);
                    const teacher = getTeacher(cls.teacher_id);
                    const room = getRoom(cls.room_id);

                    return (
                      <div
                        key={cls.id}
                        className="absolute left-0.5 right-0.5 overflow-hidden"
                        style={{ top, height: Math.max(height, 28) }}
                      >
                        <div
                          className={`rounded-md p-1 h-full flex flex-col text-[9px] leading-tight cursor-pointer transition-opacity hover:opacity-80 ${cls.cancelled ? "opacity-50" : ""}`}
                          style={{
                            backgroundColor: (dir?.color || "#3B82F6") + "18",
                            borderLeft: `3px solid ${dir?.color || "#3B82F6"}`,
                          }}
                          onClick={() => onClassClick?.(cls)}
                        >
                          <div className={`font-semibold ${fgText} ${cls.cancelled ? "line-through" : ""}`}>
                            {cls.start_time?.slice(0, 5)}–{cls.end_time?.slice(0, 5)}
                          </div>
                          <div className={`font-bold truncate ${cls.cancelled ? "line-through" : ""}`} style={{ color: dir?.color }}>
                            {dir?.name}
                          </div>
                          {cls.cancelled && <div className="font-semibold text-destructive">Отменено</div>}
                          {!cls.cancelled && (
                            <>
                              {height > 45 && <div className={`${mutedText} truncate`}>{teacher?.first_name} {teacher?.last_name?.[0]}.</div>}
                              {height > 55 && <div className={`${mutedText} truncate`}>{room?.name}</div>}
                              {renderClassAction && (
                                <div className="mt-auto pt-0.5" onClick={e => e.stopPropagation()}>
                                  {renderClassAction(cls, dir)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={`p-8 text-center ${mutedText}`}>{emptyMessage}</div>
      )}
    </div>
  );

  return (
    <>
      {mobileView}
      {desktopView}
    </>
  );
}
