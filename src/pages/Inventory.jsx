import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Package, AlertTriangle, AlertCircle, Pill, ShoppingBasket, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import InventoryItemCard, { getStockLevel } from "@/components/inventory/InventoryItemCard";
import InventoryFormDialog from "@/components/inventory/InventoryFormDialog";
import { toast } from "sonner";

const CATEGORIAS = [
  { key: "farmacos",    label: "Fármacos",     icon: Pill,           emoji: "💊", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  { key: "alimentacion", label: "Alimentación", icon: ShoppingBasket, emoji: "🍽️", color: "text-green-700",  bg: "bg-green-50 border-green-200" },
  { key: "aseo",        label: "Artículos de Aseo", icon: Sparkles,   emoji: "🧴", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
];

export default function Inventory() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activeCategory, setActiveCategory] = useState("farmacos");
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => base44.entities.InventoryItem.list("name", 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InventoryItem.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InventoryItem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setEditing(null); setFormOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InventoryItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });

  const handleSave = (form) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id) => {
    if (confirm("¿Eliminar este insumo?")) deleteMutation.mutate(id);
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  // Stats por categoría
  const statsPorCategoria = CATEGORIAS.map(cat => {
    const catItems = items.filter(i => i.category === cat.key);
    const criticos = catItems.filter(i => getStockLevel(i) === "critico");
    const moderados = catItems.filter(i => getStockLevel(i) === "moderado");
    return { ...cat, items: catItems, criticos, moderados };
  });

  // Alertas globales de fármacos
  const farmacosCriticos = items.filter(i => i.category === "farmacos" && getStockLevel(i) === "critico");
  const farmacosModerate = items.filter(i => i.category === "farmacos" && getStockLevel(i) === "moderado");

  const catActiva = CATEGORIAS.find(c => c.key === activeCategory);
  const itemsActivos = items.filter(i => i.category === activeCategory);
  const criticos = itemsActivos.filter(i => getStockLevel(i) === "critico");
  const moderados = itemsActivos.filter(i => getStockLevel(i) === "moderado");
  const ok = itemsActivos.filter(i => getStockLevel(i) === "ok");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Inventario"
        subtitle="Control de fármacos, alimentación y artículos de aseo"
        action={handleNew}
        actionLabel="Agregar insumo"
        actionIcon={Plus}
      />

      {/* Alertas de fármacos */}
      {farmacosCriticos.length > 0 && (
        <div className="mb-3 p-3 rounded-lg border border-red-300 bg-red-50 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">🔴 Fármacos en stock crítico ({farmacosCriticos.length})</p>
            <p className="text-xs text-red-700 mt-0.5">{farmacosCriticos.map(i => i.name).join(" · ")}</p>
          </div>
        </div>
      )}
      {farmacosModerate.length > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-amber-300 bg-amber-50 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">🟡 Fármacos con stock moderado ({farmacosModerate.length})</p>
            <p className="text-xs text-amber-700 mt-0.5">{farmacosModerate.map(i => i.name).join(" · ")}</p>
          </div>
        </div>
      )}

      {/* Tarjetas resumen de categorías */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statsPorCategoria.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`text-left rounded-xl border p-4 transition-all ${isActive ? cat.bg + " shadow-sm ring-2 ring-offset-1 ring-primary/30" : "bg-card border-border hover:bg-muted/40"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${isActive ? cat.color : "text-muted-foreground"}`} />
                <span className={`text-sm font-semibold ${isActive ? cat.color : "text-foreground"}`}>{cat.label}</span>
              </div>
              <p className="text-2xl font-bold">{cat.items.length}</p>
              <p className="text-xs text-muted-foreground">insumos registrados</p>
              <div className="flex gap-2 mt-2">
                {cat.criticos.length > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                    🔴 {cat.criticos.length} crítico{cat.criticos.length > 1 ? "s" : ""}
                  </span>
                )}
                {cat.moderados.length > 0 && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                    🟡 {cat.moderados.length} moderado{cat.moderados.length > 1 ? "s" : ""}
                  </span>
                )}
                {cat.criticos.length === 0 && cat.moderados.length === 0 && cat.items.length > 0 && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                    🟢 Todo en orden
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Sección activa */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>{catActiva?.emoji}</span> {catActiva?.label}
          </h2>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> {ok.length} OK</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {moderados.length} moderado{moderados.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {criticos.length} crítico{criticos.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <Button size="sm" onClick={handleNew} className="gap-1.5">
          <Plus className="w-4 h-4" /> Agregar
        </Button>
      </div>

      {itemsActivos.length === 0 ? (
        <EmptyState
          icon={Package}
          title={`No hay insumos en ${catActiva?.label}`}
          description="Agrega el primer insumo de esta categoría"
          actionLabel="Agregar insumo"
          onAction={handleNew}
        />
      ) : (
        <div className="space-y-4">
          {/* Críticos primero */}
          {criticos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Stock crítico
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {criticos.map(item => (
                  <InventoryItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
          {/* Moderados */}
          {moderados.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Stock moderado
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {moderados.map(item => (
                  <InventoryItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
          {/* OK */}
          {ok.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Stock suficiente
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ok.map(item => (
                  <InventoryItemCard key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <InventoryFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        onSave={handleSave}
        item={editing}
      />
    </div>
  );
}