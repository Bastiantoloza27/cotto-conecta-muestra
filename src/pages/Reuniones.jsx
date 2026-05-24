import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Printer, Pencil, Trash2, Users, Calendar, Search, FileText, CheckCircle, Clock } from "lucide-react";
import ActaFormDialog from "@/components/reuniones/ActaFormDialog";
import ActaImprimible from "@/components/reuniones/ActaImprimible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

const TIPOS_LABEL = {
  equipo_completo: "Equipo Completo",
  salud: "Salud",
  cuidado: "Cuidado",
  administracion: "Administración",
  pastoral: "Pastoral",
  directiva: "Directiva",
  otra: "Otra",
};

const TIPO_COLORS = {
  equipo_completo: "bg-primary/10 text-primary",
  salud: "bg-blue-100 text-blue-700",
  cuidado: "bg-green-100 text-green-700",
  administracion: "bg-orange-100 text-orange-700",
  pastoral: "bg-purple-100 text-purple-700",
  directiva: "bg-red-100 text-red-700",
  otra: "bg-gray-100 text-gray-600",
};

function parseList(str) {
  try { return JSON.parse(str || "[]"); } catch { return []; }
}

export default function Reuniones() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingActa, setEditingActa] = useState(null);
  const [printActa, setPrintActa] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Cargar usuario
  useState(() => { base44.auth.me().then(setUser).catch(() => {}); });

  const queryClient = useQueryClient();

  const { data: actas = [], isLoading } = useQuery({
    queryKey: ["actas-reunion"],
    queryFn: () => base44.entities.ActaReunion.list("-fecha", 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ActaReunion.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["actas-reunion"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ActaReunion.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["actas-reunion"] }); setEditingActa(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ActaReunion.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["actas-reunion"] }); setDeleteTarget(null); },
  });

  const handleSubmitCreate = (data) => createMutation.mutate({ ...data, estado: "finalizada" });
  const handleSubmitEdit = (data) => updateMutation.mutate({ id: editingActa.id, data });

  const filtradas = actas.filter(a => {
    if (filtroTipo !== "todos" && a.tipo !== filtroTipo) return false;
    if (busqueda && !a.titulo?.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: actas.length,
    esteMes: actas.filter(a => {
      if (!a.fecha) return false;
      const d = new Date(a.fecha + "T12:00:00");
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reuniones de Equipo</h1>
          <p className="text-sm text-muted-foreground">Registro y actas de reuniones institucionales</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nueva Acta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary/60" />
            <div>
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Actas totales</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-700">{stats.esteMes}</div>
              <div className="text-xs text-muted-foreground">Este mes</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-muted">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-muted-foreground/50" />
            <div>
              <div className="text-2xl font-bold">{Object.keys(TIPOS_LABEL).length}</div>
              <div className="text-xs text-muted-foreground">Tipos de reunión</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Buscar acta..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="h-9 text-sm w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(TIPOS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de actas */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando actas...</div>
      ) : filtradas.length === 0 ? (
        <Card className="text-center py-14">
          <CardContent>
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No hay actas registradas</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Crea la primera acta de reunión</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nueva Acta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map(acta => {
            const participantes = parseList(acta.participantes);
            const ordenDia = parseList(acta.orden_del_dia);
            return (
              <Card key={acta.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-sm">{acta.titulo}</h3>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <span className="text-xs text-muted-foreground">
                              📅 {format(new Date(acta.fecha + "T12:00:00"), "dd 'de' MMMM yyyy", { locale: es })}
                            </span>
                            {acta.hora_inicio && <span className="text-xs text-muted-foreground">🕐 {acta.hora_inicio}{acta.hora_termino ? ` – ${acta.hora_termino}` : ""}</span>}
                            {acta.lugar && <span className="text-xs text-muted-foreground">📍 {acta.lugar}</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIPO_COLORS[acta.tipo] || TIPO_COLORS.otra}`}>
                              {TIPOS_LABEL[acta.tipo]}
                            </span>
                            {participantes.length > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" /> {participantes.length} participante{participantes.length !== 1 ? "s" : ""}
                              </span>
                            )}
                            {ordenDia.length > 0 && (
                              <span className="text-xs text-muted-foreground">{ordenDia.length} punto{ordenDia.length !== 1 ? "s" : ""} en agenda</span>
                            )}
                          </div>
                          {acta.convocante && (
                            <p className="text-xs text-muted-foreground mt-1">Convocante: {acta.convocante}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrintActa(acta)} title="Imprimir acta">
                            <Printer className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingActa(acta)} title="Editar">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(acta)} title="Eliminar">
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {acta.acuerdos && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-muted/40 rounded px-2 py-1">
                          📋 {acta.acuerdos}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <ActaFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmitCreate}
        user={user}
      />
      <ActaFormDialog
        open={!!editingActa}
        onClose={() => setEditingActa(null)}
        onSubmit={handleSubmitEdit}
        acta={editingActa}
        user={user}
      />

      {printActa && <ActaImprimible acta={printActa} onClose={() => setPrintActa(null)} />}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar acta?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el acta "{deleteTarget?.titulo}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => deleteMutation.mutate(deleteTarget.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}