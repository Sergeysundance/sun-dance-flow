import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, CreditCard, LogOut, Edit2, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  first_name: string;
  last_name: string;
  phone: string;
  birth_date: string | null;
  preferred_directions: string[] | null;
  notes: string | null;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/");
        return;
      }
      setUserEmail(session.user.email || "");
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      if (data) {
        setProfile(data);
        setEditData(data);
      }
      setLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate("/");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSave = async () => {
    if (!editData) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("profiles").update({
      first_name: editData.first_name,
      last_name: editData.last_name,
      phone: editData.phone,
      birth_date: editData.birth_date,
      preferred_directions: editData.preferred_directions,
    }).eq("user_id", session.user.id);

    if (error) {
      toast.error("Ошибка сохранения");
    } else {
      setProfile(editData);
      setEditing(false);
      toast.success("Профиль обновлён");
    }
  };

  const toggleDirection = (id: string) => {
    if (!editData) return;
    const current = editData.preferred_directions || [];
    setEditData({
      ...editData,
      preferred_directions: current.includes(id)
        ? current.filter(d => d !== id)
        : [...current, id],
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Вы вышли из системы");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  const preferredDirs = profile?.preferred_directions || [];
  const userClasses = scheduleClasses.filter(
    sc => !sc.cancelled && preferredDirs.some(d => d === sc.directionId)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="font-display text-lg font-black tracking-tight text-foreground">
            <span className="text-sun">SUN</span> DANCE SCHOOL
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{userEmail}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Выйти
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="font-display text-2xl font-bold mb-6">Личный кабинет</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-1">
              <User className="h-4 w-4" /> Профиль
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1">
              <CreditCard className="h-4 w-4" /> Абонементы
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1">
              <Calendar className="h-4 w-4" /> Расписание
            </TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Мои данные</CardTitle>
                {!editing ? (
                  <Button variant="outline" size="sm" onClick={() => { setEditData(profile); setEditing(true); }}>
                    <Edit2 className="h-4 w-4 mr-1" /> Редактировать
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Отмена</Button>
                    <Button variant="sun" size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" /> Сохранить
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Имя</Label>
                    {editing ? (
                      <Input className="border-muted-foreground/40" value={editData?.first_name || ""} onChange={e => setEditData(prev => prev ? { ...prev, first_name: e.target.value } : prev)} />
                    ) : (
                      <p className="text-foreground mt-1">{profile?.first_name || "—"}</p>
                    )}
                  </div>
                  <div>
                    <Label>Фамилия</Label>
                    {editing ? (
                      <Input className="border-muted-foreground/40" value={editData?.last_name || ""} onChange={e => setEditData(prev => prev ? { ...prev, last_name: e.target.value } : prev)} />
                    ) : (
                      <p className="text-foreground mt-1">{profile?.last_name || "—"}</p>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Телефон</Label>
                  {editing ? (
                    <Input className="border-muted-foreground/40" value={editData?.phone || ""} onChange={e => setEditData(prev => prev ? { ...prev, phone: e.target.value } : prev)} />
                  ) : (
                    <p className="text-foreground mt-1">{profile?.phone || "—"}</p>
                  )}
                </div>
                <div>
                  <Label>Дата рождения</Label>
                  {editing ? (
                    <Input className="border-muted-foreground/40" type="date" value={editData?.birth_date || ""} onChange={e => setEditData(prev => prev ? { ...prev, birth_date: e.target.value || null } : prev)} />
                  ) : (
                    <p className="text-foreground mt-1">
                      {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString("ru-RU") : "—"}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-foreground mt-1">{userEmail}</p>
                </div>
                <div>
                  <Label>Предпочтительные направления</Label>
                  {editing ? (
                    <div className="mt-1.5 space-y-1.5 rounded-md border border-border p-3">
                      {directions.filter(d => d.active).map(d => (
                        <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={(editData?.preferred_directions || []).includes(d.id)}
                            onCheckedChange={() => toggleDirection(d.id)}
                          />
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {preferredDirs.length > 0
                        ? preferredDirs.map(id => {
                            const dir = directions.find(d => d.id === id);
                            return dir ? (
                              <span key={id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border border-border">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dir.color }} />
                                {dir.name}
                              </span>
                            ) : null;
                          })
                        : <p className="text-muted-foreground">Не выбрано</p>
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions tab */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Мои абонементы</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">У вас пока нет активных абонементов. Посмотрите доступные варианты на <a href="/#pricing" className="text-sun hover:underline">странице абонементов</a>.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Расписание по моим направлениям</CardTitle>
              </CardHeader>
              <CardContent>
                {userClasses.length > 0 ? (
                  <div className="space-y-3">
                    {userClasses.slice(0, 10).map(sc => {
                      const dir = directions.find(d => d.id === sc.directionId);
                      return (
                        <div key={sc.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: dir?.color }} />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{dir?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sc.date).toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })} · {sc.startTime}–{sc.endTime}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {sc.enrolledClientIds.length}/{sc.maxSpots} мест
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {preferredDirs.length === 0
                      ? "Выберите предпочтительные направления в профиле, чтобы видеть расписание."
                      : "Нет занятий по выбранным направлениям."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
