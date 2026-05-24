import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Stethoscope, Plus, Search, Filter, Eye, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InformeMedicoFormDialog from "@/components/informes/InformeMedicoFormDialog";
import InformeMedicoDetailDialog from "@/components/informes/InformeMedicoDetailDialog";
import { useRole } from "@/hooks/useRole";

const TIPO_LABELS = {
  control_rutina: { label: "Control rutina", color: "bg-blue-100 text-blue-800" },
  urgencia: { label: "Urgencia", color: "bg-red-100 text-red-800" },
  seguimiento: { label: "Seguimiento", color: "bg-purple-100 text-purple-800" },
  evaluacion_inicial: { label: "Evaluación inicial", color: "bg-green-100 text-green-800" },
  alta_medica: { label: "Alta médica", color: "bg-teal-100 text-teal-800" },
  otro: { label: "Otro", color: "bg-gray-100 text-gray-800" },
};

export default function InformesMedico() {
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [editingInforme, setEditingInforme] = useState(null);
  const [viewingInforme, setViewingInforme] = useState(null);

  const { data: informes = [], isLoading } = useQuery({
    queryKey: ["informes-medico"],
    queryFn: () => base44.entities.InformeMedico.list("-fecha_visita", 100),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-active"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InformeMedico.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["informes-medico"] }),
  });

  const filtered = informes.filter((inf) => {
    const matchSearch =
      !search ||
      inf.medico_nombre?.toLowerCase().includes(search.toLowerCase()) ||
      inf.residente_nombres?.toLowerCase().includes(search.toLowerCase()) ||
      inf.descripcion_intervencion?.toLowerCase().includes(search.toLowerCase());
    const matchTipo = filterTipo === "todos" || inf.tipo_intervencion === filterTipo;
    return matchSearch && matchTipo;
  });

  const handleEdit = (informe) => {
    setEditingInforme(informe);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingInforme(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-primary" />
            Informes del Médico
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de visitas e intervenciones médicas
          </p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo informe
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por médico, residente o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-full sm:w-52">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Tipo de intervención" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{informes.length}</p>
          <p className="text-xs text-muted-foreground">Total informes</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            {informes.filter(i => i.tipo_intervencion === "urgencia").length}
          </p>
          <p className="text-xs text-muted-foreground">Urgencias</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">
            {informes.length > 0
              ? format(new Date(informes[0].fecha_visita + "T12:00:00"), "dd MMM", { locale: es })
              : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Último informe</p>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando informes...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay informes registrados</p>
          {!isAdmin && (
            <Button className="mt-4 gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Crear primer informe
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inf) => {
            const tipo = TIPO_LABELS[inf.tipo_intervencion] || TIPO_LABELS.otro;
            return (
              <Card key={inf.id} className="p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">
                        {format(new Date(inf.fecha_visita + "T12:00:00"), "dd 'de' MMMM yyyy", { locale: es })}
                      </span>
                      <Badge className={`${tipo.color} border-0 text-xs`}>{tipo.label}</Badge>
                      {inf.cambios_medicacion && (
                        <Badge variant="outline" className="text-xs">💊 Cambios medicación</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      👨‍⚕️ {inf.medico_nombre}
                      {inf.residente_nombres && (
                        <span className="text-muted-foreground/70"> · 👤 {inf.residente_nombres}</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {inf.descripcion_intervencion}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewingInforme(inf)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {!isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(inf)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(inf.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      {showForm && (
        <InformeMedicoFormDialog
          informe={editingInforme}
          residents={residents}
          onClose={handleCloseForm}
        />
      )}

      {/* Detail dialog */}
      {viewingInforme && (
        <InformeMedicoDetailDialog
          informe={viewingInforme}
          onClose={() => setViewingInforme(null)}
        />
      )}
    </div>
  );
}