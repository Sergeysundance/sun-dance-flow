import { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { scheduleClasses, getDirection, getTeacher, getRoom, getClient } from "@/data/mockData";

const today = new Date().toISOString().split("T")[0];

export default function CheckInPage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState<Record<string, 'attended' | 'noshow'>>({});

  const todayClasses = scheduleClasses.filter(c => c.date === today && !c.cancelled);
  const nextClasses = scheduleClasses.filter(c => !c.cancelled).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)).slice(0, 6);
  const displayClasses = todayClasses.length > 0 ? todayClasses : nextClasses;

  const selectedClass = selectedClassId ? scheduleClasses.find(c => c.id === selectedClassId) : null;
  const selDir = selectedClass ? getDirection(selectedClass.directionId) : null;
  const selTeacher = selectedClass ? getTeacher(selectedClass.teacherId) : null;
  const selRoom = selectedClass ? getRoom(selectedClass.roomId) : null;

  const attendedCount = Object.values(checkedIn).filter(v => v === 'attended').length;

  if (!selectedClassId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-admin-muted">Выберите занятие для отметки посещений</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayClasses.map(c => {
            const dir = getDirection(c.directionId);
            const teacher = getTeacher(c.teacherId);
            const now = new Date();
            const classStart = new Date(`${c.date}T${c.startTime}`);
            const classEnd = new Date(`${c.date}T${c.endTime}`);
            const isNow = now >= classStart && now <= classEnd;
            const isSoon = !isNow && classStart.getTime() - now.getTime() < 3600000 && classStart > now;
            return (
              <Card key={c.id} className="bg-white border-admin-border shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedClassId(c.id); setCheckedIn({}); }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-bold text-admin-foreground" style={{ color: dir?.color }}>{dir?.name}</div>
                      <div className="mt-1 text-sm text-admin-muted">{c.startTime}–{c.endTime}</div>
                      <div className="text-sm text-admin-muted">{teacher?.firstName} {teacher?.lastName?.[0]}.</div>
                    </div>
                    <div className="text-right">
                      {isNow && <Badge className="bg-green-100 text-green-800">Сейчас</Badge>}
                      {isSoon && <Badge className="bg-yellow-100 text-yellow-800">Скоро</Badge>}
                      <div className="mt-1 text-sm text-admin-muted">{c.enrolledClientIds.length} записано</div>
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
            <span style={{ color: selDir?.color }}>{selDir?.name}</span> — {selectedClass?.startTime}–{selectedClass?.endTime} — {selRoom?.name}
          </h2>
          <div className="text-sm text-admin-muted">
            Пришло: <strong className="text-admin-foreground">{attendedCount}</strong> / {selectedClass?.enrolledClientIds.length} записанных
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {selectedClass?.enrolledClientIds.map((cId, i) => {
          const client = getClient(cId);
          if (!client) return null;
          const key = `${cId}-${i}`;
          const status = checkedIn[key];
          return (
            <div key={key} className={`flex items-center justify-between rounded-lg border border-admin-border p-4 transition-colors ${status === 'attended' ? 'bg-green-50 border-green-200' : status === 'noshow' ? 'bg-gray-50 opacity-60' : 'bg-white'}`}>
              <div>
                <div className="font-medium text-admin-foreground">{client.firstName} {client.lastName}</div>
                <div className="text-sm text-admin-muted">{client.phone}</div>
              </div>
              <div className="flex gap-2">
                {status === 'attended' ? (
                  <Badge className="bg-green-100 text-green-800 gap-1 px-3 py-1.5"><Check className="h-3.5 w-3.5" /> Отмечен</Badge>
                ) : status === 'noshow' ? (
                  <Badge className="bg-gray-100 text-gray-600 gap-1 px-3 py-1.5"><X className="h-3.5 w-3.5" /> Не пришёл</Badge>
                ) : (
                  <>
                    <Button size="lg" className="bg-green-600 text-white hover:bg-green-700 gap-1" onClick={() => { setCheckedIn(p => ({ ...p, [key]: 'attended' })); toast.success(`${client.firstName} отмечен(а)`); }}>
                      <Check className="h-4 w-4" /> Пришёл
                    </Button>
                    <Button size="lg" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-1" onClick={() => { setCheckedIn(p => ({ ...p, [key]: 'noshow' })); toast.info(`${client.firstName} — не пришёл`); }}>
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
