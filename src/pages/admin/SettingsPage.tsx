import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

interface HourEntry { day: string; open: string; close: string }

interface StudioData {
  name: string; slogan: string; address: string; phone: string;
  email: string; telegram: string; whatsapp: string; vk: string;
  description: string; hours: HourEntry[];
}

interface TelegramData { bot_token: string; admin_chat_id: string }

interface RulesData {
  cancel_hours: number; auto_activate_days: number; free_freeze_days: number;
  paid_freeze_14_price: number; paid_freeze_30_price: number;
}

interface LegalData {
  entity_name: string; inn: string; ogrn: string; email: string; work_hours: string;
}

const DEFAULT_HOURS: HourEntry[] = [
  { day: 'Понедельник', open: '10:00', close: '22:00' },
  { day: 'Вторник', open: '10:00', close: '22:00' },
  { day: 'Среда', open: '10:00', close: '22:00' },
  { day: 'Четверг', open: '10:00', close: '22:00' },
  { day: 'Пятница', open: '10:00', close: '22:00' },
  { day: 'Суббота', open: '11:00', close: '20:00' },
  { day: 'Воскресенье', open: '11:00', close: '20:00' },
];

export default function SettingsPage() {
  const [studio, setStudio] = useState<StudioData>({
    name: '', slogan: '', address: '', phone: '', email: '',
    telegram: '', whatsapp: '', vk: '', description: '', hours: DEFAULT_HOURS,
  });
  const [telegram, setTelegram] = useState<TelegramData>({ bot_token: '', admin_chat_id: '' });
  const [rules, setRules] = useState<RulesData>({
    cancel_hours: 3, auto_activate_days: 7, free_freeze_days: 14,
    paid_freeze_14_price: 700, paid_freeze_30_price: 1000,
  });
  const [legal, setLegal] = useState<LegalData>({
    entity_name: '', inn: '', ogrn: '', email: '', work_hours: 'Пн-Вс: 09:00–22:00',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("studio_settings")
      .select("key, value")
      .then(({ data }) => {
        if (data) {
          for (const row of data) {
            const val = row.value as Record<string, unknown>;
            if (row.key === 'studio') setStudio(val as unknown as StudioData);
            if (row.key === 'telegram') setTelegram(val as unknown as TelegramData);
            if (row.key === 'rules') setRules(val as unknown as RulesData);
            if (row.key === 'legal') setLegal(val as unknown as LegalData);
          }
        }
        setLoading(false);
      });
  }, []);

  const save = async (key: string, value: unknown) => {
    const { error } = await supabase
      .from("studio_settings")
      .update({ value: value as any, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) {
      toast.error("Ошибка сохранения");
      console.error(error);
    } else {
      toast.success("Настройки сохранены");
    }
  };

  const updateStudio = (field: keyof StudioData, val: string) =>
    setStudio(prev => ({ ...prev, [field]: val }));

  const updateHour = (idx: number, field: 'open' | 'close', val: string) =>
    setStudio(prev => ({
      ...prev,
      hours: prev.hours.map((h, i) => i === idx ? { ...h, [field]: val } : h),
    }));

  if (loading) return <div className="text-admin-muted">Загрузка...</div>;

  return (
    <Tabs defaultValue="studio">
      <TabsList className="bg-gray-100 flex flex-wrap h-auto gap-1">
        <TabsTrigger value="studio">Студия</TabsTrigger>
        <TabsTrigger value="legal">Юрид. данные</TabsTrigger>
        <TabsTrigger value="telegram">Telegram</TabsTrigger>
        <TabsTrigger value="rules">Правила</TabsTrigger>
        <TabsTrigger value="security">Безопасность</TabsTrigger>
      </TabsList>

      <TabsContent value="studio" className="mt-4">
        <Card className="bg-white border-admin-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div><Label>Название студии</Label><Input value={studio.name} onChange={e => updateStudio('name', e.target.value)} className="bg-white border-admin-border" /></div>
              <div><Label>Слоган</Label><Input value={studio.slogan} onChange={e => updateStudio('slogan', e.target.value)} className="bg-white border-admin-border" /></div>
              <div><Label>Адрес</Label><Input value={studio.address} onChange={e => updateStudio('address', e.target.value)} className="bg-white border-admin-border" /></div>
              <div><Label>Телефон</Label><Input value={studio.phone} onChange={e => updateStudio('phone', e.target.value)} className="bg-white border-admin-border" /></div>
              <div><Label>Email</Label><Input type="email" value={studio.email} onChange={e => updateStudio('email', e.target.value)} className="bg-white border-admin-border" /></div>
              <div><Label>Telegram</Label><Input value={studio.telegram} onChange={e => updateStudio('telegram', e.target.value)} className="bg-white border-admin-border" /></div>
              <div><Label>WhatsApp</Label><Input value={studio.whatsapp} onChange={e => updateStudio('whatsapp', e.target.value)} className="bg-white border-admin-border" /></div>
              <div><Label>VK</Label><Input value={studio.vk} onChange={e => updateStudio('vk', e.target.value)} className="bg-white border-admin-border" /></div>
            </div>
            <div><Label>Описание</Label><Textarea value={studio.description} onChange={e => updateStudio('description', e.target.value)} className="bg-white border-admin-border" /></div>

            <div>
              <Label className="mb-2 block">Часы работы</Label>
              <div className="overflow-x-auto rounded-lg border border-admin-border">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-xs text-admin-muted"><th className="px-3 py-2 text-left">День</th><th className="px-3 py-2">Открытие</th><th className="px-3 py-2">Закрытие</th></tr></thead>
                  <tbody>
                    {studio.hours.map((h, i) => (
                      <tr key={h.day} className="border-t border-admin-border">
                        <td className="px-3 py-2 text-admin-foreground">{h.day}</td>
                        <td className="px-3 py-2"><Input type="time" value={h.open} onChange={e => updateHour(i, 'open', e.target.value)} className="w-28 bg-white border-admin-border" /></td>
                        <td className="px-3 py-2"><Input type="time" value={h.close} onChange={e => updateHour(i, 'close', e.target.value)} className="w-28 bg-white border-admin-border" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => save('studio', studio)}>Сохранить</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="legal" className="mt-4">
        <Card className="bg-white border-admin-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <p className="text-sm text-admin-muted">
              Юридическая информация, обязательная для размещения на сайте согласно законодательству РФ (149-ФЗ, 2300-1).
              Данные отображаются в футере сайта и в публичной оферте.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Полное наименование юрлица / ИП</Label>
                <Input
                  placeholder='ИП Иванов Иван Иванович или ООО «Название»'
                  value={legal.entity_name}
                  onChange={e => setLegal(prev => ({ ...prev, entity_name: e.target.value }))}
                  className="bg-white border-admin-border"
                />
              </div>
              <div>
                <Label>ИНН</Label>
                <Input
                  placeholder="123456789012"
                  value={legal.inn}
                  onChange={e => setLegal(prev => ({ ...prev, inn: e.target.value }))}
                  className="bg-white border-admin-border"
                />
              </div>
              <div>
                <Label>ОГРН / ОГРНИП</Label>
                <Input
                  placeholder="1234567890123"
                  value={legal.ogrn}
                  onChange={e => setLegal(prev => ({ ...prev, ogrn: e.target.value }))}
                  className="bg-white border-admin-border"
                />
              </div>
              <div>
                <Label>Email для связи (обязательно по 149-ФЗ)</Label>
                <Input
                  type="email"
                  placeholder="info@example.com"
                  value={legal.email}
                  onChange={e => setLegal(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-white border-admin-border"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Режим работы (отображается в футере)</Label>
                <Input
                  placeholder="Пн-Вс: 09:00–22:00"
                  value={legal.work_hours}
                  onChange={e => setLegal(prev => ({ ...prev, work_hours: e.target.value }))}
                  className="bg-white border-admin-border"
                />
              </div>
            </div>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => save('legal', legal)}>Сохранить</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="telegram" className="mt-4">
        <Card className="bg-white border-admin-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div><Label>Токен бота</Label><Input type="password" value={telegram.bot_token} onChange={e => setTelegram(prev => ({ ...prev, bot_token: e.target.value }))} className="bg-white border-admin-border" /></div>
            <div><Label>Chat ID администратора</Label><Input value={telegram.admin_chat_id} onChange={e => setTelegram(prev => ({ ...prev, admin_chat_id: e.target.value }))} className="bg-white border-admin-border" /></div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-admin-border" onClick={() => toast.info("Тестовое сообщение отправлено (заглушка)")}>Отправить тестовое сообщение</Button>
              <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => save('telegram', telegram)}>Сохранить</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="rules" className="mt-4">
        <Card className="bg-white border-admin-border shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div><Label>Время отмены без списания (часы)</Label><Input type="number" value={rules.cancel_hours} onChange={e => setRules(prev => ({ ...prev, cancel_hours: Number(e.target.value) }))} className="bg-white border-admin-border w-32" /></div>
            <div><Label>Автоактивация абонемента через (дни)</Label><Input type="number" value={rules.auto_activate_days} onChange={e => setRules(prev => ({ ...prev, auto_activate_days: Number(e.target.value) }))} className="bg-white border-admin-border w-32" /></div>
            <div><Label>Бесплатная заморозка (дни)</Label><Input type="number" value={rules.free_freeze_days} onChange={e => setRules(prev => ({ ...prev, free_freeze_days: Number(e.target.value) }))} className="bg-white border-admin-border w-32" /></div>
            <div><Label>Платная заморозка 14 дней — цена (₽)</Label><Input type="number" value={rules.paid_freeze_14_price} onChange={e => setRules(prev => ({ ...prev, paid_freeze_14_price: Number(e.target.value) }))} className="bg-white border-admin-border w-32" /></div>
            <div><Label>Платная заморозка 30 дней — цена (₽)</Label><Input type="number" value={rules.paid_freeze_30_price} onChange={e => setRules(prev => ({ ...prev, paid_freeze_30_price: Number(e.target.value) }))} className="bg-white border-admin-border w-32" /></div>
            <Button className="bg-admin-accent text-black hover:bg-yellow-400" onClick={() => save('rules', rules)}>Сохранить</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
