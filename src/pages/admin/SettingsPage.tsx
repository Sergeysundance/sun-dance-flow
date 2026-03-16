import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const defaultHours = DAYS.map((d, i) => ({ day: d, open: i < 6 ? '10:00' : '11:00', close: i < 5 ? '22:00' : '20:00' }));

export default function SettingsPage() {
  return (
    <Tabs defaultValue="studio">
      <TabsList className="bg-gray-100">
        <TabsTrigger value="studio">Студия</TabsTrigger>
        <TabsTrigger value="telegram">Telegram</TabsTrigger>
        <TabsTrigger value="rules">Правила</TabsTrigger>
      </TabsList>

      <TabsContent value="studio" className="mt-4">
        <Card className="bg-white border-admin-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label>Название студии</Label><Input defaultValue="Sun Dance School" className="bg-white border-admin-border" /></div>
              <div><Label>Слоган</Label><Input defaultValue="Пространство осознанного движения" className="bg-white border-admin-border" /></div>
              <div><Label>Адрес</Label><Input defaultValue="пр. Ветеранов 147В, Санкт-Петербург" className="bg-white border-admin-border" /></div>
              <div><Label>Телефон</Label><Input defaultValue="+7 (921) 413-18-30" className="bg-white border-admin-border" /></div>
              <div><Label>Email</Label><Input type="email" className="bg-white border-admin-border" /></div>
              <div><Label>Telegram</Label><Input defaultValue="https://t.me/bachatasolnechno" className="bg-white border-admin-border" /></div>
              <div><Label>WhatsApp</Label><Input className="bg-white border-admin-border" /></div>
              <div><Label>VK</Label><Input defaultValue="https://vk.ru/sunbachata" className="bg-white border-admin-border" /></div>
            </div>
            <div><Label>Описание</Label><Textarea defaultValue="Sun Dance School — это место, где каждый найдет свое направление и уровень." className="bg-white border-admin-border" /></div>

            <div>
              <Label className="mb-2 block">Часы работы</Label>
              <div className="overflow-x-auto rounded-lg border border-admin-border">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-xs text-admin-muted"><th className="px-3 py-2 text-left">День</th><th className="px-3 py-2">Открытие</th><th className="px-3 py-2">Закрытие</th></tr></thead>
                  <tbody>
                    {defaultHours.map(h => (
                      <tr key={h.day} className="border-t border-admin-border">
                        <td className="px-3 py-2 text-admin-foreground">{h.day}</td>
                        <td className="px-3 py-2"><Input type="time" defaultValue={h.open} className="w-28 bg-white border-admin-border" /></td>
                        <td className="px-3 py-2"><Input type="time" defaultValue={h.close} className="w-28 bg-white border-admin-border" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => toast.success("Настройки сохранены")}>Сохранить</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="telegram" className="mt-4">
        <Card className="bg-white border-admin-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div><Label>Токен бота</Label><Input type="password" className="bg-white border-admin-border" /></div>
            <div><Label>Chat ID администратора</Label><Input className="bg-white border-admin-border" /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-admin-border" onClick={() => toast.info("Тестовое сообщение отправлено (заглушка)")}>Отправить тестовое сообщение</Button>
              <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => toast.success("Настройки Telegram сохранены")}>Сохранить</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rules" className="mt-4">
        <Card className="bg-white border-admin-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div><Label>Время отмены без списания (часы)</Label><Input type="number" defaultValue={3} className="bg-white border-admin-border w-32" /></div>
            <div><Label>Автоактивация абонемента через (дни)</Label><Input type="number" defaultValue={7} className="bg-white border-admin-border w-32" /></div>
            <div><Label>Бесплатная заморозка (дни)</Label><Input type="number" defaultValue={14} className="bg-white border-admin-border w-32" /></div>
            <div><Label>Платная заморозка 14 дней — цена (₽)</Label><Input type="number" defaultValue={700} className="bg-white border-admin-border w-32" /></div>
            <div><Label>Платная заморозка 30 дней — цена (₽)</Label><Input type="number" defaultValue={1000} className="bg-white border-admin-border w-32" /></div>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => toast.success("Правила сохранены")}>Сохранить</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
