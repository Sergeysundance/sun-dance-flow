import { Phone, Send, ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer id="contacts" className="bg-background py-16">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Left */}
        <div>
          <p className="mb-4 font-display text-lg font-black tracking-tight text-foreground">
            <span className="text-sun">SUN</span> DANCE SCHOOL
            <span className="block font-body text-xs font-normal tracking-wide text-muted-foreground">Школа танцев Сан Дэнс</span>
          </p>
          <p className="font-body text-sm text-muted-foreground">пр. Ветеранов 147В, Санкт-Петербург</p>
          <p className="font-body text-sm text-muted-foreground">Красносельский район</p>
        </div>

        {/* Center — nav */}
        <div className="flex flex-col gap-2">
          {["О НАС", "КОМАНДА", "НАПРАВЛЕНИЯ", "АБОНЕМЕНТЫ"].map((item) => (
            <a
              key={item}
              href={`#${item === "О НАС" ? "about" : item === "КОМАНДА" ? "team" : item === "НАПРАВЛЕНИЯ" ? "directions" : "pricing"}`}
              className="font-body text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex flex-col gap-3">
          <a href="tel:+79214131830" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-sun">
            <Phone size={16} /> +7 (921) 413-18-30
          </a>
          <a href="https://t.me/bachatasolnechno" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-sun">
            <Send size={16} /> @bachatasolnechno
          </a>
          <a href="https://vk.ru/sunbachata" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-sun">
            <ExternalLink size={16} /> vk.ru/sunbachata
          </a>
          <a
            href="https://yandex.ru/maps/?text=пр.+Ветеранов+147В+Санкт-Петербург"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block rounded-md border border-border px-4 py-2 text-center font-body text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-sun hover:text-sun"
          >
            НАЙТИ НАС НА КАРТЕ
          </a>
        </div>
      </div>

      <div className="container mx-auto mt-10 border-t border-border px-4 pt-6">
        <p className="font-body text-xs text-muted-foreground">
          © 2026 Sun Dance School. Все права защищены.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
