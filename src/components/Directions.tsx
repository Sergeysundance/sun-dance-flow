import { motion } from "framer-motion";

const directions = [
  { num: "01", name: "БАЧАТА", desc: "Самый чувственный социальный танец. Простые шаги, глубокая связь с партнером. Наше главное направление." },
  { num: "02", name: "ЙОГА", desc: "Баланс тела и разума. Осознанность через движение и дыхание." },
  { num: "03", name: "ВОСТОЧНЫЕ ТАНЦЫ", desc: "Пластика, грация и женская энергия. Танец, который раскрывает изнутри." },
  { num: "04", name: "ЛАТИНА", desc: "Страсть латиноамериканских ритмов. Сальса, реггетон, ча-ча-ча." },
  { num: "05", name: "CONTEMPORARY", desc: "Свобода самовыражения. Эмоции и чувства через движение." },
  { num: "06", name: "СТРЕТЧИНГ", desc: "Гибкость и расслабление. Шпагат ближе, чем ты думаешь." },
];

const Directions = () => {
  return (
    <section id="directions" className="bg-background py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 font-display text-3xl font-black uppercase text-foreground sm:text-5xl lg:text-6xl"
        >
          ВЫБЕРИ СВОЕ
          <br />
          НАПРАВЛЕНИЕ
        </motion.h2>

        <div className="flex flex-col">
          {directions.map((d, i) => (
            <motion.div
              key={d.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group flex flex-col gap-2 border-t border-border py-6 sm:flex-row sm:items-center sm:gap-8"
            >
              <span className="font-body text-sm font-semibold text-sun">{d.num}</span>
              <h3 className="font-display text-2xl font-black uppercase text-foreground transition-colors group-hover:text-sun sm:text-4xl lg:text-5xl">
                {d.name}
              </h3>
              <p className="font-body text-sm text-muted-foreground sm:ml-auto sm:max-w-xs sm:text-right">
                {d.desc}
              </p>
            </motion.div>
          ))}
          <div className="border-t border-border" />
        </div>
      </div>
    </section>
  );
};

export default Directions;
