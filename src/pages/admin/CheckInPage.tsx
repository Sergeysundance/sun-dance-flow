import { useState, useEffect } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Direction = { id: string; name: string; color: string };
type Teacher = { id: string; first_name: string; last_name: string };
type Room = { id: string; name: string };
type ScheduleClass = {
  id: string; direction_id: string; teacher_id: string; room_id: string;
  date: string; start_time: string; end_time: string; max_spots: number; cancelled: boolean;
};
type Booking = { id: string; user_id: string; class_id: string };
type Profile = { user_id: string; first_name: string; last_name: string; middle_name: string; phone: string };

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CheckInPage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState<Record<string, 'attended' | 'noshow'>>({});

  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [directions, setDirections] = useState<Direction[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const today = fmt(new Date());

  const fetchData = async () => {
    const [clsRes, dirRes, tchRes, rmRes, bkRes, prRes] = await Promise.all([
      supabase.from("schedule_classes").select("*").eq("cancelled", false).order("date").order("start_time"),
      supabase.from("directions").select("id, name, color").eq("active", true),
      supabase.from("teachers").select("id, first_name, last_name").eq("active", true),
      supabase.from("rooms").select("id, name").eq("active", true),
      supabase.from("bookings").select("id, user_id, class_id"),
      supabase.from("profiles").select("user_id, first_name, last_name, middle_name, phone"),
    ]);
    if (clsRes.data) setClasses(clsRes.data);
    if (dirRes.data) setDirections(dirRes.data);
    if (tchRes.data) setTeachers(tchRes.data);
    if (rmRes.data) setRooms(rmRes.data);
    if (bkRes.data) setBookings(bkRes.data);
    if (prRes.data) setProfiles(prRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const todayClasses = classes.filter(c => c.date === today);
  const upcomingClasses = classes.filter(c => c.date >= today).slice(0, 6);
  const displayClasses = todayClasses.length > 0 ? todayClasses : upcomingClasses;

  const getDir = (id: string) => directions.find(d => d.id === id);
  const getTeacher = (id: string) => teachers.find(t => t.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);
  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);
  const getClassBookings = (classId: string) => bookings.filter(b => b.class_id === classId);

  const selectedClass = selectedClassId ? classes.find(c => c.id === selectedClassId) : null;
  const selDir = selectedClass ? getDir(selectedClass.direction_id) : null;
  const selRoom = selectedClass ? getRoom(selectedClass.room_id) : null;
  const classBookings = selectedClass ? getClassBookings(selectedClass.id) : [];

  const attendedCount = Object.values(checkedIn).filter(v => v === 'attended').length;

  if (loading) return <div className="text-admin-muted p-8">Загрузка…</div>;

  if (!selectedClassId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-admin-muted">Выберите занятие для отметки посещений</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayClasses.map(c => {
            const dir = getDir(c.direction_id);
            const teacher = getTeacher(c.teacher_id);
            const enrolled = getClassBookings(c.id).length;
            const now = new Date();
            const classStart = new Date(`${c.date}T${c.start_time}`);
            const classEnd = new Date(`${c.date}T${c.end_time}`);
            const isNow = now >= classStart && now <= classEnd;
            const isSoon = !isNow && classStart.getTime() - now.getTime() < 3600000 && classStart > now;
            return (
              <Card key={c.id} className="bg-white border-admin-border shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedClassId(c.id); setCheckedIn({}); }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-bold text-admin-foreground" style={{ color: dir?.color }}>{dir?.name}</div>
                      <div className="mt-1 text-sm text-admin-muted">{c.date !== today ? new Date(c.date + 'T00:00').toLocaleDateString('ru-RU') + ', ' : ''}{c.start_time.slice(0,5)}–{c.end_time.slice(0,5)}</div>
                      <div className="text-sm text-admin-muted">{teacher?.first_name} {teacher?.last_name?.[0]}.</div>
                    </div>
                    <div className="text-right">
                      {isNow && <Badge className="bg-green-100 text-green-800">Сейчас</Badge>}
                      {isSoon && <Badge className="bg-yellow-100 text-yellow-800">Скоро</Badge>}
                      <div className="mt-1 text-sm text-admin-muted">{enrolled} записано</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {displayClasses.length === 0 && <div className="rounded-lg border border-admin-border bg-white p-12 text-center text-admin-muted">Нет занятий для отметки</div>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setSelectedClassId(null)} className="text-admin-muted gap-1 -ml-2"><ArrowLeft className="h-4 w-4" /> Назад к списку</Button>

      <div className="rounded-lg border border-admin-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-admin-foreground">
            <span style={{ color: selDir?.color }}>{selDir?.name}</span> — {selectedClass?.start_time.slice(0,5)}–{selectedClass?.end_time.slice(0,5)} — {selRoom?.name}
          </h2>
          <div className="text-sm text-admin-muted">
            Пришло: <strong className="text-admin-foreground">{attendedCount}</strong> / {classBookings.length} записанных
          </div>
        </div>
      </div>

      {classBookings.length === 0 && (
        <div className="rounded-lg border border-admin-border bg-white p-8 text-center text-admin-muted">На это занятие пока никто не записан</div>
      )}

      <div className="space-y-2">
        {classBookings.map((booking) => {
          const profile = getProfile(booking.user_id);
          if (!profile) return null;
          const status = checkedIn[booking.id];
          return (
            <div key={booking.id} className={`flex items-center justify-between rounded-lg border border-admin-border p-4 transition-colors ${status === 'attended' ? 'bg-green-50 border-green-200' : status === 'noshow' ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
              <div>
                <div className="font-medium text-admin-foreground">{profile.last_name} {profile.first_name} {profile.middle_name}</div>
                <div className="text-sm text-admin-muted">{profile.phone}</div>
              </div>
              <div className="flex gap-2">
                {status === 'attended' ? (
                  <Badge className="bg-green-100 text-green-800 gap-1 px-3 py-1.5"><Check className="h-3.5 w-3.5" /> Отмечен</Badge>
                ) : status === 'noshow' ? (
                  <Badge className="bg-gray-100 text-gray-600 gap-1 px-3 py-1.5"><X className="h-3.5 w-3.5" /> Не пришёл</Badge>
                ) : (
                  <>
                    <Button size="lg" className="bg-admin-accent text-black hover:bg-yellow-400 gap-1" onClick={() => { setCheckedIn(p => ({ ...p, [booking.id]: 'attended' })); toast.success(`${profile.first_name} отмечен(а)`); }}>
                      <Check className="h-4 w-4" /> Пришёл
                    </Button>
                    <Button size="lg" variant="destructive" className="gap-1" onClick={() => { setCheckedIn(p => ({ ...p, [booking.id]: 'noshow' })); toast.info(`${profile.first_name} — не пришёл`); }}>
                      <X className="h-4 w-4" /> Не пришёл
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
