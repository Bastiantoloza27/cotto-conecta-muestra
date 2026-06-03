import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Download, Pencil, Trash2, Search, Filter, FileText } from "lucide-react";
import { toast } from "sonner";
import { createRoot } from "react-dom/client";
import FormularioIntervencion, { PROFESIONES } from "./FormularioIntervencion";
import InformeIntervencionImprimible from "./InformeIntervencionImprimible";
import GenerarInformeIntegralDialog from "./GenerarInformeIntegralDialog";

export default function TabIntervenciones({ residents }) {
  const qc = useQueryClient();
  const [filtroProfesion, setFiltroProfesion] = useState("todas");
  const [filtroResidente, setFiltroResidente] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [residenteNuevo, setResidenteNuevo] = useState(null);
  const [informeOpen, setInformeOpen] = useState(false);

  const { data: intervenciones = [], isLoading } = useQuery({
    queryKey: ["intervenciones"],
    queryFn: () => base44.entities.IntervencionProfesional.list("-fecha", 500),
    staleTime: 30000,
  });

  const saveIntervencion = useMutation({
    mutationFn: async ({ data, id }) => {
      if (id) return base44.entities.IntervencionProfesional.update(id, data);
      return base44.entities.IntervencionProfesional.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intervenciones"] });
      toast.success("Intervención guardada");
    },
  });

  const deleteIntervencion = useMutation({
    mutationFn: (id) => base44.entities.IntervencionProfesional.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intervenciones"] });
      toast.success("Intervención eliminada");
    },
  });

  const handleNueva = (resident) => {
    setResidenteNuevo(resident);
    setEditando(null);
    setDialogOpen(true);
  };

  const handleEditar = (inv) => {
    const resident = residents.find(r => r.id === inv.resident_id);
    setEditando(inv);
    setResidenteNuevo(resident || { id: inv.resident_id, full_name: inv.resident_name });
    setDialogOpen(true);
  };

  const handleDescargar = (inv) => {
    const resident = residents.find(r => r.id === inv.resident_id);
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Permite ventanas emergentes para descargar"); return; }
    const div = printWindow.document.createElement("div");
    printWindow.document.body.appendChild(div);
    printWindow.document.title = `Intervención ${inv.profesion} - ${inv.resident_name}`;
    createRoot(div).render(<InformeIntervencionImprimible intervencion={inv} resident={resident} />);
    setTimeout(() => printWindow.print(), 600);
  };

  // Filtrado
  const intervencionesFiltered = intervenciones.filter(inv => {
    if (filtroProfesion !== "todas" && inv.profesion !== filtroProfesion) return false;
    if (filtroResidente !== "todos" && inv.resident_id !== filtroResidente) return false;
    if (busqueda) {
      const q = busqueda.toLowerCase();
      if (!inv.resident_name?.toLowerCase().includes(q) &&
          !inv.profesional_nombre?.toLowerCase().includes(q) &&
          !inv.tipo_intervencion?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Agrupar por residente para mostrar
  const porResidente = {};
  intervencionesFiltered.forEach(inv => {
    if (!porResidente[inv.resident_id]) {
      porResidente[inv.resident_id] = { name: inv.resident_name, items: [] };
    }
    porResidente[inv.resident_id].items.push(inv);
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 h-8 w-44 text-sm"
            />
          </div>
          <Select value={filtroProfesion} onValueChange={setFiltroProfesion}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue placeholder="Profesión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las profesiones</SelectItem>
              {PROFESIONES.map(p => <SelectItem key={p.key} value={p.key}>{p.icon} {p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroResidente} onValueChange={setFiltroResidente}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder="Residente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los residentes</SelectItem>
              {residents.map(r => <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setInformeOpen(true)}
            className="gap-1.5"
          >
            <FileText className="w-4 h-4" /> Informe integral
          </Button>
          <Button
            size="sm"
            onClick={() => { setResidenteNuevo(null); setEditando(null); setDialogOpen(true); }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" /> Nueva intervención
          </Button>
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : intervencionesFiltered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm text-muted-foreground">No hay intervenciones registradas</p>
          <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => { setResidenteNuevo(null); setEditando(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4" /> Registrar primera intervención
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(porResidente).map(([resId, grupo]) => {
            const resident = residents.find(r => r.id === resId);
            return (
              <div key={resId}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {grupo.name?.[0]}
                  </div>
                  <p className="text-sm font-semibold">{grupo.name}</p>
                  {resident?.room && <span className="text-xs text-muted-foreground">Hab. {resident.room}</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{grupo.items.length} intervención(es)</span>
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleNueva(resident || { id: resId, full_name: grupo.name })}>
                    <Plus className="w-3 h-3" /> Nueva
                  </Button>
                </div>
                <div className="space-y-2 pl-9">
                  {grupo.items.map(inv => {
                    const prof = PROFESIONES.find(p => p.key === inv.profesion);
                    return (
                      <Card key={inv.id} className="p-4 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {prof && (
                                <Badge className={`text-[10px] border ${prof.color}`}>
                                  {prof.icon} {prof.label}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[10px]">{inv.tipo_intervencion}</Badge>
                              <span className="text-[11px] text-muted-foreground ml-auto">
                                {inv.fecha ? format(parseISO(inv.fecha), "dd MMM yyyy", { locale: es }) : ""}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Por: <span className="font-medium text-foreground">{inv.profesional_nombre}</span>
                            </p>
                            {inv.evaluacion && (
                              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{inv.evaluacion}</p>
                            )}
                            {inv.proxima_sesion && (
                              <p className="text-[10px] text-primary mt-1">
                                📅 Próxima sesión: {format(parseISO(inv.proxima_sesion), "dd/MM/yyyy")}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDescargar(inv)} title="Descargar informe">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditar(inv)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => { if (confirm("¿Eliminar esta intervención?")) deleteIntervencion.mutate(inv.id); }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Informe integral */}
      {informeOpen && (
        <GenerarInformeIntegralDialog
          open={informeOpen}
          onClose={() => setInformeOpen(false)}
          residents={residents}
        />
      )}

      {/* Dialog */}
      {dialogOpen && (
        <FormularioIntervencion
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditando(null); setResidenteNuevo(null); }}
          resident={residenteNuevo}
          intervencion={editando}
          onSave={(data, id) => saveIntervencion.mutateAsync({ data, id })}
          residents={residents}
        />
      )}
    </div>
  );
}