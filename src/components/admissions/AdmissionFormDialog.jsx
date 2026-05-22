import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultForm = {
  full_name: "", rut: "", date_of_birth: "", gender: "", request_date: new Date().toISOString().split("T")[0],
  status: "en_espera", demand_type: "", priority: "media", origin: "", how_found_us: "",
  family_contact_name: "", family_contact_phone: "", family_contact_relation: "",
  pre_diagnoses: "", pre_medications: "", disability_type: "", senadis_registered: false, notes: "",
};

export default function AdmissionFormDialog({ open, onClose, onSubmit, isLoading }) {
  const [form, setForm] = useState(defaultForm);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm(defaultForm);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 Nueva solicitud de admisión</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Personal */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nombre completo *</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
            </div>
            <div>
              <Label>RUT</Label>
              <Input value={form.rut} onChange={(e) => set("rut", e.target.value)} placeholder="12.345.678-9" />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            </div>
            <div>
              <Label>Género</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha solicitud *</Label>
              <Input type="date" value={form.request_date} onChange={(e) => set("request_date", e.target.value)} required />
            </div>
          </div>

          {/* Status & priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_espera">En espera</SelectItem>
                  <SelectItem value="en_evaluacion">En evaluación</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridad</Label>
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">🔴 Alta</SelectItem>
                  <SelectItem value="media">🟡 Media</SelectItem>
                  <SelectItem value="baja">🟢 Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Demand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nivel de dependencia</Label>
              <Select value={form.demand_type} onValueChange={(v) => set("demand_type", v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gran_dependencia">Gran dependencia</SelectItem>
                  <SelectItem value="dependencia_severa">Severa</SelectItem>
                  <SelectItem value="dependencia_moderada">Moderada</SelectItem>
                  <SelectItem value="dependencia_leve">Leve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo discapacidad</Label>
              <Select value={form.disability_type} onValueChange={(v) => set("disability_type", v)}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisica">Física</SelectItem>
                  <SelectItem value="intelectual">Intelectual</SelectItem>
                  <SelectItem value="sensorial">Sensorial</SelectItem>
                  <SelectItem value="psiquica">Psíquica</SelectItem>
                  <SelectItem value="multiple">Múltiple</SelectItem>
                  <SelectItem value="otra">Otra</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Contacto familiar</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre</Label>
                <Input value={form.family_contact_name} onChange={(e) => set("family_contact_name", e.target.value)} />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.family_contact_phone} onChange={(e) => set("family_contact_phone", e.target.value)} />
              </div>
              <div>
                <Label>Relación</Label>
                <Input value={form.family_contact_relation} onChange={(e) => set("family_contact_relation", e.target.value)} placeholder="Hijo/a, hermano/a..." />
              </div>
              <div>
                <Label>Procedencia</Label>
                <Input value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="Hospital, derivación..." />
              </div>
            </div>
          </div>

          {/* Medical */}
          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Antecedentes previos</p>
            <div className="space-y-2">
              <div>
                <Label>Diagnósticos</Label>
                <Textarea value={form.pre_diagnoses} onChange={(e) => set("pre_diagnoses", e.target.value)} rows={2} />
              </div>
              <div>
                <Label>Medicamentos actuales</Label>
                <Textarea value={form.pre_medications} onChange={(e) => set("pre_medications", e.target.value)} rows={2} />
              </div>
            </div>
          </div>

          <div>
            <Label>Observaciones</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Registrar solicitud"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}