import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Undo2, FileDown, Eye } from "lucide-react";
import VistaPreviaDialog from "./VistaPreviaDialog";
import { CARPETAS, ESTADOS, parseHistorial, addHistorial, abrirArchivo } from "./constants";

export default function RevisionDialog({ doc, onClose, isAdmin, onSaved }) {
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  if (!doc) return null;

  const resolver = async (estado, accion) => {
    setSaving(true);
    const me = await base44.auth.me();
    await base44.entities.DocumentoPrevencion.update(doc.id, {
      estado, comentario_director: comentario, historial: addHistorial(doc, me.full_name, accion, comentario),
    });
    setSaving(false);
    setComentario("");
    onSaved();
    onClose();
  };

  const info = [
    ["Código", doc.codigo], ["Carpeta", CARPETAS[doc.carpeta]?.label], ["Versión", doc.version],
    ["Autor", doc.autor_nombre], ["Vigencia desde", doc.vigencia_desde], ["Próxima revisión", doc.proxima_revision],
  ];

  return (
    <Dialog open={!!doc} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="pr-6">{doc.titulo}</DialogTitle></DialogHeader>
        <Badge className={`${ESTADOS[doc.estado]?.cls} w-fit`}>{ESTADOS[doc.estado]?.label}</Badge>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {info.map(([k, v]) => <div key={k}><p className="text-xs text-muted-foreground">{k}</p><p>{v || "—"}</p></div>)}
        </div>
        {doc.descripcion && <p className="text-sm text-muted-foreground">{doc.descripcion}</p>}
        {doc.archivo_uri && (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setPreview(true)} className="gap-2"><Eye className="w-4 h-4" />Vista previa</Button>
            <Button variant="outline" onClick={() => abrirArchivo(doc.archivo_uri)} className="gap-2"><FileDown className="w-4 h-4" />Descargar</Button>
          </div>
        )}
        {doc.comentario_director && (
          <div className="bg-muted rounded-lg p-3 text-sm"><p className="text-xs font-semibold mb-1">Comentario del Director</p>{doc.comentario_director}</div>
        )}

        {isAdmin && doc.estado === "en_revision" && (
          <div className="space-y-2 border-t pt-3">
            <Textarea placeholder="Comentarios o sugerencias (requerido para devolver o rechazar)" value={comentario} onChange={(e) => setComentario(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <Button disabled={saving} className="bg-green-600 hover:bg-green-700 gap-1" onClick={() => resolver("aprobado", "Aprobado y publicado")}><Check className="w-4 h-4" />Aprobar</Button>
              <Button disabled={saving || !comentario} variant="outline" className="gap-1" onClick={() => resolver("devuelto", "Devuelto con sugerencias")}><Undo2 className="w-4 h-4" />Devolver</Button>
              <Button disabled={saving || !comentario} variant="destructive" className="gap-1" onClick={() => resolver("rechazado", "Rechazado")}><X className="w-4 h-4" />Rechazar</Button>
            </div>
          </div>
        )}

        <div className="border-t pt-3">
          <p className="text-sm font-semibold mb-2">Historial</p>
          <div className="space-y-2">
            {parseHistorial(doc).reverse().map((h, i) => (
              <div key={i} className="text-xs border-l-2 border-primary/40 pl-2">
                <p><span className="font-medium">{h.accion}</span> · {h.usuario}</p>
                <p className="text-muted-foreground">{format(new Date(h.fecha), "dd/MM/yyyy HH:mm")}</p>
                {h.comentario && <p className="italic">"{h.comentario}"</p>}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
      {preview && <VistaPreviaDialog doc={doc} onClose={() => setPreview(false)} />}
    </Dialog>
  );
}