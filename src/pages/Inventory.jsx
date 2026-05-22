import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Package, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const catEmojis = {
  panales: "🧷", medicamentos: "💊", alimentos: "🍎", aseo: "🧹",
  ropa: "👕", materiales: "📦", equipamiento: "🔧", otro: "📋",
};

export default function Inventory() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "", category: "otro", current_stock: 0, minimum_stock: 0,
    unit: "", location: "", notes: "",
  });
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list("category", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const lowStock = items.filter((i) => i.minimum_stock > 0 && i.current_stock <= i.minimum_stock);

  // Group by category
  const grouped = {};
  items.forEach((item) => {
    const cat = item.category || "otro";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Inventario y Recursos"
        subtitle="Control de insumos y materiales de la comunidad"
        action={() => setShowForm(true)}
        actionLabel="Agregar item"
        actionIcon={Plus}
      />

      {lowStock.length > 0 && (
        <Card className="p-3 mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800 font-medium">
              {lowStock.length} item(s) con stock bajo: {lowStock.map(i => i.name).join(", ")}
            </p>
          </div>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Inventario vacío"
          description="Comienza agregando los insumos y materiales"
          actionLabel="Agregar item"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 capitalize flex items-center gap-2">
                <span>{catEmojis[cat] || "📋"}</span> {cat.replace("_", " ")}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {catItems.map((item) => {
                  const isLow = item.minimum_stock > 0 && item.current_stock <= item.minimum_stock;
                  return (
                    <Card key={item.id} className={`p-3 ${isLow ? "border-amber-200" : ""}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.name}</p>
                        <div className="flex items-center gap-1">
                          {isLow && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(item)}><Pencil className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => { if (confirm("¿Eliminar item?")) deleteMutation.mutate(item.id); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-lg font-bold ${isLow ? "text-amber-600" : "text-foreground"}`}>
                          {item.current_stock}
                        </span>
                        <span className="text-xs text-muted-foreground">{item.unit || "unid."}</span>
                        {item.minimum_stock > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            (mín: {item.minimum_stock})
                          </span>
                        )}
                      </div>
                      {item.location && <p className="text-[10px] text-muted-foreground mt-0.5">📍 {item.location}</p>}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>✏️ Editar item</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editing.id, data: editing }); }} className="space-y-4 mt-2">
              <div><Label>Nombre *</Label><Input value={editing.name} onChange={(e) => setEditing(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><Label>Categoría</Label>
                <Select value={editing.category} onValueChange={(v) => setEditing(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="panales">🧷 Pañales</SelectItem>
                    <SelectItem value="medicamentos">💊 Medicamentos</SelectItem>
                    <SelectItem value="alimentos">🍎 Alimentos</SelectItem>
                    <SelectItem value="aseo">🧹 Aseo</SelectItem>
                    <SelectItem value="ropa">👕 Ropa</SelectItem>
                    <SelectItem value="materiales">📦 Materiales</SelectItem>
                    <SelectItem value="equipamiento">🔧 Equipamiento</SelectItem>
                    <SelectItem value="otro">📋 Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Stock actual</Label><Input type="number" value={editing.current_stock || 0} onChange={(e) => setEditing(p => ({ ...p, current_stock: Number(e.target.value) }))} /></div>
                <div><Label>Stock mínimo</Label><Input type="number" value={editing.minimum_stock || 0} onChange={(e) => setEditing(p => ({ ...p, minimum_stock: Number(e.target.value) }))} /></div>
                <div><Label>Unidad</Label><Input value={editing.unit || ""} onChange={(e) => setEditing(p => ({ ...p, unit: e.target.value }))} /></div>
              </div>
              <div><Label>Ubicación</Label><Input value={editing.location || ""} onChange={(e) => setEditing(p => ({ ...p, location: e.target.value }))} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Guardando..." : "Actualizar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>📦 Agregar item</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 mt-2">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="panales">🧷 Pañales</SelectItem>
                  <SelectItem value="medicamentos">💊 Medicamentos</SelectItem>
                  <SelectItem value="alimentos">🍎 Alimentos</SelectItem>
                  <SelectItem value="aseo">🧹 Aseo</SelectItem>
                  <SelectItem value="ropa">👕 Ropa</SelectItem>
                  <SelectItem value="materiales">📦 Materiales</SelectItem>
                  <SelectItem value="equipamiento">🔧 Equipamiento</SelectItem>
                  <SelectItem value="otro">📋 Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Stock actual</Label>
                <Input type="number" value={form.current_stock} onChange={(e) => set("current_stock", Number(e.target.value))} />
              </div>
              <div>
                <Label>Stock mínimo</Label>
                <Input type="number" value={form.minimum_stock} onChange={(e) => set("minimum_stock", Number(e.target.value))} />
              </div>
              <div>
                <Label>Unidad</Label>
                <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="ej: kg" />
              </div>
            </div>
            <div>
              <Label>Ubicación</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Agregar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}