import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const Team = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [directions, setDirections] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [tRes, dRes] = await Promise.all([
        supabase.from("teachers").select("*").eq("active", true),
        supabase.from("directions").select("id, name").eq("active", true),
      ]);
      if (tRes.data) setTeachers(tRes.data);
      if (dRes.data) setDirections(dRes.data);
    };
    fetch();
  }, []);

  const getDirName = (id: string) => directions.find((d) => d.id === id)?.name || "";

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
          {teachers.map((member, i) => (
            <motion.div
              key={member.id}
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
                {(member.direction_ids || []).map((dirId: string) => {
                  const name = getDirName(dirId);
                  if (!name) return null;
                  return (
                    <span
                      key={dirId}
                      className="rounded-full bg-card px-3 py-1 font-body text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
              <h3 className="font-display text-xl font-bold uppercase text-foreground">
                {member.first_name} {member.last_name}
              </h3>
              <p className="font-body text-sm text-muted-foreground">{member.bio}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
