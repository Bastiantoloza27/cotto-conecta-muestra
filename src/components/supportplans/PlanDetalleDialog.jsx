import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PROFESIONES } from "@/components/intervenciones/FormularioIntervencion";
import { Calendar, Target, Users, ChevronDown, ChevronUp, Check, Pencil, X } from "lucide-react";

const areaEmojis = {
  autonomia: "🙌", salud: "🏥", social: "👥", emocional: "💛",
  espiritual: "🕊️", comunicacion: "💬", movilidad: "🦿", cognitivo: "🧠", otro: "📌",
};

const statusConfig = {
  activo:      { label: "En proceso",  cls: "bg-blue-100 text-blue-700 border-blue-200" },
  en_pausa:    { label: "En pausa",    cls: "bg-amber-100 text-amber-700 border-amber-200" },
  logrado:     { label: "Logrado",     cls: "bg-green-100 text-green-700 border-green-200" },
  reformulado: { label: "Reformulado", cls: "bg-purple-100 text-purple-700 border-purple-200" },
  cerrado:     { label: "Cerrado",     cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

// ─── Línea de tiempo de una intervención ───────────────────────────────────
function TimelineItem({ inv, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const prof = PROFESIONES.find(p => p.key === inv.profesion);

  return (
    <div className="flex gap-3">
      {/* Línea vertical + nodo */}
      <div className="flex flex-col items-center">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 border-2 border-white shadow-sm"
          style={{ background: prof ? undefined : "#e5e7eb" }}
        >
          <span>{prof?.icon || "📋"}</span>
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Contenido */}
      <div className={`flex-1 pb-4 ${isLast ? "" : ""}`}>
        <div className="bg-white border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {prof && (
                  <Badge className={`text-[10px] border ${prof.color}`}>
                    {prof.icon} {prof.label}
                  </Badge>
                )}
                {inv.tipo_intervencion && (
                  <Badge variant="outline" className="text-[10px]">{inv.tipo_intervencion}</Badge>
                )}
              </div>
              <p className="text-xs font-semibold mt-1 text-foreground">{inv.profesional_nombre}</p>
              <p className="text-[11px] text-muted-foreground">
                {inv.fecha ? format(parseISO(inv.fecha), "EEEE d 'de' MMMM yyyy", { locale: es }) : "Sin fecha"}
              </p>
            </div>
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-0.5"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Preview evaluación */}
          {!expanded && inv.evaluacion && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
              "{inv.evaluacion}"
            </p>
          )}

          {/* Detalle expandible */}
          {expanded && (
            <div className="mt-3 space-y-2 border-t pt-3">
              {inv.evaluacion && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Evaluación / Hallazgos</p>
                  <p className="text-xs mt-0.5">{inv.evaluacion}</p>
                </div>
              )}
              {inv.objetivos && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Objetivos</p>
                  <p className="text-xs mt-0.5">{inv.objetivos}</p>
                </div>
              )}
              {inv.acciones && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Acciones realizadas</p>
                  <p className="text-xs mt-0.5">{inv.acciones}</p>
                </div>
              )}
              {inv.indicaciones && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Indicaciones</p>
                  <p className="text-xs mt-0.5">{inv.indicaciones}</p>
                </div>
              )}
              {inv.observaciones && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Observaciones</p>
                  <p className="text-xs mt-0.5">{inv.observaciones}</p>
                </div>
              )}
              {inv.proxima_sesion && (
                <p className="text-[11px] text-primary font-medium">
                  📅 Próxima sesión: {format(parseISO(inv.proxima_sesion), "dd MMM yyyy", { locale: es })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Editor inline de avance ────────────────────────────────────────────────
function AvanceEditor({ plan, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(plan.progress || 0);
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    onSave({ progress: Number(value), evaluations: notes ? `${plan.evaluations ? plan.evaluations + "\n\n" : ""}[${format(new Date(), "dd/MM/yyyy")}] ${notes}` : plan.evaluations });
    setEditing(false);
    setNotes("");
  };

  if (!editing) {
    return (
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold flex items-center gap-1.5">
            <Target className="w-4 h-4 text-primary" /> Avance del plan
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">{plan.progress || 0}%</span>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditing(true)}>
              <Pencil className="w-3 h-3" /> Actualizar
            </Button>
          </div>
        </div>
        <Progress value={plan.progress || 0} className="h-2.5" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-sm font-semibold text-primary flex items-center gap-1.5">
        <Pencil className="w-3.5 h-3.5" /> Registrar avance
      </p>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Input
            type="range" min={0} max={100} step={5}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="flex-1 h-2 cursor-pointer accent-primary"
          />
          <span className="text-xl font-bold text-primary w-12 text-right">{value}%</span>
        </div>
        <Progress value={Number(value)} className="h-2" />
      </div>
      <Textarea
        placeholder="Nota de avance (opcional): ¿qué cambió? ¿qué logros se observaron?..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
        className="text-xs bg-white"
      />
      <div className="flex gap-2">
        <Button size="sm" className="gap-1 flex-1" onClick={handleSave}>
          <Check className="w-3.5 h-3.5" /> Guardar avance
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setEditing(false); setValue(plan.progress || 0); }}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Dialog principal ───────────────────────────────────────────────────────
export default function PlanDetalleDialog({ plan, open, onOpenChange }) {
  const queryClient = useQueryClient();

  const { data: intervenciones = [] } = useQuery({
    queryKey: ["intervenciones-plan", plan?.id],
    queryFn: () => base44.entities.IntervencionProfesional.filter({ plan_apoyo_id: plan.id }),
    enabled: !!plan?.id && open,
  });

  const updatePlan = useMutation({
    mutationFn: (data) => base44.entities.SupportPlan.update(plan.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support-plans"] }),
  });

  if (!plan) return null;

  const sorted = [...intervenciones].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const profesionesUnicas = [...new Set(intervenciones.map(i => i.profesion))];
  const sc = statusConfig[plan.status] || statusConfig.activo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">

        {/* Cabecera con color por área */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-b px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-3">
              <span className="text-3xl mt-0.5">{areaEmojis[plan.area] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold leading-snug">{plan.title}</p>
                <p className="text-sm text-muted-foreground font-normal mt-0.5">👤 {plan.resident_name}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 flex-wrap mt-3">
            <Badge className={`text-[11px] border ${sc.cls}`}>{sc.label}</Badge>
            <Badge variant="secondary" className="text-[11px] capitalize">{plan.area}</Badge>
            {plan.responsible && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" /> {plan.responsible}
              </span>
            )}
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* Edición de avance inline */}
          <AvanceEditor plan={plan} onSave={(data) => updatePlan.mutate(data)} />

          {/* Fechas */}
          {(plan.start_date || plan.target_date || plan.revision_date) && (
            <div className="grid grid-cols-3 gap-2">
              {plan.start_date && (
                <div className="rounded-lg border bg-white p-2.5 text-center">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Inicio</p>
                  <p className="text-xs font-semibold">{format(parseISO(plan.start_date), "dd MMM yy", { locale: es })}</p>
                </div>
              )}
              {plan.target_date && (
                <div className="rounded-lg border bg-white p-2.5 text-center">
                  <Target className="w-3.5 h-3.5 text-primary mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground">Meta</p>
                  <p className="text-xs font-semibold">{format(parseISO(plan.target_date), "dd MMM yy", { locale: es })}</p>
                </div>
              )}
              {plan.revision_date && (
                <div className="rounded-lg border bg-amber-50 border-amber-200 p-2.5 text-center">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 mx-auto mb-1" />
                  <p className="text-[10px] text-amber-600">Revisión</p>
                  <p className="text-xs font-semibold text-amber-700">{format(parseISO(plan.revision_date), "dd MMM yy", { locale: es })}</p>
                </div>
              )}
            </div>
          )}

          {/* Info del plan */}
          {(plan.description || plan.diagnostico_situacion || plan.indicadores_logro || plan.supports) && (
            <div className="rounded-xl border bg-white p-4 space-y-3">
              {plan.description && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Descripción</p>
                  <p className="text-sm">{plan.description}</p>
                </div>
              )}
              {plan.diagnostico_situacion && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Diagnóstico de situación</p>
                  <p className="text-sm">{plan.diagnostico_situacion}</p>
                </div>
              )}
              {plan.indicadores_logro && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Indicadores de logro</p>
                  <p className="text-sm">{plan.indicadores_logro}</p>
                </div>
              )}
              {plan.supports && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Apoyos y estrategias</p>
                  <p className="text-sm">{plan.supports}</p>
                </div>
              )}
            </div>
          )}

          {/* Equipo */}
          {profesionesUnicas.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Equipo interdisciplinar activo
              </p>
              <div className="flex flex-wrap gap-2">
                {profesionesUnicas.map(pk => {
                  const prof = PROFESIONES.find(p => p.key === pk);
                  if (!prof) return null;
                  const count = intervenciones.filter(i => i.profesion === pk).length;
                  return (
                    <div key={pk} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${prof.color}`}>
                      <span>{prof.icon}</span>
                      <span>{prof.label}</span>
                      <span className="bg-white/50 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Línea de tiempo */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                🕐 Línea de tiempo colaborativa
              </p>
              <Badge variant="outline" className="text-[11px]">{intervenciones.length} intervención{intervenciones.length !== 1 ? "es" : ""}</Badge>
            </div>

            {sorted.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">Aún no hay intervenciones vinculadas.</p>
                <p className="text-xs text-muted-foreground mt-1">Al registrar una intervención, selecciona este plan para verla aquí.</p>
              </div>
            ) : (
              <div>
                {sorted.map((inv, idx) => (
                  <TimelineItem key={inv.id} inv={inv} isLast={idx === sorted.length - 1} />
                ))}
              </div>
            )}
          </div>

          {/* Notas de evaluación */}
          {plan.evaluations && (
            <div className="rounded-xl border bg-amber-50 border-amber-200 p-4">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-2">📝 Historial de notas de evaluación</p>
              <p className="text-xs text-amber-900 whitespace-pre-line leading-relaxed">{plan.evaluations}</p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}