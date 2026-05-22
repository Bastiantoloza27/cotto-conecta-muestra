import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, BookOpen, AlertTriangle, Calendar, Pill,
  Heart, Church, BarChart3, Package, ClipboardList, Clock, X,
  ChevronDown, ChevronRight, ClipboardPlus, Activity, UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
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
      { label: "Bitácora", icon: BookOpen, path: "/bitacora" },
      { label: "Plan de Apoyos", icon: ClipboardList, path: "/planes" },
    ]
  },
  {
    label: "Salud",
    items: [
      { label: "Medicación", icon: Pill, path: "/medicacion" },
      { label: "Incidentes", icon: AlertTriangle, path: "/incidentes" },
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
    ]
  }
];

function NavGroup({ group, currentPath, onClose }) {
  const hasActive = group.items.some(i => currentPath === i.path);
  const [open, setOpen] = useState(hasActive || group.label === null);

  if (group.label === null) {
    return (
      <div className="space-y-0.5 mb-1">
        {group.items.map((item) => (
          <NavItem key={item.path} item={item} isActive={currentPath === item.path} onClose={onClose} />
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
            <NavItem key={item.path} item={item} isActive={currentPath === item.path} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItem({ item, isActive, onClose }) {
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
      {item.label}
    </Link>
  );
}

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

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