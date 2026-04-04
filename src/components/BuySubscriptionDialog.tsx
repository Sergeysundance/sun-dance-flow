import { useState, useEffect } from "react";
import { Check, CreditCard, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  bonusPoints?: number;
  discountPercent?: number;
}

const BuySubscriptionDialog = ({ open, onOpenChange, subscriptionType = "group", bonusPoints = 0, discountPercent = 0 }: BuySubscriptionDialogProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [bonusToUse, setBonusToUse] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setBonusToUse(0);
    setFetching(true);
    const query = supabase
      .from("subscription_types")
      .select("id, name, hours_count, price, old_price, description, type")
      .eq("active", true);

    if (subscriptionType === "individual") {
      query.in("type", ["individual_solo", "individual_duo"]);
    } else {
      query.eq("type", subscriptionType);
    }

    query.order("price", { ascending: true })
      .then(({ data }) => {
        setPlans(data || []);
        setFetching(false);
      });
  }, [open, subscriptionType]);

  // Reset bonus when plan changes
  useEffect(() => {
    setBonusToUse(0);
  }, [selected]);

  const selectedPlan = selected !== null ? plans[selected] : null;
  const discountedPrice = selectedPlan ? Math.round(selectedPlan.price * (1 - discountPercent / 100)) : 0;
  const maxBonus = selectedPlan ? Math.min(bonusPoints, discountedPrice) : 0;
  const finalPrice = selectedPlan ? discountedPrice - bonusToUse : 0;

  const handleBonusChange = (value: number) => {
    setBonusToUse(Math.max(0, Math.min(value, maxBonus)));
  };

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
          bonus_points_to_use: bonusToUse,
          apply_teacher_discount: discountPercent > 0,
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
            <>
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
                        {discountPercent > 0 ? (
                          <>
                            <span className="line-through text-muted-foreground text-base mr-2">{plan.price.toLocaleString("ru-RU")} ₽</span>
                            {Math.round(plan.price * (1 - discountPercent / 100)).toLocaleString("ru-RU")} ₽
                          </>
                        ) : (
                          <>{plan.price.toLocaleString("ru-RU")} ₽</>
                        )}
                      </div>
                      {!discountPercent && plan.old_price && (
                        <div className="text-xs text-muted-foreground line-through">
                          {plan.old_price.toLocaleString("ru-RU")} ₽
                        </div>
                      )}
                      {pricePerHour && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {discountPercent > 0 ? Math.round(Math.round(plan.price * (1 - discountPercent / 100)) / plan.hours_count!) : pricePerHour} ₽ / час
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

              {/* Bonus points section */}
              {selected !== null && bonusPoints > 0 && (
                <div className="rounded-lg border border-sun/30 bg-sun/5 p-4 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sun text-lg">★</span>
                    <span className="font-display text-sm font-bold text-foreground">Списать бонусные баллы</span>
                    <span className="ml-auto text-xs text-muted-foreground">Доступно: {bonusPoints}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={bonusToUse <= 0}
                      onClick={() => handleBonusChange(bonusToUse - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={0}
                      max={maxBonus}
                      value={bonusToUse}
                      onChange={(e) => handleBonusChange(Number(e.target.value) || 0)}
                      className="text-center font-display font-bold h-8"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      disabled={bonusToUse >= maxBonus}
                      onClick={() => handleBonusChange(bonusToUse + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs shrink-0"
                      onClick={() => handleBonusChange(maxBonus)}
                    >
                      Все
                    </Button>
                  </div>
                  {bonusToUse > 0 && selectedPlan && (
                    <div className="mt-3 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Стоимость{discountPercent > 0 ? ' со скидкой' : ''}:</span>
                        <span>{discountedPrice.toLocaleString("ru-RU")} ₽</span>
                      </div>
                      <div className="flex justify-between text-sun font-medium">
                        <span>Скидка (бонусы):</span>
                        <span>−{bonusToUse.toLocaleString("ru-RU")} ₽</span>
                      </div>
                      <div className="flex justify-between font-display font-bold text-foreground border-t border-border mt-1 pt-1">
                        <span>Итого:</span>
                        <span>{finalPrice.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
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
            {loading ? "Создание платежа..." : finalPrice > 0 ? `Оплатить ${finalPrice.toLocaleString("ru-RU")} ₽` : "Получить бесплатно"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuySubscriptionDialog;
