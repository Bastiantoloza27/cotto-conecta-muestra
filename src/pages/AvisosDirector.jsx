import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Send, Archive, Eye, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const prioridadBadge = {
  informativo: "bg-green-50 text-green-700 border-green-200",
  importante: "bg-amber-50 text-amber-700 border-amber-200",
  urgente: "bg-red-50 text-red-700 border-red-200",
};

const estadoBadge = {
  borrador: "bg-gray-100 text-gray-600 border-gray-200",
  enviado: "bg-blue-50 text-blue-700 border-blue-200",
  archivado: "bg-gray-50 text-gray-500 border-gray-200",
};

const EMPTY_FORM = {
  titulo: "",
  mensaje: "",
  prioridad: "informativo",
  areas_destino: "todos",
  requiere_confirmacion: false,
  residente_relacionado_nombre: "",
};

export default function AvisosDirector() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: avisos = [], isLoading } = useQuery({
    queryKey: ["avisos-director"],
    queryFn: () => base44.entities.AvisoDirector.list("-created_date", 100),
  });

  const { data: confirmaciones = [] } = useQuery({
    queryKey: ["todas-confirmaciones"],
    queryFn: () => base44.entities.ConfirmacionLectura.list(),
  });

  const { data: slackConfigs = [] } = useQuery({
    queryKey: ["slack-configs"],
    queryFn: () => base44.entities.ConfiguracionSlack.filter({ activo: true }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AvisoDirector.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avisos-director"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AvisoDirector.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avisos-director"] });
    },
  });

  const sendSlack = async (aviso, webhooks) => {
    const emoji = aviso.prioridad === "urgente" ? "🚨" : aviso.prioridad === "importante" ? "⚠️" : "📢";
    const text = `${emoji} *${aviso.titulo}*\n${aviso.mensaje}\n_Áreas: ${aviso.areas_destino}_`;
    await Promise.allSettled(
      webhooks.map(w =>
        fetch(w.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        })
      )
    );
  };

  const handleGuardarBorrador = async () => {
    await createMutation.mutateAsync({
      ...form,
      autor: user?.full_name || user?.email || "Director",
      estado: "borrador",
    });
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleEnviar = async () => {
    setSending(true);
    let slackOk = true;
    try {
      if (slackConfigs.length > 0) {
        await sendSlack(form, slackConfigs);
      }
    } catch {
      slackOk = false;
    }
    await createMutation.mutateAsync({
      ...form,
      autor: user?.full_name || user?.email || "Director",
      estado: "enviado",
      slack_enviado: slackOk && slackConfigs.length > 0,
      slack_error: !slackOk,
    });
    setSending(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleArchivar = async (aviso) => {
    await updateMutation.mutateAsync({ id: aviso.id, data: { estado: "archivado" } });
  };

  const handlePublicar = async (aviso) => {
    setSending(true);
    let slackOk = true;
    try {
      if (slackConfigs.length > 0) await sendSlack(aviso, slackConfigs);
    } catch { slackOk = false; }
    await updateMutation.mutateAsync({
      id: aviso.id,
      data: { estado: "enviado", slack_enviado: slackOk && slackConfigs.length > 0, slack_error: !slackOk },
    });
    setSending(false);
  };

  const avisosFiltrados = filtroEstado === "todos"
    ? avisos
    : avisos.filter(a => a.estado === filtroEstado);

  const countConfirmaciones = (avisoId) =>
    confirmaciones.filter(c => c.aviso_id === avisoId).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Avisos del Director
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comunica novedades al equipo</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo aviso
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["todos", "borrador", "enviado", "archivado"].map(f => (
          <Button
            key={f}
            size="sm"
            variant={filtroEstado === f ? "default" : "outline"}
            onClick={() => setFiltroEstado(f)}
            className="capitalize text-xs"
          >
            {f === "todos" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
      ) : avisosFiltrados.length === 0 ? (
        <EmptyState icon={Megaphone} title="Sin avisos" description="Aún no hay avisos creados" />
      ) : (
        <div className="space-y-3">
          {avisosFiltrados.map(aviso => (
            <Card key={aviso.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm">{aviso.titulo}</span>
                    <Badge variant="outline" className={`text-[10px] ${prioridadBadge[aviso.prioridad]}`}>
                      {aviso.prioridad}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${estadoBadge[aviso.estado]}`}>
                      {aviso.estado}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{aviso.mensaje}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>Áreas: {aviso.areas_destino}</span>
                    {aviso.created_date && (
                      <span>{format(new Date(aviso.created_date), "d MMM yyyy", { locale: es })}</span>
                    )}
                    {aviso.requiere_confirmacion && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {countConfirmaciones(aviso.id)} confirmaciones
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {aviso.estado === "borrador" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      disabled={sending}
                      onClick={() => handlePublicar(aviso)}
                    >
                      <Send className="w-3 h-3 mr-1" /> Publicar
                    </Button>
                  )}
                  {aviso.estado === "enviado" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs h-7 text-muted-foreground"
                      onClick={() => handleArchivar(aviso)}
                    >
                      <Archive className="w-3 h-3 mr-1" /> Archivar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formulario nuevo aviso */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo aviso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs mb-1 block">Título *</Label>
              <Input
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="Título del aviso"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Mensaje *</Label>
              <Textarea
                value={form.mensaje}
                onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                rows={4}
                placeholder="Escribe el contenido del aviso..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Prioridad</Label>
                <Select value={form.prioridad} onValueChange={v => setForm(f => ({ ...f, prioridad: v }))}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="informativo">Informativo</SelectItem>
                    <SelectItem value="importante">Importante</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Áreas destino</Label>
                <Select value={form.areas_destino} onValueChange={v => setForm(f => ({ ...f, areas_destino: v }))}>
                  <SelectTrigger className="text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="salud">Salud</SelectItem>
                    <SelectItem value="cuidado">Cuidado</SelectItem>
                    <SelectItem value="administracion">Administración</SelectItem>
                    <SelectItem value="pastoral">Pastoral</SelectItem>
                    <SelectItem value="servicios_generales">Servicios Generales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.requiere_confirmacion}
                onCheckedChange={v => setForm(f => ({ ...f, requiere_confirmacion: v }))}
              />
              <Label className="text-sm">Requiere confirmación de lectura</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handleGuardarBorrador} disabled={!form.titulo || !form.mensaje || createMutation.isPending}>
                Guardar borrador
              </Button>
              <Button size="sm" onClick={handleEnviar} disabled={!form.titulo || !form.mensaje || sending}>
                {sending ? "Enviando..." : <><Send className="w-3.5 h-3.5 mr-1" /> Enviar ahora</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}