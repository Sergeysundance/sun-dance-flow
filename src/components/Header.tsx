import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "О НАС", href: "#about" },
  { label: "КОМАНДА", href: "#team" },
  { label: "НАПРАВЛЕНИЯ", href: "#directions" },
  { label: "АБОНЕМЕНТЫ", href: "#pricing" },
  { label: "КОНТАКТЫ", href: "#contacts" },
];

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="#" className="font-display text-lg font-black tracking-tight text-foreground">
          <span className="text-sun">SUN</span> DANCE SCHOOL
        </a>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-body text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          <a href="#cta">
            <Button variant="sun" size="sm">
              ПРОБНЫЙ УРОК
            </Button>
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className="text-foreground lg:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col items-center justify-center gap-8 bg-background lg:hidden">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="font-display text-2xl font-bold uppercase text-foreground"
            >
              {item.label}
            </a>
          ))}
          <a href="#cta" onClick={() => setMenuOpen(false)}>
            <Button variant="sun" size="lg">
              ПРОБНЫЙ УРОК
            </Button>
          </a>
        </div>
      )}
    </header>
  );
};

export default Header;
