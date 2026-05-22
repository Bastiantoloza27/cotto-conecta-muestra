import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  AlertTriangle,
  Calendar,
  Pill,
  Heart,
  Church,
  BarChart3,
  Package,
  ClipboardList,
  Clock,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Inicio", icon: LayoutDashboard, path: "/" },
  { label: "Residentes", icon: Users, path: "/residentes" },
  { label: "Bitácora", icon: BookOpen, path: "/bitacora" },
  { label: "Plan de Apoyos", icon: ClipboardList, path: "/planes" },
  { label: "Medicación", icon: Pill, path: "/medicacion" },
  { label: "Incidentes", icon: AlertTriangle, path: "/incidentes" },
  { label: "Actividades", icon: Calendar, path: "/actividades" },
  { label: "Turnos", icon: Clock, path: "/turnos" },
  { label: "Pastoral", icon: Church, path: "/pastoral" },
  { label: "Inventario", icon: Package, path: "/inventario" },
  { label: "Evidencia SENADIS", icon: BarChart3, path: "/senadis" },
];

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold text-sidebar-foreground tracking-tight">Providentia</h1>
              <p className="text-[10px] text-muted-foreground leading-none">Gestión Residencial</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-sidebar-accent">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
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
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Providentia v1.0 · Cuidado con dignidad
          </p>
        </div>
      </aside>
    </>
  );
}