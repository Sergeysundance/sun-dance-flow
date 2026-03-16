import { motion } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const About = () => {
  return (
    <section id="about" className="bg-background py-20 sm:py-28">
      <div className="container mx-auto grid grid-cols-1 gap-12 px-4 lg:grid-cols-2">
        {/* Left — photo placeholder + title */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col gap-6"
        >
          <div className="flex aspect-[3/4] max-h-[500px] items-center justify-center rounded-lg bg-muted">
            <span className="font-body text-sm text-muted-foreground">фото зала</span>
          </div>
          <h2 className="font-display text-2xl font-black uppercase leading-tight text-foreground sm:text-3xl lg:text-4xl">
            ПРОСТРАНСТВО
            <br />
            ОСОЗНАННОГО
            <br />
            ДВИЖЕНИЯ
          </h2>
        </motion.div>

        {/* Right — stats + text + review */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col gap-8"
        >
          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <p className="font-display text-4xl font-black text-sun">2 500+</p>
              <p className="font-body text-xs text-muted-foreground">участников сообщества</p>
            </div>
            <div>
              <p className="font-display text-4xl font-black text-sun">6</p>
              <p className="font-body text-xs text-muted-foreground">направлений от бачаты до йоги</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="font-display text-2xl font-black text-sun">Все уровни</p>
              <p className="font-body text-xs text-muted-foreground">от полного нуля до продвинутых</p>
            </div>
          </div>

          {/* Text */}
          <p className="font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
            Sun Dance School — это место, где каждый найдет свое направление и уровень. Мы специализируемся на бачате
            и социальных танцах, но также предлагаем йогу, стретчинг и другие направления. Наша студия находится в
            Красносельском районе Санкт-Петербурга, на проспекте Ветеранов.
          </p>

          {/* Review */}
          <div className="rounded-lg bg-card p-6">
            <p className="mb-4 font-body text-sm italic text-foreground">
              «Пришла на бачату ради интереса, а теперь не могу остановиться. Потрясающая атмосфера и внимательные
              преподаватели!»
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-display text-sm font-bold text-sun">
                А
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-foreground">Анна</p>
                <p className="font-body text-xs text-muted-foreground">28 лет</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;
