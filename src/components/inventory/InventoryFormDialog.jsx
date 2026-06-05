import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const EMPTY = {
  name: "", category: "farmacos", subcategory: "",
  current_stock: 0, minimum_stock: 0, warning_stock: 0,
  unit: "unid.", location: "", last_restock_date: "", expiry_date: "", notes: "",
};

export default function InventoryFormDialog({ open, onClose, onSave, item }) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(item ? { ...EMPTY, ...item } : EMPTY);
  }, [item, open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  const isEdit = !!item;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "✏️ Editar insumo" : "📦 Agregar insumo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div>
            <Label>Nombre *</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} required placeholder="Ej: Paracetamol 500mg" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoría *</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="farmacos">💊 Fármacos</SelectItem>
                  <SelectItem value="alimentacion">🍽️ Alimentación</SelectItem>
                  <SelectItem value="aseo">🧴 Aseo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategoría</Label>
              <Input value={form.subcategory || ""} onChange={e => set("subcategory", e.target.value)} placeholder="Ej: Antibióticos" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stock actual</Label>
              <Input type="number" min="0" value={form.current_stock ?? 0} onChange={e => set("current_stock", Number(e.target.value))} />
            </div>
            <div>
              <Label>Unidad</Label>
              <Input value={form.unit || ""} onChange={e => set("unit", e.target.value)} placeholder="unid., kg, L, caja" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1">🟡 Stock de advertencia</Label>
              <Input type="number" min="0" value={form.warning_stock ?? 0} onChange={e => set("warning_stock", Number(e.target.value))} />
            </div>
            <div>
              <Label className="flex items-center gap-1">🔴 Stock crítico (mínimo)</Label>
              <Input type="number" min="0" value={form.minimum_stock ?? 0} onChange={e => set("minimum_stock", Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ubicación</Label>
              <Input value={form.location || ""} onChange={e => set("location", e.target.value)} placeholder="Botiquín, despensa..." />
            </div>
            <div>
              <Label>Última reposición</Label>
              <Input type="date" value={form.last_restock_date || ""} onChange={e => set("last_restock_date", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>📅 Fecha de vencimiento</Label>
            <Input type="date" value={form.expiry_date || ""} onChange={e => set("expiry_date", e.target.value)} />
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} rows={2} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Actualizar" : "Agregar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}