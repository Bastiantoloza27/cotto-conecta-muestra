import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Megaphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const prioridadBadge = {
  informativo: "bg-green-50 text-green-700 border-green-200",
  importante: "bg-amber-50 text-amber-700 border-amber-200",
  urgente: "bg-red-50 text-red-700 border-red-200",
};

const prioridadLabel = {
  informativo: "Informativo",
  importante: "Importante",
  urgente: "Urgente",
};

export default function MisAvisos() {
  const [confirmDialog, setConfirmDialog] = useState(null); // { destinatario, aviso }
  const [comentario, setComentario] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  // Mis entradas en AvisoDestinatario
  const { data: misDestinatarios = [] } = useQuery({
    queryKey: ["mis-destinatarios", user?.email],
    queryFn: () => user?.email
      ? base44.entities.AvisoDestinatario.filter({ usuario_email: user.email }, "-created_date", 100)
      : Promise.resolve([]),
    enabled: !!user?.email,
    refetchInterval: 30000, // polling cada 30s
  });

  // Cargar los avisos correspondientes
  const { data: avisos = [] } = useQuery({
    queryKey: ["avisos-enviados"],
    queryFn: () => base44.entities.AvisoDirector.filter({ estado: "enviado" }, "-created_date", 100),
    refetchInterval: 30000,
  });

  const updateDestinatarioMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AvisoDestinatario.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-destinatarios"] });
      setConfirmDialog(null);
      setComentario("");
    },
  });

  // Map avisos by id for quick lookup
  const avisosMap = Object.fromEntries(avisos.map(a => [a.id, a]));

  // Filtrar solo destinatarios que tienen aviso válido
  const misAvisos = misDestinatarios
    .filter(d => avisosMap[d.aviso_id])
    .map(d => ({ destinatario: d, aviso: avisosMap[d.aviso_id] }));

  const noLeidos = misAvisos.filter(({ destinatario }) => !destinatario.leido_en).length;

  // Marcar como leído al montar (los no leídos)
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
      data: {
        confirmado_en: new Date().toISOString(),
        comentario,
      },
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Mis Avisos
            {noLeidos > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-1">
                {noLeidos}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comunicaciones del Director para tu área</p>
        </div>
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
                      <span>Por {aviso.autor || "Director"}</span>
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
    </div>
  );
}