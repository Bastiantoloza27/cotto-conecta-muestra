import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Send, Archive, Eye, Megaphone, Pencil, Trash2, MessageCircle } from "lucide-react";
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
};

const AREAS = ["salud", "cuidado", "administracion", "pastoral", "servicios_generales", "otro"];

export default function AvisosDirector() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = nuevo, string = editando
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

  const { data: destinatarios = [] } = useQuery({
    queryKey: ["todos-destinatarios"],
    queryFn: () => base44.entities.AvisoDestinatario.list("-created_date", 500),
  });

  const { data: slackConfigs = [] } = useQuery({
    queryKey: ["slack-configs"],
    queryFn: () => base44.entities.ConfiguracionSlack.filter({ activo: true }),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => base44.entities.StaffMember.list(),
  });

  const createAvisoMutation = useMutation({
    mutationFn: (data) => base44.entities.AvisoDirector.create(data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AvisoDirector.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["avisos-director"] }),
  });

  const updateAvisoMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AvisoDirector.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["avisos-director"] }),
  });

  const createDestinatarioMutation = useMutation({
    mutationFn: (data) => base44.entities.AvisoDestinatario.create(data),
  });

  // Filtra los webhooks de Slack relevantes para el área y prioridad del aviso
  const getWebhooksParaArea = (area, prioridad) => {
    return slackConfigs.filter(w => {
      // Filtro por área
      const areaMatch = area === "todos" || !w.area || w.area === area || w.area === "todos";
      // Si el webhook es solo_urgentes, solo aplica cuando la prioridad sea urgente
      const urgenciaMatch = !w.solo_urgentes || prioridad === "urgente";
      return areaMatch && urgenciaMatch;
    });
  };

  // Resuelve destinatarios usando Users (plataforma) + StaffMembers con email, sin duplicados
  const resolverDestinatarios = (areasDestino) => {
    const emailsEnPlataforma = new Set(allUsers.map(u => u.email).filter(Boolean));

    // Usuarios registrados en la plataforma (fuente principal)
    const usersComoDestinatarios = allUsers
      .filter(u => u.email)
      .map(u => {
        const staffMatch = staffMembers.find(s => s.email?.toLowerCase() === u.email?.toLowerCase());
        return { email: u.email, full_name: u.full_name, area: staffMatch?.area || "" };
      });

    // Staff con email que NO tienen cuenta en la plataforma
    const staffSinCuenta = staffMembers
      .filter(s => s.email && !emailsEnPlataforma.has(s.email))
      .map(s => ({ email: s.email, full_name: s.full_name, area: s.area || "" }));

    const todos = [...usersComoDestinatarios, ...staffSinCuenta];

    // Si es "todos" o áreas_destino está vacío: devolver todos
    if (!areasDestino || areasDestino === "todos" || areasDestino === "personas_especificas") return todos;

    const areas = areasDestino.split(",").map(a => a.trim());
    // Incluir también usuarios sin área asignada cuando el area vacía no es criterio de exclusión
    return todos.filter(d => areas.includes(d.area));
  };

  const sendSlack = async (avisoData, webhooks) => {
    const emoji = avisoData.prioridad === "urgente" ? "🚨" : avisoData.prioridad === "importante" ? "⚠️" : "📢";
    const prioridadLabel = { informativo: "Informativo", importante: "Importante ⚠️", urgente: "URGENTE 🚨" };
    const colorBar = avisoData.prioridad === "urgente" ? "#E53E3E" : avisoData.prioridad === "importante" ? "#DD6B20" : "#38A169";
    const areasText = avisoData.areas_destino === "todos" ? "Todo el equipo" : avisoData.areas_destino;

    const payload = {
      text: `${emoji} Nuevo aviso del Director: ${avisoData.titulo}`,
      attachments: [
        {
          color: colorBar,
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: `${emoji} ${avisoData.titulo}`, emoji: true },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*Prioridad:*\n${prioridadLabel[avisoData.prioridad] || avisoData.prioridad}` },
                { type: "mrkdwn", text: `*Destinatarios:*\n${areasText}` },
              ],
            },
            {
              type: "section",
              text: { type: "mrkdwn", text: `*Mensaje:*\n${avisoData.mensaje}` },
            },
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `Publicado por *${avisoData.autor || "Director"}* · Providentia` },
              ],
            },
          ],
        },
      ],
    };

    await Promise.allSettled(
      webhooks.map(w =>
        fetch(w.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      )
    );
  };

  const enviarEmails = async (avisoData, usuarios) => {
    const emoji = avisoData.prioridad === "urgente" ? "🚨" : avisoData.prioridad === "importante" ? "⚠️" : "📢";
    const prioridadLabel = { informativo: "Informativo", importante: "Importante", urgente: "URGENTE" };
    await Promise.allSettled(
      usuarios
        .filter(u => u.email)
        .map(u =>
          base44.integrations.Core.SendEmail({
            from_name: "Pequeño Cottolengo Quintero",
            to: u.email,
            subject: `${emoji} ${prioridadLabel[avisoData.prioridad] || ""}: ${avisoData.titulo}`,
            body: `Hola${u.full_name ? " " + u.full_name.split(" ")[0] : ""},\n\nEl Director ha publicado un nuevo aviso:\n\n📌 ${avisoData.titulo}\n\n${avisoData.mensaje}\n\n---\nPuedes ver y confirmar este aviso en la plataforma Providentia, sección "Mis Avisos".\n\nPequeño Cottolengo Quintero`,
          })
        )
    );
  };

  const crearDestinatarios = async (avisoId, avisoData, areasDestino) => {
    const destinatarios = resolverDestinatarios(areasDestino);
    await Promise.allSettled(
      destinatarios.map(d =>
        createDestinatarioMutation.mutateAsync({
          aviso_id: avisoId,
          aviso_titulo: avisoData.titulo,
          usuario_email: d.email,
          area: d.area || "",
        })
      )
    );
    // Enviar emails
    await enviarEmails(avisoData, destinatarios);
  };

  const openEdit = (aviso) => {
    setEditingId(aviso.id);
    setForm({
      titulo: aviso.titulo,
      mensaje: aviso.mensaje,
      prioridad: aviso.prioridad,
      areas_destino: aviso.areas_destino,
      requiere_confirmacion: aviso.requiere_confirmacion || false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleGuardarBorrador = async () => {
    if (editingId) {
      await updateAvisoMutation.mutateAsync({ id: editingId, data: { ...form } });
    } else {
      await createAvisoMutation.mutateAsync({
        ...form,
        autor: user?.full_name || user?.email || "Director",
        estado: "borrador",
      });
      queryClient.invalidateQueries({ queryKey: ["avisos-director"] });
    }
    closeForm();
  };

  const handleEnviar = async () => {
    setSending(true);
    const webhooks = getWebhooksParaArea(form.areas_destino, form.prioridad);
    let slackOk = false;
    try {
      if (webhooks.length > 0) {
        await sendSlack(form, webhooks);
        slackOk = true;
      }
    } catch { slackOk = false; }

    const aviso = await createAvisoMutation.mutateAsync({
      ...form,
      autor: user?.full_name || user?.email || "Director",
      estado: "enviado",
      slack_enviado: slackOk,
      slack_error: webhooks.length > 0 && !slackOk,
    });

    // Crear registros de destinatarios para "Mis Avisos" + enviar emails
    await crearDestinatarios(aviso.id, { ...form, autor: user?.full_name || user?.email || "Director" }, form.areas_destino);

    queryClient.invalidateQueries({ queryKey: ["avisos-director"] });
    queryClient.invalidateQueries({ queryKey: ["todos-destinatarios"] });
    setSending(false);
    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleArchivar = async (aviso) => {
    await updateAvisoMutation.mutateAsync({ id: aviso.id, data: { estado: "archivado" } });
  };

  const handlePublicar = async (aviso) => {
    setSending(true);
    const webhooks = getWebhooksParaArea(aviso.areas_destino, aviso.prioridad);
    let slackOk = false;
    try {
      if (webhooks.length > 0) { await sendSlack(aviso, webhooks); slackOk = true; }
    } catch { slackOk = false; }

    await updateAvisoMutation.mutateAsync({
      id: aviso.id,
      data: { estado: "enviado", slack_enviado: slackOk, slack_error: webhooks.length > 0 && !slackOk },
    });

    await crearDestinatarios(aviso.id, aviso, aviso.areas_destino);
    queryClient.invalidateQueries({ queryKey: ["todos-destinatarios"] });
    setSending(false);
  };

  const avisosFiltrados = filtroEstado === "todos"
    ? avisos
    : avisos.filter(a => a.estado === filtroEstado);

  const countConfirmaciones = (avisoId) =>
    destinatarios.filter(d => d.aviso_id === avisoId && d.confirmado_en).length;

  const countLeidos = (avisoId) =>
    destinatarios.filter(d => d.aviso_id === avisoId && d.leido_en).length;

  const countTotal = (avisoId) =>
    destinatarios.filter(d => d.aviso_id === avisoId).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Avisos del Director
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comunica novedades al equipo</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={base44.agents.getWhatsAppConnectURL('avisos_director')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-green-300 bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
          </a>
          <Button onClick={() => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Nuevo aviso
          </Button>
        </div>
      </div>

      {/* Tabs de filtro */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: "todos", label: "Todos" },
          { key: "borrador", label: "Borrador" },
          { key: "enviado", label: "Enviado" },
          { key: "archivado", label: "Archivado" },
        ].map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={filtroEstado === f.key ? "default" : "outline"}
            onClick={() => setFiltroEstado(f.key)}
            className="text-xs"
          >
            {f.label}
            {f.key !== "todos" && (
              <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-[10px]">
                {avisos.filter(a => a.estado === f.key).length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
      ) : avisosFiltrados.length === 0 ? (
        <EmptyState icon={Megaphone} title="Sin avisos" description="Aún no hay avisos en esta categoría" />
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
                    {aviso.slack_enviado && (
                      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                        Slack ✓
                      </Badge>
                    )}
                    {aviso.slack_error && (
                      <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                        Slack ✗
                      </Badge>
                    )}
                    {aviso.estado === "enviado" && (
                      <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                        Email ✓
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1 line-clamp-2">{aviso.mensaje}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span>Áreas: {aviso.areas_destino}</span>
                    {aviso.created_date && (
                      <span>{format(new Date(aviso.created_date), "d MMM yyyy", { locale: es })}</span>
                    )}
                    {aviso.estado === "enviado" && (
                      <>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" /> {countLeidos(aviso.id)}/{countTotal(aviso.id)} leídos
                        </span>
                        {aviso.requiere_confirmacion && (
                          <span className="flex items-center gap-1 text-green-700">
                            ✓ {countConfirmaciones(aviso.id)} confirmados
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {aviso.estado === "borrador" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => openEdit(aviso)}
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        disabled={sending}
                        onClick={() => handlePublicar(aviso)}
                      >
                        <Send className="w-3 h-3 mr-1" /> Publicar
                      </Button>
                    </>
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => { if (confirm("¿Eliminar este aviso?")) deleteMutation.mutate(aviso.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Formulario nuevo / editar aviso */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar aviso" : "Nuevo aviso"}</DialogTitle>
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
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {AREAS.map(a => (
                      <SelectItem key={a} value={a}>
                        {a.charAt(0).toUpperCase() + a.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
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
              <Button variant="outline" size="sm" onClick={closeForm}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGuardarBorrador}
                disabled={!form.titulo || !form.mensaje || createAvisoMutation.isPending || updateAvisoMutation.isPending}
              >
                {editingId ? "Guardar cambios" : "Guardar borrador"}
              </Button>
              {!editingId && (
                <Button
                  size="sm"
                  onClick={handleEnviar}
                  disabled={!form.titulo || !form.mensaje || sending}
                >
                  {sending ? "Enviando..." : <><Send className="w-3.5 h-3.5 mr-1" /> Enviar ahora</>}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}