import { motion } from "framer-motion";

const photos = [
  { id: 1, rotate: -3 },
  { id: 2, rotate: 2 },
  { id: 3, rotate: -1.5 },
  { id: 4, rotate: 4 },
  { id: 5, rotate: -2 },
  { id: 6, rotate: 1 },
];

const Gallery = () => {
  return (
    <section className="bg-background py-20 sm:py-28 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex gap-4 overflow-x-auto pb-4 lg:flex-wrap lg:justify-center lg:overflow-visible">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex-shrink-0 rounded-sm bg-foreground p-2 shadow-lg"
              style={{ transform: `rotate(${photo.rotate}deg)` }}
            >
              <div className="flex h-40 w-32 items-center justify-center bg-muted sm:h-52 sm:w-40">
                <span className="font-body text-xs text-muted-foreground">фото {photo.id}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
