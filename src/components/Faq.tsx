import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

const Faq = () => {
  const [items, setItems] = useState<FaqItem[]>([]);

  useEffect(() => {
    supabase
      .from("faq")
      .select("*")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setItems(data as FaqItem[]);
      });
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="faq" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-10 text-center font-display text-3xl font-black uppercase tracking-tight text-foreground md:text-4xl">
          ВОПРОС / <span className="text-sun">ОТВЕТ</span>
        </h2>
        <div className="mx-auto max-w-2xl">
          <Accordion type="single" collapsible className="w-full">
            {items.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-border"
              >
                <AccordionTrigger className="text-left font-body text-base font-semibold text-foreground hover:no-underline hover:text-sun">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default Faq;
