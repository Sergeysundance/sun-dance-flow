import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { scheduleClasses, getDirection, getTeacher, getRoom, directions, teachers, rooms, getClient } from "@/data/mockData";

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatWeek(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const m = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  return `${monday.getDate()}–${sunday.getDate()} ${m[sunday.getMonth()]} ${sunday.getFullYear()}`;
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [newClassOpen, setNewClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const monday = useMemo(() => {
    const m = getMonday(new Date());
    m.setDate(m.getDate() + weekOffset * 7);
    return m;
  }, [weekOffset]);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  }), [monday]);

  const classesThisWeek = scheduleClasses.filter(c => weekDates.includes(c.date));

  const selClass = selectedClass ? scheduleClasses.find(c => c.id === selectedClass) : null;
  const selDir = selClass ? getDirection(selClass.directionId) : null;
  const selTeacher = selClass ? getTeacher(selClass.teacherId) : null;
  const selRoom = selClass ? getRoom(selClass.roomId) : null;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="calendar">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="calendar">Календарь</TabsTrigger>
            <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          </TabsList>
          <Button onClick={() => setNewClassOpen(true)} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Занятие</Button>
        </div>

        <TabsContent value="calendar" className="mt-4 space-y-4">
          {/* Week navigation */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)} className="border-admin-border"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium text-admin-foreground">{formatWeek(monday)}</span>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)} className="border-admin-border"><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-admin-muted">Сегодня</Button>
          </div>

          {/* Week grid */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
            {DAYS.map((day, i) => {
              const date = weekDates[i];
              const dayClasses = classesThisWeek.filter(c => c.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isToday = date === new Date().toISOString().split('T')[0];
              return (
                <div key={i} className={`rounded-lg border border-admin-border bg-white p-2 min-h-[120px] ${isToday ? 'ring-2 ring-admin-accent' : ''}`}>
                  <div className={`mb-2 text-center text-xs font-medium ${isToday ? 'text-admin-accent' : 'text-admin-muted'}`}>
                    {day} <span className="block text-lg font-bold text-admin-foreground">{new Date(date).getDate()}</span>
                  </div>
                  <div className="space-y-1.5">
                    {dayClasses.map(c => {
                      const dir = getDirection(c.directionId);
                      const teacher = getTeacher(c.teacherId);
                      return (
                        <button key={c.id} onClick={() => setSelectedClass(c.id)} className={`w-full rounded-md p-1.5 text-left text-[11px] leading-tight transition-colors hover:opacity-80 ${c.cancelled ? 'opacity-50 line-through' : ''}`} style={{ backgroundColor: dir?.color + '20', borderLeft: `3px solid ${dir?.color}` }}>
                          <div className="font-medium" style={{ color: dir?.color }}>{dir?.name}</div>
                          <div className="text-admin-muted">{c.startTime}–{c.endTime}</div>
                          <div className="text-admin-muted">{teacher?.firstName} {teacher?.lastName?.[0]}.</div>
                          <div className="text-admin-muted">{c.enrolledClientIds.length}/{c.maxSpots}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card className="bg-white border-admin-border shadow-sm">
            <CardContent className="p-8 text-center text-admin-muted">
              <p>Шаблоны расписания будут доступны после подключения базы данных</p>
              <Button className="mt-4 bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый шаблон</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Class detail dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-lg">
          {selClass && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-admin-foreground">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: selDir?.color }} />
                  {selDir?.name}
                  {selClass.cancelled && <Badge className="bg-red-100 text-red-800">Отменено</Badge>}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm text-admin-foreground">
                <div><strong>Дата:</strong> {new Date(selClass.date).toLocaleDateString('ru-RU')}</div>
                <div><strong>Время:</strong> {selClass.startTime}–{selClass.endTime}</div>
                <div><strong>Преподаватель:</strong> {selTeacher?.firstName} {selTeacher?.lastName}</div>
                <div><strong>Зал:</strong> {selRoom?.name}</div>
                <div><strong>Записано:</strong> {selClass.enrolledClientIds.length}/{selClass.maxSpots}</div>
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium text-admin-foreground mb-2">Записанные клиенты:</div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {selClass.enrolledClientIds.map((cId, i) => {
                    const cl = getClient(cId);
                    return cl ? (
                      <div key={`${cId}-${i}`} className="flex items-center justify-between rounded border border-admin-border p-2 text-sm">
                        <span className="text-admin-foreground">{cl.firstName} {cl.lastName}</span>
                        <span className="text-admin-muted text-xs">{cl.phone}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="border-admin-border text-red-600">Отменить занятие</Button>
                <Button variant="outline" className="border-admin-border">Редактировать</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New class dialog */}
      <Dialog open={newClassOpen} onOpenChange={setNewClassOpen}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-md">
          <DialogHeader><DialogTitle className="text-admin-foreground">Новое занятие</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Направление</Label><Select><SelectTrigger className="bg-white border-admin-border"><SelectValue placeholder="Выберите" /></SelectTrigger><SelectContent>{directions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Преподаватель</Label><Select><SelectTrigger className="bg-white border-admin-border"><SelectValue placeholder="Выберите" /></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Зал</Label><Select><SelectTrigger className="bg-white border-admin-border"><SelectValue placeholder="Выберите" /></SelectTrigger><SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Дата</Label><Input type="date" className="bg-white border-admin-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Начало</Label><Input type="time" className="bg-white border-admin-border" /></div>
              <div><Label>Конец</Label><Input type="time" className="bg-white border-admin-border" /></div>
            </div>
            <div><Label>Макс. мест</Label><Input type="number" defaultValue={20} className="bg-white border-admin-border" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClassOpen(false)} className="border-admin-border">Отмена</Button>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => { setNewClassOpen(false); toast.success("Занятие создано"); }}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
