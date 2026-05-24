import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Printer, CheckCircle, XCircle } from "lucide-react";

const CATEGORIAS = {
  insumos: "Insumos", traslado: "Traslado", alimentacion: "Alimentación",
  mantenimiento: "Mantenimiento", capacitacion: "Capacitación", otros: "Otros",
};

const ESTADO_BADGE = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  aprobada: "bg-green-100 text-green-800 border-green-300",
  rechazada: "bg-red-100 text-red-800 border-red-300",
};

function formatMonto(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

export default function ResolucionDialog({ open, onClose, solicitud, onAprobar, onRechazar, onImprimir }) {
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [confirmando, setConfirmando] = useState(null); // "aprobar" | "rechazar"

  if (!solicitud) return null;

  const handleAprobar = () => {
    onAprobar(solicitud);
    setConfirmando(null);
  };

  const handleRechazar = () => {
    onRechazar(solicitud, motivoRechazo);
    setMotivoRechazo("");
    setConfirmando(null);
  };

  const isPendiente = solicitud.estado === "pendiente";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Solicitud de Gasto
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ESTADO_BADGE[solicitud.estado]}`}>
              {solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Solicitante:</span> <strong>{solicitud.solicitante_nombre}</strong></div>
            <div><span className="text-muted-foreground">Fecha:</span> {format(new Date(solicitud.fecha_solicitud + "T12:00:00"), "dd/MM/yyyy")}</div>
            <div><span className="text-muted-foreground">Categoría:</span> {CATEGORIAS[solicitud.categoria]}</div>
            <div><span className="text-muted-foreground">Monto:</span> <strong>{formatMonto(solicitud.monto)}</strong></div>
          </div>
          <div><span className="text-muted-foreground">Motivo:</span><p className="mt-0.5 bg-muted/50 rounded p-2">{solicitud.motivo}</p></div>
          {solicitud.detalle && <div><span className="text-muted-foreground">Detalle:</span><p className="mt-0.5 bg-muted/50 rounded p-2">{solicitud.detalle}</p></div>}
          {solicitud.fecha_resolucion && (
            <div className="border-t pt-2">
              <span className="text-muted-foreground">Resolución:</span>
              <p className="mt-0.5">{format(new Date(solicitud.fecha_resolucion), "dd/MM/yyyy HH:mm")} — {solicitud.director_nombre}</p>
              {solicitud.motivo_rechazo && <p className="mt-0.5 text-red-700 bg-red-50 rounded p-2">Motivo rechazo: {solicitud.motivo_rechazo}</p>}
            </div>
          )}
        </div>

        {/* Confirmación aprobar/rechazar */}
        {confirmando === "rechazar" && (
          <div className="space-y-2 border-t pt-3">
            <Label>Motivo del rechazo <span className="text-destructive">*</span></Label>
            <Textarea
              value={motivoRechazo}
              onChange={e => setMotivoRechazo(e.target.value)}
              placeholder="Indica el motivo del rechazo..."
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmando(null)}>Cancelar</Button>
              <Button variant="destructive" size="sm" disabled={!motivoRechazo} onClick={handleRechazar}>
                Confirmar rechazo
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          {!isPendiente && (
            <Button variant="outline" size="sm" onClick={() => onImprimir(solicitud)}>
              <Printer className="w-4 h-4 mr-1" /> Generar Documento
            </Button>
          )}
          {isPendiente && confirmando !== "rechazar" && (
            <>
              <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => setConfirmando("rechazar")}>
                <XCircle className="w-4 h-4 mr-1" /> Rechazar
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAprobar}>
                <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
              </Button>
            </>
          )}
          {!isPendiente && confirmando !== "rechazar" && (
            <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}