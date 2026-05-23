import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, Target } from "lucide-react";

const COLUMNS = [
  {
    key: "activo",
    label: "En Proceso",
    emoji: "🔵",
    bg: "bg-blue-50",
    border: "border-blue-200",
    header: "bg-blue-100 text-blue-800",
  },
  {
    key: "en_pausa",
    label: "En Pausa",
    emoji: "🟡",
    bg: "bg-amber-50",
    border: "border-amber-200",
    header: "bg-amber-100 text-amber-800",
  },
  {
    key: "logrado",
    label: "Logrado",
    emoji: "🟢",
    bg: "bg-green-50",
    border: "border-green-200",
    header: "bg-green-100 text-green-700",
  },
  {
    key: "reformulado",
    label: "Reformulado",
    emoji: "🟣",
    bg: "bg-purple-50",
    border: "border-purple-200",
    header: "bg-purple-100 text-purple-800",
  },
  {
    key: "cerrado",
    label: "Cerrado",
    emoji: "⚫",
    bg: "bg-gray-50",
    border: "border-gray-200",
    header: "bg-gray-100 text-gray-600",
  },
];

const areaEmojis = {
  autonomia: "🙌", salud: "🏥", social: "👥", emocional: "💛",
  espiritual: "🕊️", comunicacion: "💬", movilidad: "🦿", cognitivo: "🧠", otro: "📌",
};

function PlanCard({ plan, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="bg-white rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">{areaEmojis[plan.area] || "📌"}</span>
          <p className="text-sm font-semibold leading-tight line-clamp-2">{plan.title}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(plan)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => { if (confirm("¿Eliminar este plan?")) onDelete(plan.id); }}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-medium mb-2">{plan.resident_name || "—"}</p>

      {plan.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{plan.description}</p>
      )}

      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
          <span>Avance</span>
          <span>{plan.progress || 0}%</span>
        </div>
        <Progress value={plan.progress || 0} className="h-1" />
      </div>

      {plan.responsible && (
        <p className="text-[10px] text-muted-foreground">👤 {plan.responsible}</p>
      )}

      {/* Quick status change */}
      <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-1">
        {COLUMNS.filter(c => c.key !== plan.status).map(col => (
          <button
            key={col.key}
            onClick={() => onStatusChange(plan, col.key)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            title={`Mover a ${col.label}`}
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ plans, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((col) => {
          const colPlans = plans.filter(p => p.status === col.key);
          return (
            <div key={col.key} className={`w-64 flex flex-col rounded-xl border ${col.border} ${col.bg}`}>
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${col.header}`}>
                <span className="text-sm font-semibold">
                  {col.emoji} {col.label}
                </span>
                <span className="text-xs font-bold bg-white/50 rounded-full px-1.5 py-0.5">
                  {colPlans.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 min-h-[120px]">
                {colPlans.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-6 opacity-60">
                    Sin planes
                  </div>
                ) : (
                  colPlans.map(plan => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}