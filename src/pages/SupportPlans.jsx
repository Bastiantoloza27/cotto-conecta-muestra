import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, ClipboardList, Target, Pencil, Trash2, LayoutGrid, List } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import KanbanBoard from "@/components/supportplans/KanbanBoard";

const statusColors = {
  activo: "bg-blue-50 text-blue-700 border-blue-200",
  en_pausa: "bg-amber-50 text-amber-700 border-amber-200",
  logrado: "bg-green-50 text-green-700 border-green-200",
  reformulado: "bg-purple-50 text-purple-700 border-purple-200",
  cerrado: "bg-muted text-muted-foreground",
};

const emptyForm = {
  resident_id: "", resident_name: "", title: "", area: "autonomia",
  description: "", start_date: "", target_date: "", status: "activo",
  progress: 0, supports: "", responsible: "", observations: "",
};

export default function SupportPlans() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState("kanban");
  const queryClient = useQueryClient();

  const { data: plans = [] } = useQuery({
    queryKey: ["support-plans"],
    queryFn: () => base44.entities.SupportPlan.list("-created_date", 100),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-active"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportPlan.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-plans"] });
      setShowForm(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportPlan.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-plans"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SupportPlan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support-plans"] }),
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleResident = (id) => {
    const r = residents.find((r) => r.id === id);
    set("resident_id", id);
    set("resident_name", r?.preferred_name || r?.full_name || "");
  };

  const handleStatusChange = (plan, newStatus) => {
    updateMutation.mutate({ id: plan.id, data: { ...plan, status: newStatus } });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8" style={{ maxWidth: view === "kanban" ? "100%" : "56rem", margin: "0 auto" }}>
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan de Apoyos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Objetivos personalizados y seguimiento de cada persona</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${view === "kanban" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Tablero
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${view === "list" ? "bg-white shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <List className="w-3.5 h-3.5" /> Lista
            </button>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Nuevo plan
          </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin planes de apoyo"
          description="Crea el primer plan personalizado para una persona residente"
          actionLabel="Crear plan"
          onAction={() => setShowForm(true)}
        />
      ) : view === "kanban" ? (
        <KanbanBoard
          plans={plans}
          onEdit={setEditing}
          onDelete={(id) => deleteMutation.mutate(id)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <div className="space-y-3">
          {plans.map((p) => (
            <Card key={p.id} className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{p.title}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[p.status] || ""}`}>{p.status}</Badge>
                    <Badge variant="secondary" className="text-[10px] capitalize">{p.area}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.resident_name}</p>
                  {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span>Avance</span>
                      <span>{p.progress || 0}%</span>
                    </div>
                    <Progress value={p.progress || 0} className="h-1.5" />
                  </div>
                  {p.responsible && <p className="text-[11px] text-muted-foreground mt-1.5">Responsable: {p.responsible}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("¿Eliminar este plan?")) deleteMutation.mutate(p.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      {editing && (
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>✏️ Editar plan de apoyo</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editing.id, data: editing }); }} className="space-y-4 mt-2">
              <div><Label>Objetivo *</Label><Input value={editing.title} onChange={(e) => setEditing(p => ({ ...p, title: e.target.value }))} required /></div>
              <div><Label>Área *</Label>
                <Select value={editing.area} onValueChange={(v) => setEditing(p => ({ ...p, area: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="autonomia">Autonomía</SelectItem>
                    <SelectItem value="salud">Salud</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="emocional">Emocional</SelectItem>
                    <SelectItem value="espiritual">Espiritual</SelectItem>
                    <SelectItem value="comunicacion">Comunicación</SelectItem>
                    <SelectItem value="movilidad">Movilidad</SelectItem>
                    <SelectItem value="cognitivo">Cognitivo</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Estado</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="en_pausa">En pausa</SelectItem>
                    <SelectItem value="logrado">Logrado</SelectItem>
                    <SelectItem value="reformulado">Reformulado</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Avance (%)</Label><Input type="number" min={0} max={100} value={editing.progress || 0} onChange={(e) => setEditing(p => ({ ...p, progress: Number(e.target.value) }))} /></div>
              <div><Label>Descripción</Label><Textarea value={editing.description || ""} onChange={(e) => setEditing(p => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <div><Label>Apoyos necesarios</Label><Textarea value={editing.supports || ""} onChange={(e) => setEditing(p => ({ ...p, supports: e.target.value }))} rows={2} /></div>
              <div><Label>Responsable</Label><Input value={editing.responsible || ""} onChange={(e) => setEditing(p => ({ ...p, responsible: e.target.value }))} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Guardando..." : "Actualizar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>🎯 Nuevo plan de apoyo</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 mt-2">
            <div>
              <Label>Persona residente *</Label>
              <Select value={form.resident_id} onValueChange={handleResident}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {residents.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objetivo *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} required placeholder="Ej: Mejorar autonomía en alimentación" />
            </div>
            <div>
              <Label>Área *</Label>
              <Select value={form.area} onValueChange={(v) => set("area", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="autonomia">Autonomía</SelectItem>
                  <SelectItem value="salud">Salud</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="emocional">Emocional</SelectItem>
                  <SelectItem value="espiritual">Espiritual</SelectItem>
                  <SelectItem value="comunicacion">Comunicación</SelectItem>
                  <SelectItem value="movilidad">Movilidad</SelectItem>
                  <SelectItem value="cognitivo">Cognitivo</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Apoyos necesarios</Label>
              <Textarea value={form.supports} onChange={(e) => set("supports", e.target.value)} rows={2} placeholder="Qué apoyos se necesitan para lograr el objetivo" />
            </div>
            <div>
              <Label>Responsable</Label>
              <Input value={form.responsible} onChange={(e) => set("responsible", e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Crear plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}