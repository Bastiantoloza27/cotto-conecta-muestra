import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, BookOpen, Filter, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import MoodBadge from "@/components/shared/MoodBadge";
import DailyLogFormDialog from "@/components/dailylogs/DailyLogFormDialog";

const categoryEmojis = {
  alimentacion: "🍽️", emocional: "💛", sueno: "🌙", comportamiento: "🧠",
  actividad: "🎯", salud: "🏥", higiene: "🚿", social: "👥",
  espiritual: "🕊️", otro: "📝",
};

export default function DailyLogs() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  if (params.get("nuevo") === "1" && !showForm) {
    setShowForm(true);
    window.history.replaceState({}, "", "/bitacora");
  }

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["daily-logs"],
    queryFn: () => base44.entities.DailyLog.list("-created_date", 100),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-active"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyLog.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-logs"] }),
  });

  const filtered = categoryFilter === "todas"
    ? logs
    : logs.filter((l) => l.category === categoryFilter);

  // Group by date
  const grouped = {};
  filtered.forEach((log) => {
    const date = log.date || log.created_date?.split("T")[0] || "Sin fecha";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Bitácora Diaria"
        subtitle="Registro continuo de la vida en comunidad"
        action={() => setShowForm(true)}
        actionLabel="Nuevo registro"
        actionIcon={Plus}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            <SelectItem value="alimentacion">🍽️ Alimentación</SelectItem>
            <SelectItem value="emocional">💛 Emocional</SelectItem>
            <SelectItem value="sueno">🌙 Sueño</SelectItem>
            <SelectItem value="comportamiento">🧠 Comportamiento</SelectItem>
            <SelectItem value="actividad">🎯 Actividad</SelectItem>
            <SelectItem value="salud">🏥 Salud</SelectItem>
            <SelectItem value="higiene">🚿 Higiene</SelectItem>
            <SelectItem value="social">👥 Social</SelectItem>
            <SelectItem value="espiritual">🕊️ Espiritual</SelectItem>
            <SelectItem value="otro">📝 Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin registros"
          description="Comienza a registrar el día a día de la comunidad"
          actionLabel="Crear registro"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {date !== "Sin fecha" ? format(new Date(date + "T12:00:00"), "EEEE d/MM/yyyy") : date}
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
                {entries.map((log) => (
                  <Card key={log.id} className="p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{categoryEmojis[log.category] || "📝"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{log.resident_name || "General"}</span>
                          <Badge variant="secondary" className="text-[10px] capitalize">{log.category}</Badge>
                          {log.mood && <MoodBadge mood={log.mood} />}
                          {log.is_important && <Badge className="bg-amber-100 text-amber-800 text-[10px] border-amber-200">⚡ Importante</Badge>}
                        </div>
                        {log.title && <p className="text-sm font-medium mt-1">{log.title}</p>}
                        <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                          {log.time && <span>🕐 {log.time}</span>}
                          {log.shift && <span>· Turno {log.shift}</span>}
                          {log.created_by && <span>· {log.created_by}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(log)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { if (confirm("¿Eliminar este registro?")) deleteMutation.mutate(log.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DailyLogFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        residents={residents}
      />

      {editing && (
        <DailyLogFormDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editing.id, data })}
          isLoading={updateMutation.isPending}
          residents={residents}
          initial={editing}
        />
      )}
    </div>
  );
}