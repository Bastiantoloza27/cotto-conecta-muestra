import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Save, X } from "lucide-react";
import { toast } from "sonner";

export default function ResidentEditForm({ resident, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...resident });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Resident.update(resident.id, form);
    qc.invalidateQueries({ queryKey: ["resident", resident.id] });
    qc.invalidateQueries({ queryKey: ["residents"] });
    toast.success("Ficha actualizada");
    onClose();
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Datos personales */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Datos Personales</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Nombre completo</Label>
            <Input value={form.full_name || ""} onChange={e => set("full_name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Nombre preferido</Label>
            <Input value={form.preferred_name || ""} onChange={e => set("preferred_name", e.target.value)} placeholder="Como le gusta que le llamen" />
          </div>
          <div className="space-y-1">
            <Label>RUT</Label>
            <Input value={form.rut || ""} onChange={e => set("rut", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Fecha de nacimiento</Label>
            <Input type="date" value={form.date_of_birth || ""} onChange={e => set("date_of_birth", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Género</Label>
            <Select value={form.gender || ""} onValueChange={v => set("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="femenino">Femenino</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Fecha de ingreso</Label>
            <Input type="date" value={form.admission_date || ""} onChange={e => set("admission_date", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Habitación</Label>
            <Input value={form.room || ""} onChange={e => set("room", e.target.value)} placeholder="Ej: 12A" />
          </div>
          <div className="space-y-1">
            <Label>Grupo sanguíneo</Label>
            <Select value={form.blood_type || ""} onValueChange={v => set("blood_type", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Estado</Label>
            <Select value={form.status || "activo"} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="hospitalizado">Hospitalizado</SelectItem>
                <SelectItem value="fallecido">Fallecido</SelectItem>
                <SelectItem value="traslado">Traslado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Nivel de dependencia</Label>
            <Select value={form.dependency_level || ""} onValueChange={v => set("dependency_level", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="moderada">Moderada</SelectItem>
                <SelectItem value="severa">Severa</SelectItem>
                <SelectItem value="gran_dependencia">Gran dependencia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Salud */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Salud</h3>
        <div className="space-y-1">
          <Label>Diagnósticos principales</Label>
          <Textarea rows={3} value={form.diagnoses || ""} onChange={e => set("diagnoses", e.target.value)} placeholder="Diagnósticos clínicos relevantes" />
        </div>
        <div className="space-y-1">
          <Label>Alergias</Label>
          <Textarea rows={2} value={form.allergies || ""} onChange={e => set("allergies", e.target.value)} placeholder="Alergias conocidas" />
        </div>
      </Card>

      {/* Historia y preferencias */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Historia y Preferencias</h3>
        <div className="space-y-1">
          <Label>Historia de vida</Label>
          <Textarea rows={4} value={form.personal_history || ""} onChange={e => set("personal_history", e.target.value)} placeholder="Resumen de historia de vida" />
        </div>
        <div className="space-y-1">
          <Label>Preferencias y rutinas</Label>
          <Textarea rows={3} value={form.preferences || ""} onChange={e => set("preferences", e.target.value)} placeholder="Gustos, rutinas preferidas, actividades" />
        </div>
        <div className="space-y-1">
          <Label>Comunicación</Label>
          <Textarea rows={2} value={form.communication_notes || ""} onChange={e => set("communication_notes", e.target.value)} placeholder="Cómo se comunica, apoyos necesarios" />
        </div>
        <div className="space-y-1">
          <Label>Espiritualidad</Label>
          <Textarea rows={2} value={form.spirituality_notes || ""} onChange={e => set("spirituality_notes", e.target.value)} placeholder="Creencias, prácticas espirituales" />
        </div>
      </Card>

      {/* Familia */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contacto Familiar</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Nombre familiar</Label>
            <Input value={form.family_contact_name || ""} onChange={e => set("family_contact_name", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Teléfono</Label>
            <Input value={form.family_contact_phone || ""} onChange={e => set("family_contact_phone", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Relación</Label>
            <Input value={form.family_contact_relation || ""} onChange={e => set("family_contact_relation", e.target.value)} placeholder="Ej: Madre, Hermano" />
          </div>
        </div>
        <div className="space-y-1">
          <Label>Contacto de emergencia</Label>
          <Input value={form.emergency_contact || ""} onChange={e => set("emergency_contact", e.target.value)} placeholder="Nombre y teléfono de emergencia" />
        </div>
      </Card>

      {/* Discapacidad */}
      <Card className="p-4 space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Discapacidad</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Tipo de discapacidad</Label>
            <Select value={form.disability_type || ""} onValueChange={v => set("disability_type", v)}>
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
          <div className="flex items-center gap-3 pt-5">
            <Switch checked={!!form.senadis_registered} onCheckedChange={v => set("senadis_registered", v)} id="senadis" />
            <Label htmlFor="senadis">Registrado en SENADIS</Label>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Observaciones adicionales</Label>
          <Textarea rows={2} value={form.notes || ""} onChange={e => set("notes", e.target.value)} />
        </div>
      </Card>

      {/* Acciones */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-background py-3 border-t">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          <X className="w-4 h-4 mr-1" /> Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1" /> {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}