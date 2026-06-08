import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PROFESIONES } from "@/components/intervenciones/FormularioIntervencion";
import { Calendar, Target, Users, ClipboardList } from "lucide-react";

const areaEmojis = {
  autonomia: "🙌", salud: "🏥", social: "👥", emocional: "💛",
  espiritual: "🕊️", comunicacion: "💬", movilidad: "🦿", cognitivo: "🧠", otro: "📌",
};

const statusColors = {
  activo: "bg-blue-50 text-blue-700 border-blue-200",
  en_pausa: "bg-amber-50 text-amber-700 border-amber-200",
  logrado: "bg-green-50 text-green-700 border-green-200",
  reformulado: "bg-purple-50 text-purple-700 border-purple-200",
  cerrado: "bg-muted text-muted-foreground",
};

export default function PlanDetalleDialog({ plan, open, onOpenChange }) {
  const { data: intervenciones = [] } = useQuery({
    queryKey: ["intervenciones-plan", plan?.id],
    queryFn: () => base44.entities.IntervencionProfesional.filter({ plan_apoyo_id: plan.id }),
    enabled: !!plan?.id && open,
  });

  if (!plan) return null;

  // Profesiones únicas que han intervenido
  const profesionesUnicas = [...new Set(intervenciones.map(i => i.profesion))];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">{areaEmojis[plan.area] || "📌"}</span>
            {plan.title}
          </DialogTitle>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <Badge variant="outline" className={`text-[10px] capitalize ${statusColors[plan.status] || ""}`}>
              {plan.status?.replace("_", " ")}
            </Badge>
            <Badge variant="secondary" className="text-[10px] capitalize">{plan.area}</Badge>
            <span className="text-xs text-muted-foreground">— {plan.resident_name}</span>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-1">

          {/* Progreso */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-medium flex items-center gap-1.5"><Target className="w-4 h-4 text-primary" /> Avance del plan</span>
              <span className="font-bold text-primary text-lg">{plan.progress || 0}%</span>
            </div>
            <Progress value={plan.progress || 0} className="h-2" />
          </div>

          {/* Descripción y diagnóstico */}
          {(plan.description || plan.diagnostico_situacion) && (
            <div className="space-y-3">
              {plan.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Descripción</p>
                  <p className="text-sm text-foreground">{plan.description}</p>
                </div>
              )}
              {plan.diagnostico_situacion && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Diagnóstico de situación</p>
                  <p className="text-sm text-foreground">{plan.diagnostico_situacion}</p>
                </div>
              )}
            </div>
          )}

          {/* Indicadores de logro */}
          {plan.indicadores_logro && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Indicadores de logro</p>
              <p className="text-sm text-foreground">{plan.indicadores_logro}</p>
            </div>
          )}

          {/* Apoyos */}
          {plan.supports && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Apoyos y estrategias</p>
              <p className="text-sm text-foreground">{plan.supports}</p>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-3 gap-3">
            {plan.start_date && (
              <div className="rounded-lg border p-3 text-center">
                <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">Inicio</p>
                <p className="text-xs font-semibold">{format(parseISO(plan.start_date), "dd MMM yyyy", { locale: es })}</p>
              </div>
            )}
            {plan.target_date && (
              <div className="rounded-lg border p-3 text-center">
                <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">Meta</p>
                <p className="text-xs font-semibold">{format(parseISO(plan.target_date), "dd MMM yyyy", { locale: es })}</p>
              </div>
            )}
            {plan.revision_date && (
              <div className="rounded-lg border p-3 text-center">
                <ClipboardList className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[10px] text-muted-foreground">Próx. revisión</p>
                <p className="text-xs font-semibold">{format(parseISO(plan.revision_date), "dd MMM yyyy", { locale: es })}</p>
              </div>
            )}
          </div>

          {/* Equipo involucrado */}
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Equipo profesional
            </p>
            {plan.responsible && (
              <p className="text-sm mb-2">
                <span className="text-muted-foreground text-xs">Responsable: </span>
                <span className="font-medium">{plan.responsible}</span>
              </p>
            )}
            {plan.profesionales_involucrados && (
              <div className="flex flex-wrap gap-1 mb-2">
                {plan.profesionales_involucrados.split(",").map(p => p.trim()).filter(Boolean).map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            )}
            {profesionesUnicas.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1.5">Profesiones que han intervenido:</p>
                <div className="flex flex-wrap gap-1.5">
                  {profesionesUnicas.map(pk => {
                    const prof = PROFESIONES.find(p => p.key === pk);
                    if (!prof) return null;
                    return (
                      <Badge key={pk} className={`text-[10px] border ${prof.color}`}>
                        {prof.icon} {prof.label} ({intervenciones.filter(i => i.profesion === pk).length})
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Intervenciones vinculadas */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" /> Intervenciones vinculadas
              <span className="ml-auto font-bold text-foreground text-sm">{intervenciones.length}</span>
            </p>
            {intervenciones.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground">Aún no hay intervenciones vinculadas a este plan.</p>
                <p className="text-xs text-muted-foreground mt-1">Al registrar una intervención, podrás asociarla a este plan.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {intervenciones.sort((a, b) => b.fecha?.localeCompare(a.fecha)).map(inv => {
                  const prof = PROFESIONES.find(p => p.key === inv.profesion);
                  return (
                    <Card key={inv.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            {prof && <Badge className={`text-[10px] border ${prof.color}`}>{prof.icon} {prof.label}</Badge>}
                            <Badge variant="outline" className="text-[10px]">{inv.tipo_intervencion}</Badge>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {inv.fecha ? format(parseISO(inv.fecha), "dd MMM yyyy", { locale: es }) : ""}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Por: <span className="font-medium text-foreground">{inv.profesional_nombre}</span>
                          </p>
                          {inv.evaluacion && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inv.evaluacion}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Evaluaciones y observaciones */}
          {plan.evaluations && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notas de evaluación</p>
              <p className="text-sm text-foreground whitespace-pre-line">{plan.evaluations}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}