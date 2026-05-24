import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Stethoscope } from "lucide-react";

const TIPO_LABELS = {
  control_rutina: { label: "Control rutina", color: "bg-blue-100 text-blue-800" },
  urgencia: { label: "Urgencia", color: "bg-red-100 text-red-800" },
  seguimiento: { label: "Seguimiento", color: "bg-purple-100 text-purple-800" },
  evaluacion_inicial: { label: "Evaluación inicial", color: "bg-green-100 text-green-800" },
  alta_medica: { label: "Alta médica", color: "bg-teal-100 text-teal-800" },
  otro: { label: "Otro", color: "bg-gray-100 text-gray-800" },
};

function Section({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function InformeMedicoDetailDialog({ informe, onClose }) {
  const tipo = TIPO_LABELS[informe.tipo_intervencion] || TIPO_LABELS.otro;
  const fecha = format(new Date(informe.fecha_visita + "T12:00:00"), "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Informe médico
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-base capitalize">{fecha}</span>
            <Badge className={`${tipo.color} border-0`}>{tipo.label}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Section label="Médico" value={informe.medico_nombre} />
            <Section label="Firma" value={informe.firma_medico} />
          </div>

          {informe.residente_nombres && (
            <Section label="Residentes atendidos" value={informe.residente_nombres} />
          )}

          <Section label="Descripción de la intervención" value={informe.descripcion_intervencion} />

          {informe.cambios_medicacion && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">💊 Cambios en medicación</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{informe.cambios_medicacion}</p>
            </div>
          )}

          <Section label="Observaciones generales" value={informe.observaciones} />

          <p className="text-xs text-muted-foreground border-t pt-3">
            Registrado el {format(new Date(informe.created_date), "dd/MM/yyyy HH:mm")}
            {informe.created_by && ` · ${informe.created_by}`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}