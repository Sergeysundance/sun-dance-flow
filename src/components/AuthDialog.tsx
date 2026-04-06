import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Mode = "login" | "register";
type Role = "student" | "teacher";

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>("student");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  // Directions from DB
  const [directions, setDirections] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      supabase.from("directions").select("*").eq("active", true).order("sort_order").then(({ data }) => {
        if (data) setDirections(data);
      });
    }
  }, [open]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFirstName("");
    setLastName("");
    setMiddleName("");
    setPhone("");
    setBirthDate("");
    setSelectedDirections([]);
    setBio("");
    setRole("student");
    setConsentGiven(false);
  };

  const toggleDirection = (id: string) => {
    setSelectedDirections(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Заполните email и пароль");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Вы вошли в систему!");
      resetForm();
      onOpenChange(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName || !middleName || !phone) {
      toast.error("Заполните все обязательные поля (Имя, Фамилия, Отчество, Телефон, Email, Пароль)");
      return;
    }
    if (!consentGiven) {
      toast.error("Необходимо дать согласие на обработку персональных данных");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          phone,
          birth_date: birthDate || "",
          preferred_directions: selectedDirections,
        },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (data.user) {
      // If teacher, save pending registration data (will be processed by DB trigger)
      if (role === "teacher") {
        await supabase.from("pending_teacher_registrations").insert({
          user_id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          phone,
          email,
          bio,
          direction_ids: selectedDirections,
        });
      }

      // Send welcome email (non-blocking)
      supabase.functions.invoke("send-welcome-email", {
        body: {
          email,
          firstName,
          lastName,
          middleName,
          role: role === "teacher" ? "преподаватель" : "ученик",
        },
      }).catch(() => {});
    }

    setLoading(false);
    toast.success("Регистрация прошла успешно!");
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {mode === "login" ? "Вход" : "Регистрация"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "login" ? "sun" : "outline"}
            size="sm"
            onClick={() => setMode("login")}
            className="flex-1"
          >
            Вход
          </Button>
          <Button
            variant={mode === "register" ? "sun" : "outline"}
            size="sm"
            onClick={() => setMode("register")}
            className="flex-1"
          >
            Регистрация
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {mode === "register" && (
            <>
              {/* Role selector */}
              <div>
                <Label>Я регистрируюсь как</Label>
                <div className="flex gap-2 mt-1.5">
                  <Button
                    type="button"
                    variant={role === "student" ? "sun" : "outline"}
                    size="sm"
                    onClick={() => setRole("student")}
                    className="flex-1"
                  >
                    Ученик
                  </Button>
                  <Button
                    type="button"
                    variant={role === "teacher" ? "sun" : "outline"}
                    size="sm"
                    onClick={() => setRole("teacher")}
                    className="flex-1"
                  >
                    Преподаватель
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Фамилия *</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <div>
                  <Label>Имя *</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Отчество *</Label>
                <Input value={middleName} onChange={e => setMiddleName(e.target.value)} />
              </div>
              <div>
                <Label>Телефон *</Label>
                <Input placeholder="+7 (___) ___-__-__" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Пароль *</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div>
              <Label>Повторите пароль *</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`pr-10 ${
                    confirmPassword
                      ? password === confirmPassword
                        ? "border-primary focus-visible:ring-primary"
                        : "border-destructive focus-visible:ring-destructive"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">Пароли не совпадают</p>
              )}
            </div>
          )}

          {mode === "register" && (
            <>
              <div>
                <Label>Дата рождения</Label>
                <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
              </div>

              {role === "teacher" && (
                <div>
                  <Label>О себе (био)</Label>
                  <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Расскажите о своём опыте" />
                </div>
              )}

              <div className="rounded-md border border-border p-3 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer text-sm">
                  <Checkbox
                    checked={consentGiven}
                    onCheckedChange={(v) => setConsentGiven(!!v)}
                    className="mt-0.5"
                  />
                  <span className="text-muted-foreground leading-tight">
                    Я даю согласие на обработку персональных данных в соответствии с{" "}
                    <a href="/privacy" target="_blank" className="text-sun underline hover:no-underline">
                      Политикой конфиденциальности
                    </a>{" "}
                    и принимаю условия{" "}
                    <a href="/terms" target="_blank" className="text-sun underline hover:no-underline">
                      Пользовательского соглашения
                    </a>
                  </span>
                </label>
              </div>

              <div>
                <Label>{role === "teacher" ? "Направления преподавания" : "Предпочтительные направления"}</Label>
                <div className="mt-1.5 space-y-1.5 rounded-md border border-border p-3">
                  {directions.filter(d => d.active).map(d => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={selectedDirections.includes(d.id)}
                        onCheckedChange={() => toggleDirection(d.id)}
                      />
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <Button
          variant="sun"
          className="w-full mt-2"
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
