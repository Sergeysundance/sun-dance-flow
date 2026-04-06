import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Marquee = () => {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("directions")
        .select("name")
        .eq("active", true)
        .order("sort_order");
      if (data) setItems(data.map((d) => d.name.toUpperCase()));
    };
    fetch();
  }, []);

  if (items.length === 0) return null;

  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="overflow-hidden bg-sun py-3">
      <div className="animate-marquee flex w-max items-center gap-6">
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center gap-6 whitespace-nowrap font-display text-sm font-bold uppercase tracking-wide text-primary-foreground sm:text-base">
            {item} <span className="text-primary-foreground/60">★</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;
