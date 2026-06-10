import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Receipt, Clock, CheckCircle, XCircle, Printer, Search, FileDown } from "lucide-react";
import InformeGastosResumen from "@/components/informes/InformeGastosResumen";
import { printReport } from "@/lib/printReport";
import NuevaSolicitudDialog from "@/components/gastos/NuevaSolicitudDialog";
import ResolucionDialog from "@/components/gastos/ResolucionDialog";
import DocumentoImprimible from "@/components/gastos/DocumentoImprimible";

const CATEGORIAS = {
  insumos: "Insumos", traslado: "Traslado", alimentacion: "Alimentación",
  mantenimiento: "Mantenimiento", capacitacion: "Capacitación", otros: "Otros",
};

const ESTADO_STYLES = {
  pendiente: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  aprobada: "bg-green-100 text-green-800 border border-green-300",
  rechazada: "bg-red-100 text-red-800 border border-red-300",
};

function formatMonto(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

// ─── VISTA PERSONAL ────────────────────────────────────────────────────────────
function VistaPersonal({ user }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ["mis-solicitudes", user?.email],
    queryFn: () => base44.entities.SolicitudGasto.filter({ solicitante_email: user?.email }),
    enabled: !!user?.email,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SolicitudGasto.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["mis-solicitudes"] }); setShowForm(false); },
  });

  const sorted = [...solicitudes].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Control de Gastos</h1>
          <p className="text-sm text-muted-foreground">Mis solicitudes de gasto</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nueva Solicitud
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando...</div>
      ) : sorted.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Receipt className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No tienes solicitudes registradas</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>Crear primera solicitud</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map(s => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{s.motivo}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLES[s.estado]}`}>
                        {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex gap-3 flex-wrap">
                      <span>📅 {format(new Date(s.fecha_solicitud + "T12:00:00"), "dd/MM/yyyy")}</span>
                      <span>🏷️ {CATEGORIAS[s.categoria]}</span>
                      <span className="font-semibold text-foreground">💵 {formatMonto(s.monto)}</span>
                    </div>
                    {s.estado === "rechazada" && s.motivo_rechazo && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1">
                        Motivo rechazo: {s.motivo_rechazo}
                      </p>
                    )}
                  </div>
                  {s.estado === "pendiente" && <Clock className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
                  {s.estado === "aprobada" && <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                  {s.estado === "rechazada" && <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <NuevaSolicitudDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={createMutation.mutate}
        user={user}
      />
    </div>
  );
}

// ─── VISTA DIRECTOR ────────────────────────────────────────────────────────────
function VistaDirector({ user, readOnly = false }) {
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [showResolucion, setShowResolucion] = useState(false);
  const [docSolicitud, setDocSolicitud] = useState(null);
  const [filtros, setFiltros] = useState({ estado: "todos", categoria: "todas", solicitante: "", busqueda: "" });
  const queryClient = useQueryClient();

  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ["todas-solicitudes"],
    queryFn: () => base44.entities.SolicitudGasto.list("-created_date", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SolicitudGasto.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["todas-solicitudes"] }); setShowResolucion(false); },
  });

  const handleAprobar = (s) => {
    updateMutation.mutate({
      id: s.id,
      data: { estado: "aprobada", fecha_resolucion: new Date().toISOString(), director_nombre: user?.full_name || user?.email || "Director" },
    });
  };

  const handleRechazar = (s, motivo) => {
    updateMutation.mutate({
      id: s.id,
      data: { estado: "rechazada", motivo_rechazo: motivo, fecha_resolucion: new Date().toISOString(), director_nombre: user?.full_name || user?.email || "Director" },
    });
  };

  // Indicadores del mes
  const now = new Date();
  const inicioMes = startOfMonth(now);
  const finMes = endOfMonth(now);
  const delMes = solicitudes.filter(s => {
    const d = new Date(s.fecha_solicitud + "T12:00:00");
    return d >= inicioMes && d <= finMes;
  });
  const aprobadas = delMes.filter(s => s.estado === "aprobada");
  const pendientes = solicitudes.filter(s => s.estado === "pendiente");
  const rechazadas = delMes.filter(s => s.estado === "rechazada");
  const totalAprobado = aprobadas.reduce((acc, s) => acc + (s.monto || 0), 0);

  // Filtrado
  const filtradas = solicitudes.filter(s => {
    if (filtros.estado !== "todos" && s.estado !== filtros.estado) return false;
    if (filtros.categoria !== "todas" && s.categoria !== filtros.categoria) return false;
    if (filtros.solicitante && !s.solicitante_nombre?.toLowerCase().includes(filtros.solicitante.toLowerCase())) return false;
    if (filtros.busqueda && !s.motivo?.toLowerCase().includes(filtros.busqueda.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Control de Gastos</h1>
          <p className="text-sm text-muted-foreground">Gestión de solicitudes del personal</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => {
          const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
          const fin = new Date().toISOString().split("T")[0];
          printReport(
            <InformeGastosResumen solicitudes={filtradas} desde={inicio} hasta={fin} user={user} />,
            "Resumen Gastos"
          );
        }}>
          <FileDown className="w-4 h-4" /> Resumen del mes
        </Button>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{delMes.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Solicitudes del mes</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700">{formatMonto(totalAprobado)}</div>
            <div className="text-xs text-muted-foreground mt-1">Monto aprobado este mes</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-700">{pendientes.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Pendientes de resolución</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-700">{rechazadas.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Rechazadas este mes</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-7 h-8 text-sm"
                placeholder="Buscar motivo..."
                value={filtros.busqueda}
                onChange={e => setFiltros(f => ({ ...f, busqueda: e.target.value }))}
              />
            </div>
            <Input
              className="h-8 text-sm w-36"
              placeholder="Solicitante..."
              value={filtros.solicitante}
              onChange={e => setFiltros(f => ({ ...f, solicitante: e.target.value }))}
            />
            <Select value={filtros.estado} onValueChange={v => setFiltros(f => ({ ...f, estado: v }))}>
              <SelectTrigger className="h-8 text-sm w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobada">Aprobada</SelectItem>
                <SelectItem value="rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtros.categoria} onValueChange={v => setFiltros(f => ({ ...f, categoria: v }))}>
              <SelectTrigger className="h-8 text-sm w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {Object.entries(CATEGORIAS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Cargando solicitudes...</div>
      ) : filtradas.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Receipt className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No hay solicitudes con los filtros seleccionados</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Solicitante</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Motivo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoría</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Monto</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(s => (
                  <tr key={s.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{s.solicitante_nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(s.fecha_solicitud + "T12:00:00"), "dd/MM/yyyy")}</td>
                    <td className="px-4 py-3 max-w-[200px] truncate">{s.motivo}</td>
                    <td className="px-4 py-3">{CATEGORIAS[s.categoria]}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMonto(s.monto)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_STYLES[s.estado]}`}>
                        {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setSelectedSolicitud(s); setShowResolucion(true); }}
                        >
                          Ver
                        </Button>
                        {!readOnly && s.estado !== "pendiente" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => setDocSolicitud(s)}
                          >
                            <Printer className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ResolucionDialog
        open={showResolucion}
        onClose={() => { setShowResolucion(false); setSelectedSolicitud(null); }}
        solicitud={selectedSolicitud}
        onAprobar={handleAprobar}
        onRechazar={handleRechazar}
        onImprimir={(s) => { setDocSolicitud(s); setShowResolucion(false); }}
        readOnly={readOnly}
      />

      {docSolicitud && (
        <DocumentoImprimible
          solicitud={docSolicitud}
          onClose={() => setDocSolicitud(null)}
        />
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ──────────────────────────────────────────────────────────
export default function ControlGastos() {
  const { isAdmin, loading } = useRole();
  const [user, setUser] = useState(null);
  const [vistaActiva, setVistaActiva] = useState("director");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <VistaPersonal user={user} />;

  return (
    <div>
      {/* Pestañas admin */}
      <div className="border-b bg-card px-4 pt-4 flex gap-1">
        <button
          onClick={() => setVistaActiva("director")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            vistaActiva === "director"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Vista Director
        </button>
        <button
          onClick={() => setVistaActiva("personal")}
          className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            vistaActiva === "personal"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Mi Vista (Admin)
        </button>
      </div>
      {vistaActiva === "director"
        ? <VistaDirector user={user} readOnly />
        : <VistaDirector user={user} />
      }
    </div>
  );
}