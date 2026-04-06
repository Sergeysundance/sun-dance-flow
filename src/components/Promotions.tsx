import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Percent } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_percent: number;
  starts_at: string | null;
  ends_at: string | null;
}

const Promotions = () => {
  const [promos, setPromos] = useState<Promotion[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("promotions")
        .select("*")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${today}`)
        .or(`ends_at.is.null,ends_at.gte.${today}`)
        .order("sort_order");
      if (data) setPromos(data as Promotion[]);
    };
    fetch();
  }, []);

  if (promos.length === 0) return null;

  return (
    <section id="promotions" className="bg-foreground py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 font-display text-4xl font-black uppercase text-background sm:text-5xl lg:text-6xl"
        >
          АКЦИИ И СКИДКИ
        </motion.h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo, i) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative flex flex-col gap-3 rounded-lg border border-sun/30 bg-background p-6"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-bold uppercase text-foreground">
                  {promo.name}
                </h3>
                <span className="flex items-center gap-1 rounded-sm bg-sun px-2 py-0.5 font-display text-sm font-bold text-primary-foreground">
                  <Percent className="h-3.5 w-3.5" />
                  -{promo.discount_percent}%
                </span>
              </div>

              <p className="flex-1 font-body text-sm text-muted-foreground">
                {promo.description}
              </p>

              {promo.ends_at && (
                <p className="font-body text-xs text-muted-foreground">
                  Действует до {new Date(promo.ends_at).toLocaleDateString("ru-RU")}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Promotions;
