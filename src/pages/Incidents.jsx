import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, AlertTriangle, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import IncidentFormDialog from "@/components/incidents/IncidentFormDialog";

const sevColors = {
  leve: "bg-green-50 text-green-700 border-green-200",
  moderado: "bg-amber-50 text-amber-700 border-amber-200",
  grave: "bg-orange-50 text-orange-700 border-orange-200",
  critico: "bg-red-50 text-red-700 border-red-200",
};

const statusColors = {
  abierto: "bg-red-50 text-red-700 border-red-200",
  en_seguimiento: "bg-amber-50 text-amber-700 border-amber-200",
  cerrado: "bg-green-50 text-green-700 border-green-200",
};

export default function Incidents() {
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  if (params.get("nuevo") === "1" && !showForm) {
    setShowForm(true);
    window.history.replaceState({}, "", "/incidentes");
  }

  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => base44.entities.Incident.list("-created_date", 100),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-active"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setShowForm(false);
    },
  });

  const filtered = statusFilter === "todos"
    ? incidents
    : incidents.filter((i) => i.status === statusFilter);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Incidentes"
        subtitle="Registro y seguimiento de eventos importantes"
        action={() => setShowForm(true)}
        actionLabel="Reportar incidente"
        actionIcon={Plus}
      />

      <div className="flex gap-3 mb-6 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="abierto">Abiertos</SelectItem>
            <SelectItem value="en_seguimiento">En seguimiento</SelectItem>
            <SelectItem value="cerrado">Cerrados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Sin incidentes registrados"
          description="Aquí se registrarán los eventos que requieran seguimiento"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inc) => (
            <Card key={inc.id} className="p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{inc.resident_name || "Sin especificar"}</span>
                    <Badge variant="outline" className="capitalize text-[10px]">{inc.type}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${sevColors[inc.severity] || ""}`}>{inc.severity}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[inc.status] || ""}`}>{inc.status?.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{inc.description}</p>
                  {inc.actions_taken && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Acciones:</span> {inc.actions_taken}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span>{inc.date} {inc.time && `· ${inc.time}`}</span>
                    {inc.notified_family && <span>📞 Familia notificada</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <IncidentFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
        residents={residents}
      />
    </div>
  );
}