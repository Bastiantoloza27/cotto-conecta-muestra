import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const statusConfig = {
  en_espera:     { label: "En espera",     color: "bg-amber-50 text-amber-700 border-amber-200" },
  en_evaluacion: { label: "En evaluación", color: "bg-blue-50 text-blue-700 border-blue-200" },
  aprobado:      { label: "Aprobado",      color: "bg-green-50 text-green-700 border-green-200" },
  ingresado:     { label: "Ingresado",     color: "bg-primary/10 text-primary border-primary/20" },
  descartado:    { label: "Descartado",    color: "bg-muted text-muted-foreground" },
};

export default function AdmissionDetailDialog({ admission, onClose, onUpdate, isLoading }) {
  const [status, setStatus] = useState(admission.status);
  const [notes, setNotes] = useState(admission.notes || "");
  const [admissionDate, setAdmissionDate] = useState(admission.admission_date || "");

  const handleSave = () => {
    onUpdate({ status, notes, admission_date: admissionDate });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{admission.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Info rows */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">RUT</p>
              <p className="font-medium">{admission.rut || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fecha solicitud</p>
              <p className="font-medium">{admission.request_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contacto familiar</p>
              <p className="font-medium">{admission.family_contact_name || "—"}</p>
              {admission.family_contact_phone && (
                <p className="text-xs text-muted-foreground">{admission.family_contact_phone}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Procedencia</p>
              <p className="font-medium">{admission.origin || "—"}</p>
            </div>
          </div>

          {admission.pre_diagnoses && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Diagnósticos previos</p>
              <p className="text-sm bg-muted rounded-md px-3 py-2">{admission.pre_diagnoses}</p>
            </div>
          )}

          {admission.pre_medications && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Medicamentos actuales</p>
              <p className="text-sm bg-muted rounded-md px-3 py-2">{admission.pre_medications}</p>
            </div>
          )}

          {/* Editable fields */}
          <div className="border-t pt-3 space-y-3">
            <div>
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_espera">En espera</SelectItem>
                  <SelectItem value="en_evaluacion">En evaluación</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="ingresado">Ingresado</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(status === "aprobado" || status === "ingresado") && (
              <div>
                <Label>Fecha de ingreso</Label>
                <Input type="date" value={admissionDate} onChange={(e) => setAdmissionDate(e.target.value)} />
              </div>
            )}

            <div>
              <Label>Observaciones</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}