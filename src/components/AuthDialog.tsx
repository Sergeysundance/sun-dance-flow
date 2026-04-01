import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
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

  // Register fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedDirections, setSelectedDirections] = useState<string[]>([]);
  const [bio, setBio] = useState("");

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
    setFirstName("");
    setLastName("");
    setPhone("");
    setBirthDate("");
    setSelectedDirections([]);
    setBio("");
    setRole("student");
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
    if (!email || !password || !firstName || !phone) {
      toast.error("Заполните обязательные поля");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (data.user) {
      // Update profile
      await supabase.from("profiles").update({
        first_name: firstName,
        last_name: lastName,
        phone,
        birth_date: birthDate || null,
        preferred_directions: selectedDirections,
      }).eq("user_id", data.user.id);

      // If teacher, create teacher record linked to user
      if (role === "teacher") {
        await supabase.from("teachers").insert({
          first_name: firstName,
          last_name: lastName,
          phone,
          email,
          bio,
          direction_ids: selectedDirections,
          user_id: data.user.id,
        });
      }
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
                  <Label>Имя *</Label>
                  <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label>Фамилия</Label>
                  <Input value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
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
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

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
