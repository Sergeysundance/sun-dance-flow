import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, X, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeeklyTimeGrid from "@/components/WeeklyTimeGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";

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

function fmt(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Direction = { id: string; name: string; color: string };
type Teacher = { id: string; first_name: string; last_name: string };
type Room = { id: string; name: string };
type ScheduleClass = {
  id: string; direction_id: string; teacher_id: string; room_id: string;
  date: string; start_time: string; end_time: string; max_spots: number; cancelled: boolean;
  branch_id: string | null;
};

export default function SchedulePage() {
  const { selectedBranchId } = useBranch();
  const [weekOffset, setWeekOffset] = useState(0);
  const [newClassOpen, setNewClassOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [editDirection, setEditDirection] = useState("");
  const [editTeacher, setEditTeacher] = useState("");
  const [editRoom, setEditRoom] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editMaxSpots, setEditMaxSpots] = useState(20);

  const [newDirection, setNewDirection] = useState("");
  const [newTeacher, setNewTeacher] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newMaxSpots, setNewMaxSpots] = useState(20);

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

  const fetchData = async () => {
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    let clsQuery = supabase.from("schedule_classes").select("*").gte("date", fmt(monday)).lte("date", fmt(sunday));
    if (selectedBranchId) clsQuery = clsQuery.eq("branch_id", selectedBranchId);

    let dirQuery = supabase.from("directions").select("id, name, color").eq("active", true);
    if (selectedBranchId) dirQuery = dirQuery.eq("branch_id", selectedBranchId);

    let rmQuery = supabase.from("rooms").select("id, name").eq("active", true);
    if (selectedBranchId) rmQuery = rmQuery.eq("branch_id", selectedBranchId);

    const [clsRes, dirRes, tchRes, rmRes] = await Promise.all([
      clsQuery,
      dirQuery,
      supabase.from("teachers").select("id, first_name, last_name").eq("active", true),
      rmQuery,
    ]);
    if (clsRes.data) setClasses(clsRes.data as ScheduleClass[]);
    if (dirRes.data) setDirections(dirRes.data);
    if (tchRes.data) setTeachers(tchRes.data);
    if (rmRes.data) setRooms(rmRes.data);
  };

  useEffect(() => { fetchData(); }, [monday, selectedBranchId]);


  const selClass = selectedClass ? classes.find(c => c.id === selectedClass) : null;
  const selDir = selClass ? directions.find(d => d.id === selClass.direction_id) : null;
  const selTeacher = selClass ? teachers.find(t => t.id === selClass.teacher_id) : null;
  const selRoom = selClass ? rooms.find(r => r.id === selClass.room_id) : null;

  const startEditing = () => {
    if (!selClass) return;
    setEditDirection(selClass.direction_id);
    setEditTeacher(selClass.teacher_id);
    setEditRoom(selClass.room_id);
    setEditDate(selClass.date);
    setEditStart(selClass.start_time);
    setEditEnd(selClass.end_time);
    setEditMaxSpots(selClass.max_spots);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selClass) return;
    const { error } = await supabase.from("schedule_classes").update({
      direction_id: editDirection, teacher_id: editTeacher, room_id: editRoom,
      date: editDate, start_time: editStart, end_time: editEnd, max_spots: editMaxSpots,
    }).eq("id", selClass.id);
    if (error) { toast.error("Ошибка сохранения"); return; }
    toast.success("Занятие обновлено");
    setEditing(false); setSelectedClass(null); fetchData();
  };

  const cancelClass = async () => {
    if (!selClass) return;
    const { error } = await supabase.from("schedule_classes").update({ cancelled: !selClass.cancelled }).eq("id", selClass.id);
    if (error) { toast.error("Ошибка"); return; }
    toast.success(selClass.cancelled ? "Занятие восстановлено" : "Занятие отменено");
    setSelectedClass(null); fetchData();
  };

  const deleteClass = async () => {
    if (!selClass) return;
    if (!confirm("Вы уверены, что хотите полностью удалить это занятие? Это действие нельзя отменить.")) return;
    const { error } = await supabase.from("schedule_classes").delete().eq("id", selClass.id);
    if (error) { toast.error("Ошибка удаления"); return; }
    toast.success("Занятие удалено");
    setSelectedClass(null); fetchData();
  };

  const createClass = async () => {
    if (!newDirection || !newTeacher || !newRoom || !newDate || !newStart || !newEnd) {
      toast.error("Заполните все поля"); return;
    }
    const { error } = await supabase.from("schedule_classes").insert({
      direction_id: newDirection, teacher_id: newTeacher, room_id: newRoom,
      date: newDate, start_time: newStart, end_time: newEnd, max_spots: newMaxSpots,
      branch_id: selectedBranchId,
    });
    if (error) { toast.error("Ошибка создания"); return; }
    toast.success("Занятие создано");
    setNewClassOpen(false);
    setNewDirection(""); setNewTeacher(""); setNewRoom(""); setNewDate(""); setNewStart(""); setNewEnd(""); setNewMaxSpots(20);
    fetchData();
  };

  const copyWeekForward = async () => {
    if (classes.length === 0) {
      toast.error("Нет занятий для копирования");
      return;
    }

    const nextMonday = new Date(monday);
    nextMonday.setDate(nextMonday.getDate() + 7);
    const lastSunday = new Date(monday);
    lastSunday.setDate(lastSunday.getDate() + 5 * 7 - 1);

    // 1. Delete all existing classes for the next 4 weeks
    let deleteQuery = supabase.from("schedule_classes")
      .delete()
      .gte("date", fmt(nextMonday))
      .lte("date", fmt(lastSunday));
    if (selectedBranchId) deleteQuery = deleteQuery.eq("branch_id", selectedBranchId);
    const { error: delError } = await deleteQuery;
    if (delError) { toast.error("Ошибка очистки расписания"); return; }

    // 2. Insert current week's classes for each of the next 4 weeks
    const inserts = [];
    for (let week = 1; week <= 4; week++) {
      for (const cls of classes) {
        const origDate = new Date(cls.date + "T00:00");
        origDate.setDate(origDate.getDate() + week * 7);
        inserts.push({
          direction_id: cls.direction_id,
          teacher_id: cls.teacher_id,
          room_id: cls.room_id,
          date: fmt(origDate),
          start_time: cls.start_time,
          end_time: cls.end_time,
          max_spots: cls.max_spots,
          branch_id: cls.branch_id,
        });
      }
    }
    const { error } = await supabase.from("schedule_classes").insert(inserts);
    if (error) { toast.error("Ошибка копирования"); return; }
    toast.success(`Расписание перестроено на 4 недели вперёд (${inserts.length} занятий)`);
    fetchData();
  };

  const todayStr = fmt(new Date());

  return (
    <div className="space-y-4">
      <Tabs defaultValue="calendar">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="calendar">Календарь</TabsTrigger>
            <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button onClick={() => setNewClassOpen(true)} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Занятие</Button>
            <Button variant="outline" onClick={copyWeekForward} className="border-admin-border gap-1"><Copy className="h-4 w-4" /> Повторить на месяц</Button>
          </div>
        </div>

        <TabsContent value="calendar" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w - 1)} className="border-admin-border"><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium text-admin-foreground">{formatWeek(monday)}</span>
            <Button variant="outline" size="icon" onClick={() => setWeekOffset(w => w + 1)} className="border-admin-border"><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)} className="text-admin-muted">Сегодня</Button>
          </div>

          <WeeklyTimeGrid
            weekDates={weekDates}
            classes={classes}
            directions={directions}
            teachers={teachers}
            rooms={rooms}
            today={todayStr}
            variant="admin"
            onClassClick={(cls) => { setSelectedClass(cls.id); setEditing(false); }}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card className="bg-white border-admin-border shadow-sm">
            <CardContent className="p-8 text-center text-admin-muted">
              <p>Шаблоны расписания будут доступны после настройки</p>
              <Button className="mt-4 bg-admin-accent text-black hover:bg-yellow-400 gap-1"><Plus className="h-4 w-4" /> Новый шаблон</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Class detail / edit dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => { setSelectedClass(null); setEditing(false); }}>
        <DialogContent className="bg-white text-admin-foreground sm:max-w-lg max-h-[90vh] flex flex-col">
          {selClass && !editing && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2 text-admin-foreground">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: selDir?.color }} />
                  {selDir?.name}
                  {selClass.cancelled && <Badge variant="destructive">Отменено</Badge>}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm text-admin-foreground overflow-y-auto flex-1">
                <div><strong>Дата:</strong> {new Date(selClass.date + 'T00:00').toLocaleDateString('ru-RU')}</div>
                <div><strong>Время:</strong> {selClass.start_time.slice(0,5)}–{selClass.end_time.slice(0,5)}</div>
                <div><strong>Преподаватель:</strong> {selTeacher?.first_name} {selTeacher?.last_name}</div>
                <div><strong>Зал:</strong> {selRoom?.name}</div>
                <div><strong>Макс. мест:</strong> {selClass.max_spots}</div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2 flex-shrink-0 flex-wrap">
                <Button variant="outline" onClick={deleteClass} className="gap-1 border-red-300 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Удалить
                </Button>
                <Button variant="destructive" onClick={cancelClass} className="gap-1">
                  <X className="h-4 w-4" />
                  {selClass.cancelled ? "Восстановить" : "Отменить"}
                </Button>
                <Button onClick={startEditing} className="bg-admin-accent text-black hover:bg-yellow-400 gap-1">
                  <Pencil className="h-4 w-4" /> Редактировать
                </Button>
              </DialogFooter>
            </>
          )}
          {selClass && editing && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-admin-foreground">Редактировать занятие</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 overflow-y-auto flex-1 pr-1">
                <div>
                  <Label>Направление</Label>
                  <Select value={editDirection} onValueChange={setEditDirection}>
                    <SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 overflow-y-auto">{directions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Преподаватель</Label>
                  <Select value={editTeacher} onValueChange={setEditTeacher}>
                    <SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 overflow-y-auto">{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Зал</Label>
                  <Select value={editRoom} onValueChange={setEditRoom}>
                    <SelectTrigger className="bg-white border-admin-border"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 overflow-y-auto">{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Дата</Label><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="bg-white border-admin-border" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Начало</Label><Input type="time" value={editStart} onChange={e => setEditStart(e.target.value)} className="bg-white border-admin-border" /></div>
                  <div><Label>Конец</Label><Input type="time" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="bg-white border-admin-border" /></div>
                </div>
                <div><Label>Макс. мест</Label><Input type="number" value={editMaxSpots} onChange={e => setEditMaxSpots(Number(e.target.value))} className="bg-white border-admin-border" /></div>
              </div>
              <DialogFooter className="gap-2 sm:gap-2 flex-shrink-0">
                <Button variant="outline" onClick={() => setEditing(false)} className="border-admin-border">Отмена</Button>
                <Button onClick={saveEdit} className="bg-admin-accent text-black hover:bg-yellow-400">Сохранить</Button>
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
            <div>
              <Label>Направление</Label>
              <Select value={newDirection} onValueChange={setNewDirection}>
                <SelectTrigger className="bg-white border-admin-border"><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">{directions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Преподаватель</Label>
              <Select value={newTeacher} onValueChange={setNewTeacher}>
                <SelectTrigger className="bg-white border-admin-border"><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Зал</Label>
              <Select value={newRoom} onValueChange={setNewRoom}>
                <SelectTrigger className="bg-white border-admin-border"><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">{rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Дата</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-white border-admin-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Начало</Label><Input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="bg-white border-admin-border" /></div>
              <div><Label>Конец</Label><Input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="bg-white border-admin-border" /></div>
            </div>
            <div><Label>Макс. мест</Label><Input type="number" value={newMaxSpots} onChange={e => setNewMaxSpots(Number(e.target.value))} className="bg-white border-admin-border" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClassOpen(false)} className="border-admin-border">Отмена</Button>
            <Button onClick={createClass} className="bg-admin-accent text-black hover:bg-yellow-400">Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
