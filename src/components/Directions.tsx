import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AuthDialog from "./AuthDialog";

const Directions = () => {
  const [directions, setDirections] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [trialUsed, setTrialUsed] = useState(false);

  useEffect(() => {
    const fetchDirs = async () => {
      const { data } = await supabase
        .from("directions")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (data) setDirections(data);
    };
    fetchDirs();

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

  const handleDirectionClick = (d: any) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (trialUsed) {
      toast.info("Пробное занятие уже использовано. Приобретите абонемент.");
      window.location.href = "#pricing";
      return;
    }
    setSelected(d);
  };

  const handleSubmit = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (trialUsed) {
      toast.error("Вы уже использовали пробное занятие.");
      setSelected(null);
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast.error("Заполните имя и телефон");
      return;
    }
    setLoading(true);
    try {
      await supabase.from("trial_requests").insert({
        name: name.trim(),
        phone: phone.trim(),
        direction_id: selected?.id,
        user_id: user.id,
      });

      const { data, error } = await supabase.functions.invoke("create-trial-payment", {
        body: {
          name: name.trim(),
          phone: phone.trim(),
          direction_id: selected?.id,
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
              key={d.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group flex cursor-pointer flex-col gap-2 border-t border-border py-6 sm:flex-row sm:items-center sm:gap-8"
              onClick={() => handleDirectionClick(d)}
            >
              <span className="font-body text-sm font-semibold text-sun">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-2xl font-black uppercase text-foreground transition-colors group-hover:text-sun sm:text-4xl lg:text-5xl">
                {d.name}
              </h3>
              <p className="font-body text-sm text-muted-foreground sm:ml-auto sm:max-w-xs sm:text-right">
                {d.description}
              </p>
            </motion.div>
          ))}
          <div className="border-t border-border" />
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-black uppercase">
              {selected?.name}
            </DialogTitle>
            <DialogDescription className="pt-2 font-body text-sm text-muted-foreground">
              {selected?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-3">
            <p className="font-body text-sm font-semibold text-foreground">
              Запишитесь на пробный урок — 550 ₽ вместо 1 100 ₽
            </p>
            <input
              type="text"
              placeholder="Ваше имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-border bg-background px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-sun focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-md border border-border bg-background px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-sun focus:outline-none"
            />
            <Button
              variant="sun"
              size="lg"
              className="w-full"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? "Перенаправление..." : "ОПЛАТИТЬ ПРОБНОЕ ЗАНЯТИЕ"}
            </Button>
            <p className="font-body text-xs text-muted-foreground">
              Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </section>
  );
};

export default Directions;
