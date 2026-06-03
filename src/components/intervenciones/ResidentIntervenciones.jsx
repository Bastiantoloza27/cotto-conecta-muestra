import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, Pencil, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import { createRoot } from "react-dom/client";
import FormularioIntervencion, { PROFESIONES } from "./FormularioIntervencion";
import InformeIntervencionImprimible from "./InformeIntervencionImprimible";

export default function ResidentIntervenciones({ resident }) {
  const qc = useQueryClient();
  const [filtroProfesion, setFiltroProfesion] = useState("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState(null);

  const { data: intervenciones = [], isLoading } = useQuery({
    queryKey: ["intervenciones-residente", resident.id],
    queryFn: () => base44.entities.IntervencionProfesional.filter({ resident_id: resident.id }, "-fecha", 200),
    enabled: !!resident.id,
  });

  const saveIntervencion = useMutation({
    mutationFn: async ({ data, id }) => {
      if (id) return base44.entities.IntervencionProfesional.update(id, data);
      return base44.entities.IntervencionProfesional.create(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intervenciones-residente", resident.id] });
      qc.invalidateQueries({ queryKey: ["intervenciones"] });
      toast.success("Intervención guardada");
    },
  });

  const deleteIntervencion = useMutation({
    mutationFn: (id) => base44.entities.IntervencionProfesional.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intervenciones-residente", resident.id] });
      qc.invalidateQueries({ queryKey: ["intervenciones"] });
      toast.success("Intervención eliminada");
    },
  });

  const handleDescargar = (inv) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Permite ventanas emergentes para descargar"); return; }
    const div = printWindow.document.createElement("div");
    printWindow.document.body.appendChild(div);
    printWindow.document.title = `Intervención ${inv.profesion} - ${resident.full_name}`;
    createRoot(div).render(<InformeIntervencionImprimible intervencion={inv} resident={resident} />);
    setTimeout(() => printWindow.print(), 600);
  };

  const filtered = filtroProfesion === "todas"
    ? intervenciones
    : intervenciones.filter(inv => inv.profesion === filtroProfesion);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Select value={filtroProfesion} onValueChange={setFiltroProfesion}>
          <SelectTrigger className="h-8 w-52 text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las profesiones</SelectItem>
            {PROFESIONES.map(p => <SelectItem key={p.key} value={p.key}>{p.icon} {p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditando(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> Nueva intervención
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      {intervenciones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {PROFESIONES.map(p => {
            const count = intervenciones.filter(inv => inv.profesion === p.key).length;
            if (!count) return null;
            return (
              <button
                key={p.key}
                onClick={() => setFiltroProfesion(filtroProfesion === p.key ? "todas" : p.key)}
                className={`px-2.5 py-1 rounded-full text-xs border font-medium transition-all ${
                  filtroProfesion === p.key ? p.color + " ring-2 ring-offset-1 ring-primary/30" : p.color
                }`}
              >
                {p.icon} {p.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm text-muted-foreground">Sin intervenciones registradas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(inv => {
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
                    {inv.acciones && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">{inv.acciones}</p>
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
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditando(inv); setDialogOpen(true); }}>
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
      )}

      {dialogOpen && (
        <FormularioIntervencion
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditando(null); }}
          resident={resident}
          intervencion={editando}
          onSave={(data, id) => saveIntervencion.mutateAsync({ data, id })}
        />
      )}
    </div>
  );
}