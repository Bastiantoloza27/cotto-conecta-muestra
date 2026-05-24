import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const TIPOS = [
  { value: "control_rutina", label: "Control rutina" },
  { value: "urgencia", label: "Urgencia" },
  { value: "seguimiento", label: "Seguimiento" },
  { value: "evaluacion_inicial", label: "Evaluación inicial" },
  { value: "alta_medica", label: "Alta médica" },
  { value: "otro", label: "Otro" },
];

export default function InformeMedicoFormDialog({ informe, residents, onClose }) {
  const queryClient = useQueryClient();
  const isEditing = !!informe;

  const [form, setForm] = useState({
    fecha_visita: informe?.fecha_visita || new Date().toISOString().slice(0, 10),
    medico_nombre: informe?.medico_nombre || "",
    tipo_intervencion: informe?.tipo_intervencion || "control_rutina",
    descripcion_intervencion: informe?.descripcion_intervencion || "",
    cambios_medicacion: informe?.cambios_medicacion || "",
    observaciones: informe?.observaciones || "",
    firma_medico: informe?.firma_medico || "",
    residente_ids: informe?.residente_ids || "",
    residente_nombres: informe?.residente_nombres || "",
  });

  const [selectedResidents, setSelectedResidents] = useState(() => {
    if (!informe?.residente_ids) return [];
    return informe.residente_ids.split(",").map(s => s.trim()).filter(Boolean);
  });

  // sync residente_ids and residente_nombres when selection changes
  useEffect(() => {
    const selected = residents.filter(r => selectedResidents.includes(r.id));
    setForm(f => ({
      ...f,
      residente_ids: selectedResidents.join(", "),
      residente_nombres: selected.map(r => r.full_name).join(", "),
    }));
  }, [selectedResidents, residents]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEditing) {
        return base44.entities.InformeMedico.update(informe.id, data);
      } else {
        return base44.entities.InformeMedico.create(data);
      }
    },
    onSuccess: async (saved) => {
      queryClient.invalidateQueries({ queryKey: ["informes-medico"] });
      // Notify director via email
      try {
        const action = isEditing ? "modificó" : "registró";
        await base44.integrations.Core.SendEmail({
          to: "director@cottolengo.cl",
          subject: `📋 Informe médico ${isEditing ? "actualizado" : "nuevo"} — ${form.fecha_visita}`,
          body: `El médico ${form.medico_nombre} ${action} un informe médico.\n\nFecha de visita: ${form.fecha_visita}\nResidentes: ${form.residente_nombres || "No especificado"}\nTipo: ${form.tipo_intervencion}\n\nDescripción:\n${form.descripcion_intervencion}\n\n${form.cambios_medicacion ? `Cambios en medicación:\n${form.cambios_medicacion}\n\n` : ""}${form.observaciones ? `Observaciones:\n${form.observaciones}` : ""}`,
        });
      } catch { /* notificación no crítica */ }
      onClose();
    },
  });

  const toggleResident = (id) => {
    setSelectedResidents(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, notificado_director: true });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar informe médico" : "Nuevo informe médico"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fecha de la visita *</Label>
              <Input
                type="date"
                value={form.fecha_visita}
                onChange={(e) => setForm({ ...form, fecha_visita: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de intervención</Label>
              <Select value={form.tipo_intervencion} onValueChange={(v) => setForm({ ...form, tipo_intervencion: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nombre del médico *</Label>
            <Input
              value={form.medico_nombre}
              onChange={(e) => setForm({ ...form, medico_nombre: e.target.value })}
              placeholder="Dr./Dra. Nombre Apellido"
              required
            />
          </div>

          {/* Residents selector */}
          <div className="space-y-1.5">
            <Label>Residentes atendidos</Label>
            <div className="border rounded-lg p-3 max-h-36 overflow-y-auto space-y-1.5">
              {residents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay residentes activos</p>
              ) : (
                residents.map(r => (
                  <div key={r.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`res-${r.id}`}
                      checked={selectedResidents.includes(r.id)}
                      onCheckedChange={() => toggleResident(r.id)}
                    />
                    <label htmlFor={`res-${r.id}`} className="text-sm cursor-pointer">{r.full_name}</label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descripción de la intervención *</Label>
            <Textarea
              value={form.descripcion_intervencion}
              onChange={(e) => setForm({ ...form, descripcion_intervencion: e.target.value })}
              placeholder="Describe detalladamente la intervención realizada..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cambios en medicación</Label>
            <Textarea
              value={form.cambios_medicacion}
              onChange={(e) => setForm({ ...form, cambios_medicacion: e.target.value })}
              placeholder="Indica si se realizaron cambios en la medicación (opcional)"
              className="min-h-[70px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Observaciones generales</Label>
            <Textarea
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              placeholder="Observaciones adicionales (opcional)"
              className="min-h-[70px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Firma / Nombre completo del médico *</Label>
            <Input
              value={form.firma_medico}
              onChange={(e) => setForm({ ...form, firma_medico: e.target.value })}
              placeholder="Confirmación del médico responsable"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Registrar informe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}