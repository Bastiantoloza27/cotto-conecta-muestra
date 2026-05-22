import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, ClipboardList, Target } from "lucide-react";
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

const statusColors = {
  activo: "bg-blue-50 text-blue-700 border-blue-200",
  en_pausa: "bg-amber-50 text-amber-700 border-amber-200",
  logrado: "bg-green-50 text-green-700 border-green-200",
  reformulado: "bg-purple-50 text-purple-700 border-purple-200",
  cerrado: "bg-muted text-muted-foreground",
};

export default function SupportPlans() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    resident_id: "", resident_name: "", title: "", area: "autonomia",
    description: "", start_date: "", target_date: "", status: "activo",
    progress: 0, supports: "", responsible: "", observations: "",
  });
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
    },
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleResident = (id) => {
    const r = residents.find((r) => r.id === id);
    set("resident_id", id);
    set("resident_name", r?.preferred_name || r?.full_name || "");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Plan de Apoyos"
        subtitle="Objetivos personalizados y seguimiento de cada persona"
        action={() => setShowForm(true)}
        actionLabel="Nuevo plan"
        actionIcon={Plus}
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin planes de apoyo"
          description="Crea el primer plan personalizado para una persona residente"
          actionLabel="Crear plan"
          onAction={() => setShowForm(true)}
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
              </div>
            </Card>
          ))}
        </div>
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