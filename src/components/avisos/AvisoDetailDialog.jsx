import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const prioridadBadge = {
  informativo: "bg-green-50 text-green-700 border-green-200",
  importante: "bg-amber-50 text-amber-700 border-amber-200",
  urgente: "bg-red-50 text-red-700 border-red-200",
};

const areaLabels = {
  salud: "Salud", cuidado: "Cuidado", administracion: "Administración",
  pastoral: "Pastoral", servicios_generales: "Servicios Generales", otro: "Otro", todos: "Todos",
};

export default function AvisoDetailDialog({ aviso, confirmaciones, onClose }) {
  const areas = (aviso.areas_destino || "").split(",").map(s => s.trim()).filter(Boolean);

  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-members-detail"],
    queryFn: () => base44.entities.StaffMember.list(),
  });

  const destinatarios = areas.includes("todos")
    ? staffMembers.filter(s => s.status === "activo")
    : staffMembers.filter(s => s.status === "activo" && s.area && areas.includes(s.area));

  const confirmadosIds = new Set(confirmaciones.map(c => c.funcionario_id));

  const confirmados = confirmaciones;
  const pendientes = destinatarios.filter(s => !confirmadosIds.has(s.id));

  return (
    <Dialog open={!!aviso} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📢 {aviso.titulo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-[10px] ${prioridadBadge[aviso.prioridad]}`}>
              {aviso.prioridad}
            </Badge>
            {aviso.estado === "borrador" && (
              <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Borrador</Badge>
            )}
            {aviso.slack_enviado && <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">Slack ✓</Badge>}
          </div>

          {/* Áreas */}
          <div className="flex flex-wrap gap-1">
            {areas.map(a => (
              <span key={a} className="text-[11px] bg-primary/10 text-primary rounded-full px-2 py-0.5">
                {areaLabels[a] || a}
              </span>
            ))}
          </div>

          {/* Mensaje */}
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-sm text-foreground whitespace-pre-wrap">{aviso.mensaje}</p>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Por {aviso.autor || "Director"}</span>
            {aviso.created_date && <span>{format(new Date(aviso.created_date), "d MMM yyyy HH:mm", { locale: es })}</span>}
          </div>

          {/* Confirmaciones */}
          {aviso.requiere_confirmacion && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                Seguimiento de lectura
              </h3>

              {confirmados.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmaron ({confirmados.length})
                  </p>
                  <div className="space-y-1">
                    {confirmados.map(c => (
                      <div key={c.id} className="flex items-center justify-between text-xs bg-green-50 rounded px-2.5 py-1.5">
                        <span className="font-medium">{c.funcionario_nombre}</span>
                        <span className="text-muted-foreground">
                          {c.created_date ? format(new Date(c.created_date), "d MMM HH:mm", { locale: es }) : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendientes.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1.5 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Pendientes ({pendientes.length})
                  </p>
                  <div className="space-y-1">
                    {pendientes.map(s => (
                      <div key={s.id} className="flex items-center text-xs bg-amber-50 rounded px-2.5 py-1.5">
                        <span>{s.full_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {destinatarios.length === 0 && (
                <p className="text-xs text-muted-foreground">No se encontraron funcionarios para las áreas seleccionadas.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}