import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Megaphone, CheckCircle2, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import EmptyState from "@/components/shared/EmptyState";
import NuevoAvisoDialog from "@/components/avisos/NuevoAvisoDialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const prioridadBadge = {
  informativo: "bg-green-50 text-green-700 border-green-200",
  importante: "bg-amber-50 text-amber-700 border-amber-200",
  urgente: "bg-red-50 text-red-700 border-red-200",
};
const prioridadLabel = {
  informativo: "Informativo", importante: "Importante", urgente: "Urgente",
};

export default function MisAvisos() {
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [comentario, setComentario] = useState("");
  const [showNuevoAviso, setShowNuevoAviso] = useState(false);
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: misDestinatarios = [] } = useQuery({
    queryKey: ["mis-destinatarios", user?.email],
    queryFn: () => user?.email
      ? base44.entities.AvisoDestinatario.filter({ usuario_email: user.email }, "-created_date", 100)
      : Promise.resolve([]),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const { data: avisos = [] } = useQuery({
    queryKey: ["avisos-enviados"],
    queryFn: () => base44.entities.AvisoDirector.filter({ estado: "enviado" }, "-created_date", 100),
    refetchInterval: 30000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => base44.entities.StaffMember.list(),
  });

  const { data: slackConfigs = [] } = useQuery({
    queryKey: ["slack-configs"],
    queryFn: () => base44.entities.ConfiguracionSlack.filter({ activo: true }),
  });

  const updateDestinatarioMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AvisoDestinatario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-destinatarios"] });
      setConfirmDialog(null);
      setComentario("");
    },
  });

  const createAvisoMutation = useMutation({
    mutationFn: (data) => base44.entities.AvisoDirector.create(data),
  });

  const createDestinatarioMutation = useMutation({
    mutationFn: (data) => base44.entities.AvisoDestinatario.create(data),
  });

  const avisosMap = Object.fromEntries(avisos.map(a => [a.id, a]));
  const misAvisos = misDestinatarios
    .filter(d => avisosMap[d.aviso_id])
    .map(d => ({ destinatario: d, aviso: avisosMap[d.aviso_id] }));
  const noLeidos = misAvisos.filter(({ destinatario }) => !destinatario.leido_en).length;

  useEffect(() => {
    if (!user?.email) return;
    misDestinatarios.forEach(d => {
      if (!d.leido_en) {
        base44.entities.AvisoDestinatario.update(d.id, { leido_en: new Date().toISOString() });
      }
    });
  }, [misDestinatarios.length, user?.email]);

  const handleConfirmar = () => {
    if (!confirmDialog) return;
    updateDestinatarioMutation.mutate({
      id: confirmDialog.destinatario.id,
      data: { confirmado_en: new Date().toISOString(), comentario },
    });
  };

  const sendSlack = async (avisoData, webhooks) => {
    const emoji = avisoData.prioridad === "urgente" ? "🚨" : avisoData.prioridad === "importante" ? "⚠️" : "📢";
    const payload = {
      text: `${emoji} Nuevo aviso de ${avisoData.autor}: ${avisoData.titulo}`,
      attachments: [{
        color: avisoData.prioridad === "urgente" ? "#E53E3E" : avisoData.prioridad === "importante" ? "#DD6B20" : "#38A169",
        blocks: [
          { type: "header", text: { type: "plain_text", text: `${emoji} ${avisoData.titulo}`, emoji: true } },
          { type: "section", text: { type: "mrkdwn", text: `*Mensaje:*\n${avisoData.mensaje}` } },
          { type: "context", elements: [{ type: "mrkdwn", text: `Enviado por *${avisoData.autor}* · Providentia` }] },
        ],
      }],
    };
    await Promise.allSettled(
      webhooks.map(w => fetch(w.webhook_url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }))
    );
  };

  const enviarEmails = async (avisoData, destinatarios) => {
    const emoji = avisoData.prioridad === "urgente" ? "🚨" : avisoData.prioridad === "importante" ? "⚠️" : "📢";
    const priorLabel = { informativo: "Informativo", importante: "Importante", urgente: "URGENTE" };
    await Promise.allSettled(
      destinatarios.filter(d => d.email).map(d =>
        base44.integrations.Core.SendEmail({
          from_name: "Providentia · Pequeño Cottolengo",
          to: d.email,
          subject: `${emoji} ${priorLabel[avisoData.prioridad]}: ${avisoData.titulo}`,
          body: `Hola${d.full_name ? " " + d.full_name.split(" ")[0] : ""},\n\n${avisoData.autor} ha publicado un aviso:\n\n📌 ${avisoData.titulo}\n\n${avisoData.mensaje}\n\n---\nRevisa este aviso en Providentia → sección "Avisos".\n\nPequeño Cottolengo Quintero`,
        })
      )
    );
  };

  const handleEnviarAviso = async ({ form, destinatarios }) => {
    setSending(true);
    const autorNombre = user?.full_name || user?.email || "Personal";
    const webhooksRelevantes = slackConfigs.filter(w => {
      const areaMatch = form.areas_destino === "todos" || !w.area || w.area === form.areas_destino;
      const urgenciaMatch = !w.solo_urgentes || form.prioridad === "urgente";
      return areaMatch && urgenciaMatch;
    });
    let slackOk = false;
    try {
      if (webhooksRelevantes.length > 0) { await sendSlack({ ...form, autor: autorNombre }, webhooksRelevantes); slackOk = true; }
    } catch { slackOk = false; }

    const aviso = await createAvisoMutation.mutateAsync({
      ...form,
      autor: autorNombre,
      estado: "enviado",
      slack_enviado: slackOk,
    });

    // Crear registros de destinatarios
    await Promise.allSettled(
      destinatarios.map(d =>
        createDestinatarioMutation.mutateAsync({
          aviso_id: aviso.id,
          aviso_titulo: form.titulo,
          usuario_email: d.email,
          area: "",
        })
      )
    );

    // Enviar emails
    await enviarEmails({ ...form, autor: autorNombre }, destinatarios);

    queryClient.invalidateQueries({ queryKey: ["avisos-enviados"] });
    queryClient.invalidateQueries({ queryKey: ["mis-destinatarios"] });
    queryClient.invalidateQueries({ queryKey: ["avisos-director"] });
    setSending(false);
  };

  const handleBorradorAviso = async (form) => {
    const autorNombre = user?.full_name || user?.email || "Personal";
    await createAvisoMutation.mutateAsync({ ...form, autor: autorNombre, estado: "borrador" });
    queryClient.invalidateQueries({ queryKey: ["avisos-director"] });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Avisos
            {noLeidos > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-1">
                {noLeidos}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comunicaciones del equipo</p>
        </div>
        <Button onClick={() => setShowNuevoAviso(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Enviar aviso
        </Button>
      </div>

      {misAvisos.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Sin avisos"
          description="No hay avisos para ti en este momento"
        />
      ) : (
        <div className="space-y-3">
          {misAvisos.map(({ destinatario, aviso }) => {
            const yaConfirmo = !!destinatario.confirmado_en;
            const noLeido = !destinatario.leido_en;
            return (
              <Card
                key={destinatario.id}
                className={`p-4 transition-shadow ${noLeido ? "border-l-4 border-l-red-400" : ""}`}
              >
                <div className="flex items-start gap-3">
                  {noLeido && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{aviso.titulo}</span>
                      <Badge variant="outline" className={`text-[10px] ${prioridadBadge[aviso.prioridad]}`}>
                        {prioridadLabel[aviso.prioridad]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{aviso.mensaje}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                      <span>Por {aviso.autor || "Personal"}</span>
                      {aviso.created_date && (
                        <span>{format(new Date(aviso.created_date), "d MMM yyyy HH:mm", { locale: es })}</span>
                      )}
                    </div>
                    {aviso.requiere_confirmacion && (
                      yaConfirmo ? (
                        <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Lectura confirmada
                          {destinatario.confirmado_en && (
                            <span className="text-muted-foreground font-normal">
                              · {format(new Date(destinatario.confirmado_en), "d MMM HH:mm", { locale: es })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-primary/40 text-primary hover:bg-primary/10"
                          onClick={() => setConfirmDialog({ destinatario, aviso })}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmar lectura
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmar lectura dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={() => { setConfirmDialog(null); setComentario(""); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar lectura</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3">{confirmDialog?.aviso?.titulo}</p>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Comentario (opcional)</Label>
              <Textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={2}
                placeholder="Añade un comentario si lo deseas..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setConfirmDialog(null); setComentario(""); }}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleConfirmar} disabled={updateDestinatarioMutation.isPending}>
                {updateDestinatarioMutation.isPending ? "Guardando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nuevo aviso dialog */}
      <NuevoAvisoDialog
        open={showNuevoAviso}
        onClose={() => setShowNuevoAviso(false)}
        onEnviar={handleEnviarAviso}
        onBorrador={handleBorradorAviso}
        allUsers={allUsers}
        staffMembers={staffMembers}
        sending={sending}
      />
    </div>
  );
}