import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import AuthDialog from "./AuthDialog";

const navItems = [
  { label: "О НАС", href: "#about" },
  { label: "КОМАНДА", href: "#team" },
  { label: "НАПРАВЛЕНИЯ", href: "#directions" },
  { label: "РАСПИСАНИЕ", href: "#schedule" },
  { label: "АБОНЕМЕНТЫ", href: "#pricing" },
  { label: "КОНТАКТЫ", href: "#contacts" },
];

const Header = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

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

        <div className="hidden lg:flex items-center gap-2">
          <a href="#cta">
            <Button variant="sun" size="sm">
              ПРОБНЫЙ УРОК
            </Button>
          </a>
          {user ? (
            <Button variant="sunInverse" size="sm" onClick={() => navigate("/dashboard")}>
              <User className="h-4 w-4 mr-1" /> КАБИНЕТ
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}>
              ВОЙТИ
            </Button>
          )}
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
          {user ? (
            <Button variant="sunInverse" size="lg" onClick={() => { setMenuOpen(false); navigate("/dashboard"); }}>
              <User className="h-4 w-4 mr-1" /> КАБИНЕТ
            </Button>
          ) : (
            <Button variant="outline" size="lg" onClick={() => { setMenuOpen(false); setAuthOpen(true); }}>
              ВОЙТИ
            </Button>
          )}
        </div>
      )}

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </header>
  );
};

export default Header;
