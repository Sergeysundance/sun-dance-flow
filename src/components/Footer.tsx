import { Phone, Send, ExternalLink, Mail, Clock } from "lucide-react";
import { useStudioSettings } from "@/hooks/useStudioSettings";

const Footer = () => {
  const { settings, legal } = useStudioSettings();

  const telegramHandle = settings.telegram.replace("https://t.me/", "@");
  const vkShort = settings.vk.replace("https://", "").replace("http://", "");
  const phoneDigits = settings.phone.replace(/[^\d+]/g, "");
  const contactEmail = legal.email || settings.email;

  return (
    <footer id="contacts" className="bg-background py-16">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand & Legal */}
        <div>
          <p className="mb-1 font-display text-lg font-black tracking-tight text-foreground">
            <span className="text-sun">{settings.name.split(" ")[0]?.toUpperCase()}</span>{" "}
            {settings.name.split(" ").slice(1).join(" ").toUpperCase()}
          </p>
          <p className="mb-4 font-body text-xs text-muted-foreground">Школа танцев Сан Дэнс</p>
          <p className="font-body text-sm text-muted-foreground">{settings.address}</p>
          {legal.entity_name && (
            <p className="font-body text-xs text-muted-foreground mt-2">{legal.entity_name}</p>
          )}
          {(legal.inn || legal.ogrn) && (
            <p className="font-body text-xs text-muted-foreground mt-1">
              {legal.inn && <>ИНН: {legal.inn}</>}
              {legal.inn && legal.ogrn && <> · </>}
              {legal.ogrn && <>ОГРН: {legal.ogrn}</>}
            </p>
          )}
        </div>

        {/* Nav */}
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

        {/* Contacts */}
        <div className="flex flex-col gap-3">
          <a href={`tel:${phoneDigits}`} className="flex items-center gap-2 font-body text-sm text-foreground hover:text-sun">
            <Phone size={16} /> {settings.phone}
          </a>
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 font-body text-sm text-foreground hover:text-sun">
              <Mail size={16} /> {contactEmail}
            </a>
          )}
          {settings.telegram && (
            <a href={settings.telegram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-sun">
              <Send size={16} /> {telegramHandle}
            </a>
          )}
          {settings.vk && (
            <a href={settings.vk} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-body text-sm text-foreground hover:text-sun">
              <ExternalLink size={16} /> {vkShort}
            </a>
          )}
        </div>

        {/* Work hours & Map */}
        <div className="flex flex-col gap-3">
          {legal.work_hours && (
            <div className="flex items-center gap-2 font-body text-sm text-foreground">
              <Clock size={16} /> {legal.work_hours}
            </div>
          )}
          <a
            href={`https://yandex.ru/maps/?text=${encodeURIComponent(settings.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block rounded-md border border-border px-4 py-2 text-center font-body text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-sun hover:text-sun"
          >
            НАЙТИ НАС НА КАРТЕ
          </a>
        </div>
      </div>

      <div className="container mx-auto mt-10 border-t border-border px-4 pt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body text-xs text-muted-foreground">
          © 2026 {settings.name}. Все права защищены.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="/privacy" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
            Политика конфиденциальности
          </a>
          <a href="/terms" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
            Пользовательское соглашение
          </a>
          <a href="/offer" className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
            Публичная оферта
          </a>
          <span className="font-body text-xs font-bold text-muted-foreground border border-border rounded px-1.5 py-0.5">0+</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
