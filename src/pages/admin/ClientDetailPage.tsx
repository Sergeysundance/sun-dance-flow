import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  getClient, getClientSubscriptions, getSubscriptionType,
  getSubscriptionStatusLabel, getSourceLabel, scheduleClasses,
  getDirection, getTeacher,
} from "@/data/mockData";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
  frozen: "bg-blue-100 text-blue-800",
  exhausted: "bg-red-100 text-red-800",
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = getClient(id!);
  if (!client) return <div className="p-8 text-center text-admin-muted">Клиент не найден</div>;

  const subs = getClientSubscriptions(client.id);
  const enrolledClasses = scheduleClasses.filter(c => c.enrolledClientIds.includes(client.id));

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/admin/clients")} className="text-admin-muted gap-1 -ml-2"><ArrowLeft className="h-4 w-4" /> Клиенты</Button>

      <Card className="bg-white border-admin-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-admin-foreground">{client.firstName} {client.lastName}</h2>
              <div className="mt-1 space-y-0.5 text-sm text-admin-muted">
                <div>📞 <a href={`tel:${client.phone.replace(/[^\d+]/g,'')}`} className="text-blue-600 hover:underline">{client.phone}</a></div>
                {client.email && <div>✉️ {client.email}</div>}
                {client.birthDate && <div>🎂 {new Date(client.birthDate).toLocaleDateString('ru-RU')}</div>}
                <div>📍 {getSourceLabel(client.source)}</div>
                {client.notes && <div>📝 {client.notes}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-admin-border gap-1"><Edit className="h-4 w-4" /> Редактировать</Button>
              <Button className="bg-admin-accent text-black hover:bg-yellow-400 gap-1"><CreditCard className="h-4 w-4" /> Оформить абонемент</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="subscriptions">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="subscriptions">Абонементы</TabsTrigger>
          <TabsTrigger value="history">История посещений</TabsTrigger>
          <TabsTrigger value="enrollments">Записи</TabsTrigger>
        </TabsList>
        <TabsContent value="subscriptions" className="mt-4">
          {subs.length === 0 ? (
            <div className="rounded-lg border border-admin-border bg-white p-8 text-center text-admin-muted">Нет абонементов</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-admin-border bg-gray-50 text-left text-xs text-admin-muted"><th className="px-4 py-3">Тип</th><th className="px-4 py-3">Период</th><th className="px-4 py-3">Использовано</th><th className="px-4 py-3">Статус</th></tr></thead>
                <tbody>
                  {subs.map(s => {
                    const st = getSubscriptionType(s.subscriptionTypeId);
                    const pct = st?.classCount ? (s.usedClasses / st.classCount) * 100 : 50;
                    return (
                      <tr key={s.id} className="border-b border-admin-border last:border-0">
                        <td className="px-4 py-3 font-medium text-admin-foreground">{st?.name}</td>
                        <td className="px-4 py-3 text-admin-muted">{new Date(s.purchaseDate).toLocaleDateString('ru-RU')} — {new Date(s.expiresDate).toLocaleDateString('ru-RU')}</td>
                        <td className="px-4 py-3 w-40">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-2 flex-1" />
                            <span className="text-xs">{s.usedClasses}/{st?.classCount ?? '∞'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge className={statusColors[s.status]}>{getSubscriptionStatusLabel(s.status)}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <div className="rounded-lg border border-admin-border bg-white p-8 text-center text-admin-muted">История посещений будет доступна после подключения базы данных</div>
        </TabsContent>
        <TabsContent value="enrollments" className="mt-4">
          {enrolledClasses.length === 0 ? (
            <div className="rounded-lg border border-admin-border bg-white p-8 text-center text-admin-muted">Нет активных записей</div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-admin-border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-admin-border bg-gray-50 text-left text-xs text-admin-muted"><th className="px-4 py-3">Дата</th><th className="px-4 py-3">Направление</th><th className="px-4 py-3">Время</th><th className="px-4 py-3">Преподаватель</th></tr></thead>
                <tbody>
                  {enrolledClasses.map(c => {
                    const dir = getDirection(c.directionId);
                    const teacher = getTeacher(c.teacherId);
                    return (
                      <tr key={c.id} className="border-b border-admin-border last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3">{new Date(c.date).toLocaleDateString('ru-RU')}</td>
                        <td className="px-4 py-3"><span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: dir?.color }} />{dir?.name}</td>
                        <td className="px-4 py-3">{c.startTime}–{c.endTime}</td>
                        <td className="px-4 py-3 text-admin-muted">{teacher?.firstName} {teacher?.lastName?.[0]}.</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
