import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const CATEGORIAS = [
  { value: "insumos", label: "Insumos" },
  { value: "traslado", label: "Traslado" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "capacitacion", label: "Capacitación" },
  { value: "otros", label: "Otros" },
];

export default function NuevaSolicitudDialog({ open, onClose, onSubmit, user }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState({
    motivo: "",
    categoria: "",
    monto: "",
    detalle: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      solicitante_nombre: user?.full_name || user?.email || "",
      solicitante_email: user?.email || "",
      fecha_solicitud: today,
      motivo: form.motivo,
      categoria: form.categoria,
      monto: parseFloat(form.monto),
      detalle: form.detalle,
      estado: "pendiente",
    });
    setForm({ motivo: "", categoria: "", monto: "", detalle: "" });
  };

  const valid = form.motivo && form.categoria && form.monto;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Solicitante</Label>
              <Input value={user?.full_name || user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input value={today} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Motivo del gasto <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.motivo}
              onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
              placeholder="Describe el motivo del gasto..."
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Categoría <span className="text-destructive">*</span></Label>
              <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Monto (CLP) <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="1"
                value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                placeholder="Ej: 15000"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Detalle adicional</Label>
            <Textarea
              value={form.detalle}
              onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))}
              placeholder="Información adicional (opcional)..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!valid}>Enviar solicitud</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}