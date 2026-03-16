import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-dancers.jpg";

const Hero = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-background pt-16">
      <div className="container mx-auto grid grid-cols-1 items-center gap-8 px-4 lg:grid-cols-2">
        {/* Text */}
        <div className="order-1 flex min-w-0 flex-col gap-6 overflow-hidden lg:order-1">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-5xl font-black uppercase leading-none tracking-tight text-foreground sm:text-7xl lg:text-8xl xl:text-9xl"
          >
            ТАНЦУЙ
            <br />
            <span className="text-sun">ПОД СОЛНЦЕМ</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-md font-body text-base text-muted-foreground sm:text-lg"
          >
            Бачата, йога и другие направления в Красносельском районе
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-4"
          >
            <a href="#cta">
              <Button variant="sun" size="lg" className="text-base px-8 py-6">
                ПРОБНЫЙ УРОК → 550 ₽
              </Button>
            </a>
            <span className="font-body text-sm text-muted-foreground line-through">1 100 ₽</span>
          </motion.div>
        </div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="order-2 flex justify-center lg:order-2"
        >
          <img
            src={heroImage}
            alt="Пара танцует бачату в теплом свете"
            className="h-auto max-h-[70vh] w-full max-w-lg rounded-lg object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
