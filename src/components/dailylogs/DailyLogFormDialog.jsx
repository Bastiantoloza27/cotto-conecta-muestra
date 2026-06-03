import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function DailyLogFormDialog({ open, onClose, onSubmit, isLoading, residents = [], initial, categories = [], logType = "cuidadora" }) {
  const defaultCategory = categories[0]?.value || "otro";
  const [form, setForm] = useState(initial || {
    resident_id: "", resident_name: "", date: format(new Date(), "yyyy-MM-dd"),
    time: format(new Date(), "HH:mm"), category: defaultCategory, mood: "",
    title: "", description: "", shift: "manana", is_important: false,
    registered_by: "",
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-active"],
    queryFn: () => base44.entities.StaffMember.filter({ status: "activo" }),
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleResidentChange = (id) => {
    const r = residents.find((r) => r.id === id);
    set("resident_id", id);
    set("resident_name", r?.preferred_name || r?.full_name || "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? "✏️ Editar registro" : logType === "tens" ? "🩺 Nuevo registro TENS" : "🤲 Nuevo registro Cuidadoras"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label>Persona residente *</Label>
            <Select value={form.resident_id} onValueChange={handleResidentChange}>
              <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
              <SelectContent>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoría *</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado emocional</Label>
              <Select value={form.mood || "none"} onValueChange={(v) => set("mood", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin indicar</SelectItem>
                  <SelectItem value="muy_bien">😊 Muy bien</SelectItem>
                  <SelectItem value="bien">🙂 Bien</SelectItem>
                  <SelectItem value="regular">😐 Regular</SelectItem>
                  <SelectItem value="bajo">😔 Bajo</SelectItem>
                  <SelectItem value="critico">😢 Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Turno</Label>
            <Select value={form.shift} onValueChange={(v) => set("shift", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manana">☀️ Mañana</SelectItem>
                <SelectItem value="tarde">🌤️ Tarde</SelectItem>
                <SelectItem value="noche">🌙 Noche</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Registrado por</Label>
            <Select value={form.registered_by || "none"} onValueChange={(v) => set("registered_by", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cuidadora" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin indicar</SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.full_name}>
                    {s.full_name} {s.position ? `· ${s.position.replace(/_/g, " ")}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descripción *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="¿Qué ocurrió? ¿Cómo se encuentra la persona?"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_important} onCheckedChange={(v) => set("is_important", v)} />
            <Label className="text-sm">⚡ Marcar como importante</Label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : (initial ? "Actualizar" : "Registrar")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}