import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const directionOptions = ["Бачата", "Йога", "Восточные танцы", "Латина", "Contemporary", "Стретчинг"];

const CtaSection = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [direction, setDirection] = useState("");

  return (
    <section id="cta" className="bg-sun py-20 sm:py-28">
      <div className="container mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-4 font-display text-4xl font-black uppercase text-primary-foreground sm:text-5xl lg:text-6xl"
        >
          ХВАТИТ ДУМАТЬ —
          <br />
          НАЧНИ ТАНЦЕВАТЬ
        </motion.h2>

        <p className="mb-10 font-body text-base text-primary-foreground/80">
          Первое групповое занятие — 550 ₽ вместо 1 100 ₽
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto flex max-w-md flex-col gap-4"
        >
          <input
            type="text"
            placeholder="ВАШЕ ИМЯ"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border-2 border-primary-foreground/30 bg-primary-foreground/10 px-4 py-3 font-body text-sm font-semibold uppercase tracking-wide text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary-foreground focus:outline-none"
          />
          <input
            type="tel"
            placeholder="ТЕЛЕФОН"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border-2 border-primary-foreground/30 bg-primary-foreground/10 px-4 py-3 font-body text-sm font-semibold uppercase tracking-wide text-primary-foreground placeholder:text-primary-foreground/50 focus:border-primary-foreground focus:outline-none"
          />
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="rounded-md border-2 border-primary-foreground/30 bg-primary-foreground/10 px-4 py-3 font-body text-sm font-semibold uppercase tracking-wide text-primary-foreground focus:border-primary-foreground focus:outline-none"
          >
            <option value="" className="bg-background text-foreground">НАПРАВЛЕНИЕ</option>
            {directionOptions.map((d) => (
              <option key={d} value={d} className="bg-background text-foreground">
                {d}
              </option>
            ))}
          </select>

          <Button variant="sunInverse" size="lg" className="w-full py-6 text-base">
            Я ПРИДУ
          </Button>

          <p className="font-body text-xs text-primary-foreground/60">
            Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
