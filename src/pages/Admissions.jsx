import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, ClipboardPlus, Search, Clock, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import AdmissionFormDialog from "@/components/admissions/AdmissionFormDialog";
import AdmissionDetailDialog from "@/components/admissions/AdmissionDetailDialog";

const statusConfig = {
  en_espera:    { label: "En espera",    color: "bg-amber-50 text-amber-700 border-amber-200" },
  en_evaluacion:{ label: "En evaluación",color: "bg-blue-50 text-blue-700 border-blue-200" },
  aprobado:     { label: "Aprobado",     color: "bg-green-50 text-green-700 border-green-200" },
  ingresado:    { label: "Ingresado",    color: "bg-primary/10 text-primary border-primary/20" },
  descartado:   { label: "Descartado",   color: "bg-muted text-muted-foreground" },
};

const priorityDot = {
  alta:  "bg-red-500",
  media: "bg-amber-400",
  baja:  "bg-green-500",
};

export default function Admissions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("activos");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: admissions = [] } = useQuery({
    queryKey: ["admissions"],
    queryFn: () => base44.entities.Admission.list("-request_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Admission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Admission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      setSelected(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Admission.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admissions"] }),
  });

  const filtered = admissions.filter((a) => {
    const matchSearch = a.full_name?.toLowerCase().includes(search.toLowerCase());
    const activeStatuses = ["en_espera", "en_evaluacion", "aprobado"];
    const matchStatus =
      statusFilter === "activos" ? activeStatuses.includes(a.status) :
      statusFilter === "todos" ? true :
      a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const waiting = admissions.filter(a => a.status === "en_espera").length;
  const evaluating = admissions.filter(a => a.status === "en_evaluacion").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Admisiones"
        subtitle="Lista de espera y gestión de ingresos"
        action={() => setShowForm(true)}
        actionLabel="Nueva solicitud"
        actionIcon={Plus}
      />

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {waiting} en espera
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-medium">
          {evaluating} en evaluación
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="en_espera">En espera</SelectItem>
            <SelectItem value="en_evaluacion">En evaluación</SelectItem>
            <SelectItem value="aprobado">Aprobados</SelectItem>
            <SelectItem value="ingresado">Ingresados</SelectItem>
            <SelectItem value="descartado">Descartados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardPlus}
          title="Sin solicitudes"
          description="Registra la primera solicitud de admisión"
          actionLabel="Nueva solicitud"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Card
              key={a.id}
              className="p-4 hover:shadow-sm transition-shadow cursor-pointer"
              onClick={() => setSelected(a)}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-2 h-2 rounded-full ${priorityDot[a.priority] || "bg-muted-foreground"}`} title={`Prioridad ${a.priority}`} />
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {a.full_name?.[0] || "?"}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{a.full_name}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusConfig[a.status]?.color || ""}`}>
                      {statusConfig[a.status]?.label}
                    </Badge>
                    {a.demand_type && (
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {a.demand_type.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Solicitud: {a.request_date}
                    {a.family_contact_name && ` · Contacto: ${a.family_contact_name}`}
                    {a.origin && ` · ${a.origin}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" className="text-xs">Ver</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); if (confirm("¿Eliminar solicitud?")) deleteMutation.mutate(a.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AdmissionFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {selected && (
        <AdmissionDetailDialog
          admission={selected}
          onClose={() => setSelected(null)}
          onUpdate={(data) => updateMutation.mutate({ id: selected.id, data })}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}