import { CalendarDays, Mail, CreditCard, AlertTriangle, ArrowRight, UserPlus, CalendarPlus, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  scheduleClasses, trialRequests, subscriptions, subscriptionTypes,
  getDirection, getTeacher, getRoom, getTrialStatusLabel,
  directions,
} from "@/data/mockData";

const today = new Date().toISOString().split("T")[0];

export default function DashboardPage() {
  const navigate = useNavigate();
  const todayClasses = scheduleClasses.filter(c => c.date === today && !c.cancelled);
  const totalEnrolled = todayClasses.reduce((s, c) => s + c.enrolledClientIds.length, 0);
  const newRequests = trialRequests.filter(r => r.status === "new");
  const activeSubs = subscriptions.filter(s => s.status === "active");
  const expiringSoon = subscriptions.filter(s => {
    if (s.status !== "active") return false;
    const diff = (new Date(s.expiresDate).getTime() - Date.now()) / 86400000;
    return diff <= 7 && diff >= 0;
  });

  const stats = [
    { label: "Сегодня занятий", value: todayClasses.length, sub: `записано ${totalEnrolled} человек`, icon: CalendarDays, color: "text-blue-500" },
    { label: "Новые заявки", value: newRequests.length, sub: "", icon: Mail, color: "text-yellow-500", badge: newRequests.length > 0 },
    { label: "Активных абонементов", value: activeSubs.length, sub: "", icon: CreditCard, color: "text-green-500" },
    { label: "Истекают скоро", value: expiringSoon.length, sub: "в ближайшие 7 дней", icon: AlertTriangle, color: "text-red-500", badge: expiringSoon.length > 0 },
  ];

  const trialStatusColor: Record<string, string> = { new: "bg-yellow-100 text-yellow-800", contacted: "bg-blue-100 text-blue-800", enrolled: "bg-green-100 text-green-800", declined: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className="bg-white border-admin-border shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-gray-50 p-2.5 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-admin-foreground">{s.value}</span>
                  {s.badge && <Badge className="bg-red-500 text-white text-[10px] px-1.5">{s.value}</Badge>}
                </div>
                <div className="text-xs text-admin-muted">{s.label}</div>
                {s.sub && <div className="text-[11px] text-admin-muted">{s.sub}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => navigate("/admin/clients")} className="bg-admin-accent text-black hover:bg-yellow-400 gap-2"><UserPlus className="h-4 w-4" /> Новый клиент</Button>
        <Button onClick={() => navigate("/admin/schedule")} variant="outline" className="border-admin-border text-admin-foreground gap-2"><CalendarPlus className="h-4 w-4" /> Новое занятие</Button>
        <Button onClick={() => navigate("/admin/check-in")} variant="outline" className="border-admin-border text-admin-foreground gap-2"><CheckSquare className="h-4 w-4" /> Check-in</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's classes */}
        <Card className="bg-white border-admin-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-admin-foreground">Сегодняшние занятия</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {todayClasses.length === 0 ? (
              <div className="px-4 pb-4 text-sm text-admin-muted">Сегодня нет занятий</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-admin-border text-left text-xs text-admin-muted"><th className="px-4 py-2">Время</th><th className="px-4 py-2">Направление</th><th className="px-4 py-2">Преподаватель</th><th className="px-4 py-2">Зал</th><th className="px-4 py-2">Записано</th></tr></thead>
                  <tbody>
                    {todayClasses.map(c => {
                      const dir = getDirection(c.directionId);
                      const teacher = getTeacher(c.teacherId);
                      const room = getRoom(c.roomId);
                      return (
                        <tr key={c.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-admin-foreground">{c.startTime}–{c.endTime}</td>
                          <td className="px-4 py-2.5"><span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: dir?.color }} />{dir?.name}</td>
                          <td className="px-4 py-2.5 text-admin-muted">{teacher?.firstName} {teacher?.lastName?.[0]}.</td>
                          <td className="px-4 py-2.5 text-admin-muted">{room?.name}</td>
                          <td className="px-4 py-2.5">{c.enrolledClientIds.length}/{c.maxSpots}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent trial requests */}
        <Card className="bg-white border-admin-border shadow-sm">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold text-admin-foreground">Последние заявки на пробное</CardTitle>
            <Button variant="ghost" size="sm" className="text-admin-muted gap-1" onClick={() => navigate("/admin/trial-requests")}>
              Все заявки <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {trialRequests.slice(0, 4).map(r => {
              const dir = getDirection(r.directionId);
              return (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-admin-border p-3">
                  <div>
                    <div className="text-sm font-medium text-admin-foreground">{r.name}</div>
                    <div className="text-xs text-admin-muted">{r.phone} · {dir?.name}</div>
                  </div>
                  <Badge className={trialStatusColor[r.status]}>{getTrialStatusLabel(r.status)}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
