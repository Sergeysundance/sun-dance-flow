import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

function formatPrice(price: number): string {
  return price.toLocaleString("ru-RU") + " ₽";
}

const Pricing = () => {
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("subscription_types")
        .select("*")
        .eq("active", true)
        .order("price");
      if (data) setPlans(data);
    };
    fetch();
  }, []);

  return (
    <section id="pricing" className="bg-background py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 font-display text-4xl font-black uppercase text-foreground sm:text-5xl lg:text-6xl"
        >
          АБОНЕМЕНТЫ
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const badge = plan.old_price
              ? `-${Math.round((1 - plan.price / plan.old_price) * 100)}%`
              : plan.hours_count === null
              ? "ХИТ"
              : null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:border-sun/40"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-lg font-bold uppercase text-foreground">
                    {plan.name}
                  </h3>
                  {badge && (
                    <span className="rounded-sm bg-sun px-2 py-0.5 font-display text-xs font-bold text-primary-foreground">
                      {badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-black text-foreground">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.old_price && (
                    <span className="font-body text-sm text-muted-foreground line-through">
                      {formatPrice(plan.old_price)}
                    </span>
                  )}
                </div>

                <p className="flex-1 font-body text-sm text-muted-foreground">
                  {plan.description}
                </p>

                <a href="#cta">
                  <Button variant="sun" className="w-full">
                    Записаться
                  </Button>
                </a>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
