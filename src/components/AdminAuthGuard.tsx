import { useState, useEffect } from "react";
import { Sun, Lock, Eye, EyeOff, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_SESSION_KEY = "admin_authenticated";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);

  // Setup password state
  const [setupMode, setSetupMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    // Check session storage first
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (session === "true") {
      setAuthenticated(true);
      setLoading(false);
      return;
    }

    // Check if admin password exists
    const { data } = await supabase
      .from("studio_settings")
      .select("value")
      .eq("key", "admin_password")
      .maybeSingle();

    if (data && data.value && (data.value as any).hash) {
      setHasPassword(true);
    } else {
      setHasPassword(false);
      setSetupMode(true);
    }
    setLoading(false);
  };

  const hashPassword = async (pwd: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd + "sundance_admin_salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleLogin = async () => {
    if (!password.trim()) return;
    setChecking(true);

    const hash = await hashPassword(password);
    const { data } = await supabase
      .from("studio_settings")
      .select("value")
      .eq("key", "admin_password")
      .maybeSingle();

    if (data && (data.value as any).hash === hash) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setAuthenticated(true);
      toast.success("Вход выполнен");
    } else {
      toast.error("Неверный пароль");
    }
    setChecking(false);
    setPassword("");
  };

  const handleSetupPassword = async () => {
    if (newPassword.length < 4) {
      toast.error("Пароль должен быть не менее 4 символов");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    setChecking(true);
    const hash = await hashPassword(newPassword);

    // Upsert the admin password
    const { data: existing } = await supabase
      .from("studio_settings")
      .select("id")
      .eq("key", "admin_password")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("studio_settings")
        .update({ value: { hash } })
        .eq("key", "admin_password");
    } else {
      await supabase
        .from("studio_settings")
        .insert({ key: "admin_password", value: { hash } });
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    setAuthenticated(true);
    setSetupMode(false);
    toast.success("Пароль установлен. Вход выполнен.");
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Загрузка...</p>
      </div>
    );
  }

  if (authenticated) {
    return <>{children}</>;
  }

  // Setup mode — no password set yet
  if (setupMode || hasPassword === false) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Settings className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl">Создание пароля</CardTitle>
            <CardDescription>
              Установите пароль для входа в панель управления
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Новый пароль</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Введите пароль"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Подтвердите пароль</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                onKeyDown={e => e.key === "Enter" && handleSetupPassword()}
              />
            </div>
            <Button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              onClick={handleSetupPassword}
              disabled={checking}
            >
              {checking ? "Сохранение..." : "Установить пароль и войти"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login mode
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Lock className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Sun className="h-5 w-5 text-yellow-500" />
            SUN DANCE SCHOOL
          </CardTitle>
          <CardDescription>Панель управления</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Пароль администратора</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Введите пароль"
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            onClick={handleLogin}
            disabled={checking}
          >
            {checking ? "Проверка..." : "Войти"}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline"
            onClick={async () => {
              const { data } = await supabase.from("studio_settings").select("value").eq("key", "studio").maybeSingle();
              const { data: legalData } = await supabase.from("studio_settings").select("value").eq("key", "legal").maybeSingle();
              const adminEmail = (data?.value as any)?.email || (legalData?.value as any)?.email;
              if (!adminEmail) {
                toast.error("Email для восстановления не настроен в контактных данных студии");
                return;
              }
              // Generate reset code
              const code = Math.random().toString(36).slice(2, 8).toUpperCase();
              const codeHash = await hashPassword(code);
              await supabase.from("studio_settings").upsert({ key: "admin_reset_code", value: { hash: codeHash, expires: Date.now() + 600000 } } as any);
              toast.success(`Код восстановления создан. Обратитесь к владельцу email ${adminEmail} для получения кода.`);
              toast.info(`Код: ${code} (действует 10 минут)`, { duration: 30000 });
            }}
          >
            Забыли пароль?
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
