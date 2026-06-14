import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, Megaphone, Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const NAV_ITEMS = [
  { label: "Inicio", icon: LayoutDashboard, path: "/" },
  { label: "Residentes", icon: Users, path: "/residentes" },
  { label: "Bitácora", icon: BookOpen, path: "/bitacora" },
  { label: "Avisos", icon: Megaphone, path: "/mis-avisos", badgeKey: "avisos" },
];

export default function BottomNav({ onMenuOpen }) {
  const location = useLocation();
  const [avisosBadge, setAvisosBadge] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.email || cancelled) return;
        const destinatarios = await base44.entities.AvisoDestinatario.filter({ usuario_email: me.email });
        const noLeidos = destinatarios.filter(d => !d.leido_en).length;
        if (!cancelled) setAvisosBadge(noLeidos);
      } catch { /* silencioso */ }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-pb">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const badge = item.badgeKey === "avisos" ? avisosBadge : 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
        {/* Menu button */}
        <button
          onClick={onMenuOpen}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Menú</span>
        </button>
      </div>
    </nav>
  );
}