import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function IncidentFormDialog({ open, onClose, onSubmit, isLoading, residents = [] }) {
  const [form, setForm] = useState({
    resident_id: "", resident_name: "", date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"), type: "otro", severity: "leve",
    description: "", actions_taken: "", witnesses: "", status: "abierto",
    notified_family: false, notified_authority: false,
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleResidentChange = (id) => {
    const r = residents.find((r) => r.id === id);
    set("resident_id", id);
    set("resident_name", r?.preferred_name || r?.full_name || "");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>⚠️ Reportar incidente</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 mt-2">
          <div>
            <Label>Persona involucrada *</Label>
            <Select value={form.resident_id} onValueChange={handleResidentChange}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="caida">Caída</SelectItem>
                  <SelectItem value="agresion">Agresión</SelectItem>
                  <SelectItem value="crisis">Crisis</SelectItem>
                  <SelectItem value="accidente">Accidente</SelectItem>
                  <SelectItem value="derivacion">Derivación</SelectItem>
                  <SelectItem value="fuga">Fuga</SelectItem>
                  <SelectItem value="autolesion">Autolesión</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gravedad</Label>
              <Select value={form.severity} onValueChange={(v) => set("severity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
            <div>
              <Label>Hora</Label>
              <Input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descripción *</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} required placeholder="Describa lo ocurrido..." />
          </div>
          <div>
            <Label>Acciones tomadas</Label>
            <Textarea value={form.actions_taken} onChange={(e) => set("actions_taken", e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={form.notified_family} onCheckedChange={(v) => set("notified_family", v)} />
              <Label className="text-sm">Familia notificada</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading} variant="destructive">
              {isLoading ? "Guardando..." : "Reportar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}