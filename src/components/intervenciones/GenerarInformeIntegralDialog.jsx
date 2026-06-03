import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Printer } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import InformeIntegralImprimible from "./InformeIntegralImprimible";

export default function GenerarInformeIntegralDialog({ open, onClose, residents = [] }) {
  const [residenteId, setResidenteId] = useState("");
  const [periodo, setPeriodo] = useState("semana");
  const [fechaRef, setFechaRef] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filtroProfesional, setFiltroProfesional] = useState("todos");
  const [generando, setGenerando] = useState(false);

  const { data: intervenciones = [] } = useQuery({
    queryKey: ["intervenciones-informe", residenteId],
    queryFn: () => residenteId
      ? base44.entities.IntervencionProfesional.filter({ resident_id: residenteId }, "-fecha", 200)
      : [],
    enabled: !!residenteId,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs-informe", residenteId],
    queryFn: () => residenteId
      ? base44.entities.DailyLog.filter({ resident_id: residenteId }, "-date", 200)
      : [],
    enabled: !!residenteId,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ["meds-informe", residenteId],
    queryFn: () => residenteId
      ? base44.entities.Medication.filter({ resident_id: residenteId })
      : [],
    enabled: !!residenteId,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents-informe", residenteId],
    queryFn: () => residenteId
      ? base44.entities.Incident.filter({ resident_id: residenteId }, "-date", 100)
      : [],
    enabled: !!residenteId,
  });

  const refDate = fechaRef ? parseISO(fechaRef) : new Date();
  const desde = periodo === "semana"
    ? format(startOfWeek(refDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
    : format(startOfMonth(refDate), "yyyy-MM-dd");
  const hasta = periodo === "semana"
    ? format(endOfWeek(refDate, { weekStartsOn: 1 }), "yyyy-MM-dd")
    : format(endOfMonth(refDate), "yyyy-MM-dd");

  const inRange = (dateStr) => dateStr && dateStr >= desde && dateStr <= hasta;

  const intervencionesFiltered = intervenciones.filter(inv => {
    if (!inRange(inv.fecha)) return false;
    if (filtroProfesional !== "todos" && inv.profesional_nombre !== filtroProfesional) return false;
    return true;
  });

  const logsFiltered = logs.filter(l => inRange(l.date));
  const incidentsFiltered = incidents.filter(i => inRange(i.date));

  const profesionales = [...new Set(intervenciones.map(i => i.profesional_nombre).filter(Boolean))];

  const resident = residents.find(r => r.id === residenteId);

  const handleImprimir = () => {
    if (!residenteId) { toast.error("Selecciona un residente"); return; }
    setGenerando(true);
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Permite ventanas emergentes para imprimir"); setGenerando(false); return; }
    const div = printWindow.document.createElement("div");
    printWindow.document.body.style.margin = "0";
    printWindow.document.body.appendChild(div);
    printWindow.document.title = `Informe Integral — ${resident?.full_name || "Residente"}`;
    createRoot(div).render(
      <InformeIntegralImprimible
        resident={resident}
        intervenciones={intervencionesFiltered}
        logs={logsFiltered}
        medications={medications}
        incidents={incidentsFiltered}
        periodo={periodo}
        desde={desde}
        hasta={hasta}
      />
    );
    setTimeout(() => {
      printWindow.print();
      setGenerando(false);
    }, 800);
  };

  const periodoLabel = periodo === "semana"
    ? `Semana ${format(parseISO(desde), "d MMM", { locale: es })} – ${format(parseISO(hasta), "d MMM yyyy", { locale: es })}`
    : format(parseISO(desde), "MMMM yyyy", { locale: es });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📄 Generar informe integral</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Residente *</Label>
            <Select value={residenteId} onValueChange={setResidenteId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar residente" /></SelectTrigger>
              <SelectContent>
                {residents.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">📅 Semanal</SelectItem>
                  <SelectItem value="mes">🗓️ Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha de referencia</Label>
              <Input type="date" value={fechaRef} onChange={e => setFechaRef(e.target.value)} />
            </div>
          </div>

          {residenteId && profesionales.length > 0 && (
            <div>
              <Label>Filtrar por profesional (opcional)</Label>
              <Select value={filtroProfesional} onValueChange={setFiltroProfesional}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los profesionales</SelectItem>
                  {profesionales.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {residenteId && (
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground capitalize">{periodoLabel}</p>
              <p>🩺 {intervencionesFiltered.length} intervención(es)</p>
              <p>📋 {logsFiltered.length} registro(s) de bitácora</p>
              <p>💊 {medications.filter(m => m.status === "activo").length} medicamento(s) activo(s)</p>
              <p>⚠️ {incidentsFiltered.length} incidente(s)</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleImprimir} disabled={!residenteId || generando} className="gap-2">
              <Printer className="w-4 h-4" />
              {generando ? "Preparando..." : "Imprimir informe"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}