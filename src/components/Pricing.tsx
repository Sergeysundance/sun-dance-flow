import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const plans = [
  {
    title: "Пробное групповое",
    price: "550 ₽",
    oldPrice: "1 100 ₽",
    badge: "-50%",
    desc: "Одно групповое занятие на любое направление школы",
  },
  {
    title: "Пробное индивидуальное",
    price: "2 400 ₽",
    oldPrice: "6 000 ₽",
    badge: "-60%",
    desc: "Индивидуальное занятие по бачате с преподавателем",
  },
  {
    title: "Безлимит",
    price: "24 464 ₽",
    oldPrice: null,
    badge: "ХИТ",
    desc: "Полная свобода посещений на 1.5 месяца. Все направления школы.",
  },
];

const Pricing = () => {
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
          {plans.map((plan, i) => (
            <motion.div
              key={plan.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:border-sun/40"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-bold uppercase text-foreground">{plan.title}</h3>
                <span className="rounded-sm bg-sun px-2 py-0.5 font-display text-xs font-bold text-primary-foreground">
                  {plan.badge}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-black text-foreground">{plan.price}</span>
                {plan.oldPrice && (
                  <span className="font-body text-sm text-muted-foreground line-through">{plan.oldPrice}</span>
                )}
              </div>

              <p className="flex-1 font-body text-sm text-muted-foreground">{plan.desc}</p>

              <a href="#cta">
                <Button variant="sun" className="w-full">
                  Записаться
                </Button>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
