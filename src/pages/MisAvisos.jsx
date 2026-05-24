import { useState } from "react";
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
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [comentario, setComentario] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => base44.entities.StaffMember.list(),
  });

  const miStaff = staffMembers.find(s => s.email === user?.email);
  const miArea = miStaff?.area;

  const { data: avisos = [] } = useQuery({
    queryKey: ["avisos-enviados"],
    queryFn: () => base44.entities.AvisoDirector.filter({ estado: "enviado" }, "-created_date", 100),
  });

  const { data: misConfirmaciones = [] } = useQuery({
    queryKey: ["mis-confirmaciones", user?.email],
    queryFn: () => user?.email
      ? base44.entities.ConfirmacionLectura.filter({ usuario_email: user.email })
      : Promise.resolve([]),
    enabled: !!user?.email,
  });

  const confirmMutation = useMutation({
    mutationFn: (data) => base44.entities.ConfirmacionLectura.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mis-confirmaciones"] });
      setConfirmDialog(null);
      setComentario("");
    },
  });

  const misAvisosIds = new Set(misConfirmaciones.map(c => c.aviso_id));

  const avisosVisibles = avisos.filter(a => {
    const areas = (a.areas_destino || "").split(",").map(s => s.trim().toLowerCase());
    return areas.includes("todos") || (miArea && areas.includes(miArea.toLowerCase()));
  });

  const avisosNoLeidos = avisosVisibles.filter(a =>
    a.requiere_confirmacion && !misAvisosIds.has(a.id)
  ).length;

  const handleConfirmar = () => {
    if (!confirmDialog || !user) return;
    confirmMutation.mutate({
      aviso_id: confirmDialog.id,
      aviso_titulo: confirmDialog.titulo,
      funcionario_id: miStaff?.id || user.email,
      funcionario_nombre: miStaff?.full_name || user.full_name || user.email,
      usuario_email: user.email,
      comentario,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Mis Avisos
            {avisosNoLeidos > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 ml-1">
                {avisosNoLeidos}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comunicaciones del Director para tu área</p>
        </div>
      </div>

      {avisosVisibles.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Sin avisos"
          description="No hay avisos para tu área en este momento"
        />
      ) : (
        <div className="space-y-3">
          {avisosVisibles.map((aviso) => {
            const yaConfirmo = misAvisosIds.has(aviso.id);
            const noLeido = aviso.requiere_confirmacion && !yaConfirmo;
            return (
              <Card key={aviso.id} className={`p-4 transition-shadow ${noLeido ? "border-l-4 border-l-red-400" : ""}`}>
                <div className="flex items-start gap-3">
                  {noLeido && <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{aviso.titulo}</span>
                      <Badge variant="outline" className={`text-[10px] ${prioridadBadge[aviso.prioridad]}`}>
                        {prioridadLabel[aviso.prioridad]}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{aviso.mensaje}</p>
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
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-primary/40 text-primary hover:bg-primary/10"
                          onClick={() => setConfirmDialog(aviso)}
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
          <p className="text-sm text-muted-foreground mb-3">{confirmDialog?.titulo}</p>
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
              <Button size="sm" onClick={handleConfirmar} disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? "Guardando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}