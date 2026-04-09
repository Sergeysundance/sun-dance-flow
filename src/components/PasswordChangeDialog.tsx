import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PasswordChangeDialog({ open, onOpenChange }: PasswordChangeDialogProps) {
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = async () => {
    if (newPwd.length < 6) { toast.error("Пароль должен содержать минимум 6 символов"); return; }
    if (newPwd !== confirmPwd) { toast.error("Пароли не совпадают"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSaving(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Пароль успешно изменён");
      setNewPwd(""); setConfirmPwd("");
      onOpenChange(false);
    }
  };

  const handleResetByEmail = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) { toast.error("Email не найден"); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(session.user.email);
    if (error) toast.error(error.message);
    else toast.success("Ссылка для сброса пароля отправлена на вашу почту");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Смена пароля</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Новый пароль</Label>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                className="pr-10"
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPwd(!showPwd)}>
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Подтвердите пароль</Label>
            <Input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
            />
            {confirmPwd && newPwd !== confirmPwd && (
              <p className="text-xs text-destructive mt-1">Пароли не совпадают</p>
            )}
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="sun" className="w-full" onClick={handleChange} disabled={saving}>
            {saving ? "Сохранение..." : "Сменить пароль"}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleResetByEmail}>
            Восстановить через email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
