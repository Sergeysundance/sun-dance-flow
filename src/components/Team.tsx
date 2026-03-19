import { motion } from "framer-motion";

const team = [
  {
    name: "Алексей Солнцев",
    tags: ["Бачата", "Латина"],
    desc: "Основатель студии. Преподает бачату более 5 лет. Создает атмосферу, в которой хочется танцевать.",
  },
  {
    name: "Марина Волкова",
    tags: ["Йога", "Стретчинг"],
    desc: "Сертифицированный инструктор йоги. Мягкий подход к каждому ученику.",
  },
  {
    name: "Диана Огнева",
    tags: ["Восточные танцы", "Contemporary"],
    desc: "Хореограф с международным опытом. Раскрывает пластику и женственность.",
  },
];

const Team = () => {
  return (
    <section id="team" className="section-light bg-background py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 font-display text-4xl font-black uppercase text-foreground sm:text-5xl lg:text-6xl"
        >
          НАША КОМАНДА
        </motion.h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col gap-4"
            >
              <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-card">
                <span className="font-body text-sm text-muted-foreground">фото</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {member.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-card px-3 py-1 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-foreground">{member.name}</h3>
              <p className="font-body text-sm text-muted-foreground">{member.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
