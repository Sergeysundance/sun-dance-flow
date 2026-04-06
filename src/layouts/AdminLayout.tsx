import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, CreditCard,
  Ticket, DoorOpen, Sparkles, Mail, CheckSquare, Settings, Menu, Bell, Sun, HelpCircle, MapPin, BadgePercent,
} from "lucide-react";
import { BranchProvider } from "@/contexts/BranchContext";
import BranchSelector from "@/components/BranchSelector";

const navItems = [
  { title: "Обзор", path: "/admin", icon: LayoutDashboard },
  { title: "Клиенты", path: "/admin/clients", icon: Users },
  { title: "Преподаватели", path: "/admin/teachers", icon: GraduationCap },
  { title: "Расписание", path: "/admin/schedule", icon: CalendarDays },
  { title: "Типы абонементов", path: "/admin/subscription-types", icon: Ticket },
  { title: "Абонементы", path: "/admin/subscriptions", icon: CreditCard },
  { title: "Залы", path: "/admin/rooms", icon: DoorOpen },
  { title: "Направления", path: "/admin/directions", icon: Sparkles },
  { title: "Заявки", path: "/admin/trial-requests", icon: Mail },
  { title: "Check-in", path: "/admin/check-in", icon: CheckSquare },
  { title: "Вопрос/Ответ", path: "/admin/faq", icon: HelpCircle },
  { title: "Акции и скидки", path: "/admin/promotions", icon: BadgePercent },
  { title: "Филиалы", path: "/admin/branches", icon: MapPin },
  { title: "Настройки", path: "/admin/settings", icon: Settings },
];

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Обзор";
  const item = navItems.find(i => i.path !== "/admin" && pathname.startsWith(i.path));
  return item?.title || "CRM";
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-admin-border px-4 py-4">
        <Sun className="h-6 w-6 text-admin-accent" />
        <div>
          <div className="text-sm font-semibold text-admin-foreground">SUN DANCE SCHOOL</div>
          <div className="text-xs text-admin-muted">CRM</div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/admin"}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-md px-3 py-1.5 text-sm text-admin-muted transition-colors hover:bg-admin-hover hover:text-admin-foreground"
            activeClassName="!bg-admin-active !text-admin-foreground border-l-2 border-admin-accent font-medium"
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <BranchProvider>
      <div className="admin-theme flex h-screen bg-admin-bg">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 flex-shrink-0 border-r border-admin-border bg-white lg:block">
          <SidebarContent />
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-14 items-center justify-between border-b border-admin-border bg-white px-4">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden text-admin-foreground">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-60 p-0 bg-white border-admin-border">
                  <SidebarContent onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <h1 className="text-lg font-semibold text-admin-foreground">{pageTitle}</h1>
              <BranchSelector variant="admin" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-admin-muted">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-accent text-sm font-semibold text-black">
                А
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-admin-bg p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </BranchProvider>
  );
}
