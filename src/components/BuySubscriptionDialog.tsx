import { useState, useEffect } from "react";
import { Check, CreditCard, Loader2 } from "lucide-react";
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

interface SubscriptionPlan {
  id: string;
  name: string;
  hours_count: number | null;
  price: number;
  old_price: number | null;
  description: string;
}

interface BuySubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptionType?: string;
}

const BuySubscriptionDialog = ({ open, onOpenChange, subscriptionType = "group" }: BuySubscriptionDialogProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setFetching(true);
    supabase
      .from("subscription_types")
      .select("id, name, hours_count, price, old_price, description")
      .eq("active", true)
      .eq("type", subscriptionType)
      .order("price", { ascending: true })
      .then(({ data }) => {
        setPlans(data || []);
        setFetching(false);
      });
  }, [open, subscriptionType]);

  const handlePurchase = async () => {
    if (selected === null) return;
    const plan = plans[selected];
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
          subscription_type_id: plan.id,
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

  const formatHours = (n: number) => {
    if (n === 1) return "1 час";
    if (n >= 2 && n <= 4) return `${n} часа`;
    return `${n} часов`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Выберите абонемент</DialogTitle>
          <DialogDescription>Выберите абонемент и перейдите к оплате</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Нет доступных абонементов</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 my-4">
              {plans.map((plan, idx) => {
                const pricePerHour = plan.hours_count ? Math.round(plan.price / plan.hours_count) : null;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelected(idx)}
                    className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                      selected === idx
                        ? "border-sun bg-sun/10 shadow-md"
                        : "border-border hover:border-sun/40"
                    }`}
                  >
                    <div className="font-display text-lg font-bold text-foreground">{plan.name}</div>
                    {plan.hours_count && (
                      <div className="text-sm text-muted-foreground">{formatHours(plan.hours_count)}</div>
                    )}
                    <div className="font-display text-2xl font-black text-foreground mt-1">
                      {plan.price.toLocaleString("ru-RU")} ₽
                    </div>
                    {plan.old_price && (
                      <div className="text-xs text-muted-foreground line-through">
                        {plan.old_price.toLocaleString("ru-RU")} ₽
                      </div>
                    )}
                    {pricePerHour && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {pricePerHour} ₽ / час
                      </div>
                    )}
                    {selected === idx && (
                      <div className="absolute top-2 left-2">
                        <Check className="h-5 w-5 text-sun" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 pt-2">
          <Button
            variant="sun"
            className="w-full"
            disabled={selected === null || loading || fetching}
            onClick={handlePurchase}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {loading ? "Создание платежа..." : "Перейти к оплате"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuySubscriptionDialog;
