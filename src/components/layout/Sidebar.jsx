import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, Calendar, Pill,
  Heart, Church, BarChart3, Package, ClipboardList, Clock, X,
  ChevronDown, ChevronRight, ClipboardPlus, Activity, UserCog, Megaphone, Settings, Stethoscope, Wallet, UsersRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { useRole } from "@/hooks/useRole";

const NAV_GROUPS_USER = [
  {
    label: null,
    items: [
      { label: "Inicio", icon: LayoutDashboard, path: "/" },
    ]
  },
  {
    label: "Personas",
    items: [
      { label: "Residentes", icon: Users, path: "/residentes" },
      { label: "Admisiones", icon: ClipboardPlus, path: "/admisiones" },
      { label: "Plan de Apoyos", icon: ClipboardList, path: "/planes" },
    ]
  },
  {
    label: "Cuidadoras",
    items: [
      { label: "Bitácora", icon: BookOpen, path: "/bitacora" },
    ]
  },
  {
    label: "Salud",
    items: [
      { label: "Medicación", icon: Pill, path: "/medicacion" },
      { label: "Informes del Médico", icon: Stethoscope, path: "/informes-medico" },
    ]
  },
  {
    label: "Comunidad",
    items: [
      { label: "Actividades", icon: Calendar, path: "/actividades" },
      { label: "Pastoral", icon: Church, path: "/pastoral" },
    ]
  },
  {
    label: "Gestión",
    items: [
      { label: "Personal", icon: UserCog, path: "/personal" },
      { label: "Calendario", icon: Calendar, path: "/calendario" },
      { label: "Turnos", icon: Clock, path: "/turnos" },
      { label: "Inventario", icon: Package, path: "/inventario" },
      { label: "Evidencia SENADIS", icon: BarChart3, path: "/senadis" },
      { label: "Control de Gastos", icon: Wallet, path: "/gastos" },
      { label: "Reuniones de Equipo", icon: UsersRound, path: "/reuniones" },
      { label: "Mis Avisos", icon: Megaphone, path: "/mis-avisos", badgeKey: "avisos" },
    ]
  }
];

const NAV_GROUPS_ADMIN = [
  {
    label: null,
    items: [
      { label: "Inicio", icon: LayoutDashboard, path: "/" },
    ]
  },
  {
    label: "Personas",
    items: [
      { label: "Residentes", icon: Users, path: "/residentes" },
      { label: "Admisiones", icon: ClipboardPlus, path: "/admisiones" },
      { label: "Plan de Apoyos", icon: ClipboardList, path: "/planes" },
    ]
  },
  {
    label: "Cuidadoras",
    items: [
      { label: "Bitácora", icon: BookOpen, path: "/bitacora" },
    ]
  },
  {
    label: "Salud",
    items: [
      { label: "Medicación", icon: Pill, path: "/medicacion" },
      { label: "Informes del Médico", icon: Stethoscope, path: "/informes-medico" },
    ]
  },
  {
    label: "Comunidad",
    items: [
      { label: "Actividades", icon: Calendar, path: "/actividades" },
      { label: "Pastoral", icon: Church, path: "/pastoral" },
    ]
  },
  {
    label: "Gestión",
    items: [
      { label: "Personal", icon: UserCog, path: "/personal" },
      { label: "Calendario", icon: Calendar, path: "/calendario" },
      { label: "Turnos", icon: Clock, path: "/turnos" },
      { label: "Inventario", icon: Package, path: "/inventario" },
      { label: "Evidencia SENADIS", icon: BarChart3, path: "/senadis" },
      { label: "Control de Gastos", icon: Wallet, path: "/gastos" },
      { label: "Reuniones de Equipo", icon: UsersRound, path: "/reuniones" },
      { label: "Mis Avisos", icon: Megaphone, path: "/mis-avisos", badgeKey: "avisos" },
    ]
  },
  {
    label: "Dirección",
    items: [
      { label: "Avisos del Director", icon: Megaphone, path: "/avisos" },
      { label: "Config. Slack", icon: Settings, path: "/slack-config" },
    ]
  }
];

function NavGroup({ group, currentPath, onClose, badges }) {
  const hasActive = group.items.some(i => currentPath === i.path);
  const [open, setOpen] = useState(hasActive || group.label === null);

  if (group.label === null) {
    return (
      <div className="space-y-0.5 mb-1">
        {group.items.map((item) => (
          <NavItem key={item.path} item={item} isActive={currentPath === item.path} onClose={onClose} badges={badges} />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors"
      >
        {group.label}
        {open
          ? <ChevronDown className="w-3 h-3" />
          : <ChevronRight className="w-3 h-3" />
        }
      </button>
      {open && (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavItem key={item.path} item={item} isActive={currentPath === item.path} onClose={onClose} badges={badges} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ item, isActive, onClose, badges }) {
  const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;
  return (
    <Link
      to={item.path}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      )}
    >
      <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")} />
      <span className="flex-1">{item.label}</span>
      {badgeCount > 0 && (
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {badgeCount}
        </span>
      )}
    </Link>
  );
}

export default function Sidebar({ open, onClose }) {
  const location = useLocation();
  const { isAdmin } = useRole();
  const navGroups = isAdmin ? NAV_GROUPS_ADMIN : NAV_GROUPS_USER;
  const [badges, setBadges] = useState({ avisos: 0 });

  useEffect(() => {
    let cancelled = false;
    const fetchBadges = async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.email || cancelled) return;
        const destinatarios = await base44.entities.AvisoDestinatario.filter({ usuario_email: me.email });
        const noLeidos = destinatarios.filter(d => !d.leido_en).length;
        if (!cancelled) setBadges({ avisos: noLeidos });
      } catch { /* silencioso */ }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/6a10daaa13888870642a70ef/2440d15f9_image.png"
              alt="Pequeño Cottolengo Quintero"
              className="w-10 h-10 object-contain rounded-lg bg-white p-0.5"
            />
            <div>
              <h1 className="text-[13px] font-bold text-sidebar-foreground tracking-tight leading-tight">Pequeño Cottolengo</h1>
              <p className="text-[10px] text-sidebar-foreground/50 leading-none">Quintero · Gestión Residencial</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-sidebar-accent">
            <X className="w-4 h-4 text-sidebar-foreground/50" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {navGroups.map((group, i) => (
            <NavGroup
              key={i}
              group={group}
              currentPath={location.pathname}
              onClose={onClose}
              badges={badges}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-[10px] text-sidebar-foreground/40 text-center">
            Providentia v1.0 · Cuidado con dignidad
          </p>
        </div>
      </aside>
    </>
  );
}