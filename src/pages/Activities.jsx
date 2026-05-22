import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, Calendar, MapPin, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const typeEmojis = {
  taller: "🎨", voluntariado: "🤝", celebracion: "🎉", salida: "🚌",
  pastoral: "🕊️", visita: "👋", recreacion: "🎮", terapia: "💆", otro: "📋",
};

const statusColors = {
  programada: "bg-blue-50 text-blue-700 border-blue-200",
  en_curso: "bg-amber-50 text-amber-700 border-amber-200",
  completada: "bg-green-50 text-green-700 border-green-200",
  cancelada: "bg-red-50 text-red-700 border-red-200",
};

export default function Activities() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "taller", date: format(new Date(), "yyyy-MM-dd"),
    time_start: "", time_end: "", location: "", responsible: "", status: "programada", notes: "",
  });
  const queryClient = useQueryClient();

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: () => base44.entities.Activity.list("-date", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setShowForm(false);
    },
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Actividades y Comunidad"
        subtitle="Talleres, celebraciones, voluntariados y más"
        action={() => setShowForm(true)}
        actionLabel="Nueva actividad"
        actionIcon={Plus}
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin actividades"
          description="Programa la primera actividad de la comunidad"
          actionLabel="Crear actividad"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {activities.map((act) => (
            <Card key={act.id} className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeEmojis[act.type] || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{act.title}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[act.status] || ""}`}>
                      {act.status}
                    </Badge>
                  </div>
                  {act.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{act.description}</p>}
                  <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {act.date}</span>
                    {act.time_start && <span>🕐 {act.time_start}{act.time_end && ` - ${act.time_end}`}</span>}
                    {act.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {act.location}</span>}
                    {act.responsible && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {act.responsible}</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>🎯 Nueva actividad</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 mt-2">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taller">🎨 Taller</SelectItem>
                    <SelectItem value="voluntariado">🤝 Voluntariado</SelectItem>
                    <SelectItem value="celebracion">🎉 Celebración</SelectItem>
                    <SelectItem value="salida">🚌 Salida</SelectItem>
                    <SelectItem value="pastoral">🕊️ Pastoral</SelectItem>
                    <SelectItem value="visita">👋 Visita</SelectItem>
                    <SelectItem value="recreacion">🎮 Recreación</SelectItem>
                    <SelectItem value="terapia">💆 Terapia</SelectItem>
                    <SelectItem value="otro">📋 Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora inicio</Label>
                <Input type="time" value={form.time_start} onChange={(e) => set("time_start", e.target.value)} />
              </div>
              <div>
                <Label>Hora fin</Label>
                <Input type="time" value={form.time_end} onChange={(e) => set("time_end", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lugar</Label>
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
              </div>
              <div>
                <Label>Responsable</Label>
                <Input value={form.responsible} onChange={(e) => set("responsible", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}