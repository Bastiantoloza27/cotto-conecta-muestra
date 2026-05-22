import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emptyResident = {
  full_name: "", preferred_name: "", date_of_birth: "", gender: "masculino",
  rut: "", room: "", dependency_level: "moderada", disability_type: "",
  diagnoses: "", allergies: "", family_contact_name: "", family_contact_phone: "",
  family_contact_relation: "", personal_history: "", notes: "",
  admission_date: new Date().toISOString().split("T")[0], status: "activo",
};

export default function ResidentFormDialog({ open, onClose, onSubmit, isLoading, initial }) {
  const [form, setForm] = useState(initial || emptyResident);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar persona" : "Nueva persona residente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nombre completo *</Label>
              <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} required />
            </div>
            <div>
              <Label>Nombre preferido</Label>
              <Input value={form.preferred_name} onChange={(e) => set("preferred_name", e.target.value)} placeholder="¿Cómo prefiere que le llamen?" />
            </div>
            <div>
              <Label>RUT</Label>
              <Input value={form.rut} onChange={(e) => set("rut", e.target.value)} />
            </div>
            <div>
              <Label>Fecha de nacimiento</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            </div>
            <div>
              <Label>Género</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Habitación</Label>
              <Input value={form.room} onChange={(e) => set("room", e.target.value)} />
            </div>
            <div>
              <Label>Nivel de dependencia</Label>
              <Select value={form.dependency_level} onValueChange={(v) => set("dependency_level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderada">Moderada</SelectItem>
                  <SelectItem value="severa">Severa</SelectItem>
                  <SelectItem value="gran_dependencia">Gran dependencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de discapacidad</Label>
              <Select value={form.disability_type || ""} onValueChange={(v) => set("disability_type", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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
            <div>
              <Label>Fecha de ingreso</Label>
              <Input type="date" value={form.admission_date} onChange={(e) => set("admission_date", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Diagnósticos principales</Label>
            <Textarea value={form.diagnoses} onChange={(e) => set("diagnoses", e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Alergias</Label>
            <Input value={form.allergies} onChange={(e) => set("allergies", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Familiar contacto</Label>
              <Input value={form.family_contact_name} onChange={(e) => set("family_contact_name", e.target.value)} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={form.family_contact_phone} onChange={(e) => set("family_contact_phone", e.target.value)} />
            </div>
            <div>
              <Label>Relación</Label>
              <Input value={form.family_contact_relation} onChange={(e) => set("family_contact_relation", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Historia de vida</Label>
            <Textarea value={form.personal_history} onChange={(e) => set("personal_history", e.target.value)} rows={3} placeholder="Resumen de su historia, preferencias, personalidad..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : (initial ? "Actualizar" : "Crear persona")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}