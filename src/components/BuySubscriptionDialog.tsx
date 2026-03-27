import { useState } from "react";
import { Check, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const subscriptionPlans = [
  { classes: 4, price: 3200, pricePerClass: 800, label: "4 занятия" },
  { classes: 8, price: 5600, pricePerClass: 700, label: "8 занятий", popular: true },
  { classes: 12, price: 7200, pricePerClass: 600, label: "12 занятий" },
  { classes: 16, price: 8800, pricePerClass: 550, label: "16 занятий", best: true },
];

interface BuySubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BuySubscriptionDialog = ({ open, onOpenChange }: BuySubscriptionDialogProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (selected === null) return;
    const plan = subscriptionPlans[selected];
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Необходимо войти в аккаунт");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          amount: plan.price,
          classes: plan.classes,
          description: `Абонемент на ${plan.classes} занятий`,
          returnUrl: window.location.origin + "/dashboard",
        },
      });

      if (error || !data?.confirmation_url) {
        toast.error(data?.error || "Ошибка создания платежа");
        setLoading(false);
        return;
      }

      window.location.href = data.confirmation_url;
    } catch (e) {
      toast.error("Ошибка при создании платежа");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Выберите абонемент</DialogTitle>
          <DialogDescription>Выберите количество занятий и перейдите к оплате</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 my-4">
          {subscriptionPlans.map((plan, idx) => (
            <button
              key={plan.classes}
              onClick={() => setSelected(idx)}
              className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                selected === idx
                  ? "border-sun bg-sun/10 shadow-md"
                  : "border-border hover:border-sun/40"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-2.5 right-2 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  Популярный
                </span>
              )}
              {plan.best && (
                <span className="absolute -top-2.5 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                  Выгодный
                </span>
              )}
              <div className="font-display text-lg font-bold text-foreground">{plan.label}</div>
              <div className="font-display text-2xl font-black text-foreground mt-1">
                {plan.price.toLocaleString("ru-RU")} ₽
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {plan.pricePerClass} ₽ / занятие
              </div>
              {selected === idx && (
                <div className="absolute top-2 left-2">
                  <Check className="h-5 w-5 text-sun" />
                </div>
              )}
            </button>
          ))}
        </div>

        <Button
          variant="sun"
          className="w-full"
          disabled={selected === null || loading}
          onClick={handlePurchase}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {loading ? "Создание платежа..." : "Перейти к оплате"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default BuySubscriptionDialog;
