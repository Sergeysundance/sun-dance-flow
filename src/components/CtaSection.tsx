import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuthDialog from "./AuthDialog";

const CtaSection = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [direction, setDirection] = useState("");
  const [directions, setDirections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [trialUsed, setTrialUsed] = useState(false);

  useEffect(() => {
    const fetchDirections = async () => {
      const { data } = await supabase
        .from("directions")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (data) setDirections(data);
    };
    fetchDirections();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkTrialUsed(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkTrialUsed(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkTrialUsed = async (uid: string) => {
    const { data } = await supabase
      .from("trial_requests")
      .select("id")
      .eq("user_id", uid)
      .limit(1);
    setTrialUsed(!!(data && data.length > 0));
  };

  const handleSubmit = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (trialUsed) {
      toast.error("Вы уже использовали пробное занятие. Приобретите абонемент для записи на занятия.");
      return;
    }
    if (!name.trim() || !phone.trim() || !direction) {
      toast.error("Заполните все поля");
      return;
    }
    const selected = directions.find((d) => d.id === direction);
    setLoading(true);
    try {
      await supabase.from("trial_requests").insert({
        name: name.trim(),
        phone: phone.trim(),
        direction_id: direction,
        user_id: user.id,
      });

      const { data, error } = await supabase.functions.invoke("create-trial-payment", {
        body: {
          name: name.trim(),
          phone: phone.trim(),
          direction_id: direction,
          direction_name: selected?.name,
          returnUrl: window.location.origin,
        },
      });
      if (error || !data?.confirmation_url) {
        toast.error(data?.error || "Ошибка создания платежа");
        setLoading(false);
        return;
      }
      window.location.href = data.confirmation_url;
    } catch {
      toast.error("Ошибка соединения");
      setLoading(false);
    }
  };

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
          {trialUsed
            ? "Приобретите абонемент для записи на занятия"
            : "Первое групповое занятие — 550 ₽ вместо 1 100 ₽"}
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto flex max-w-md flex-col gap-4"
        >
          <Button
            variant="sunInverse"
            size="lg"
            className="w-full py-6 text-base"
            onClick={trialUsed ? () => window.location.href = "#pricing" : () => {
              if (!user) { setAuthOpen(true); return; }
              window.location.href = "#directions";
            }}
          >
            {trialUsed
              ? "ВЫБРАТЬ АБОНЕМЕНТ"
              : user
                ? "ЗАПИСАТЬСЯ НА ПРОБНОЕ ЗАНЯТИЕ"
                : "ВОЙТИ И ЗАПИСАТЬСЯ"}
          </Button>
        </motion.div>
      </div>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </section>
  );
};

export default CtaSection;
