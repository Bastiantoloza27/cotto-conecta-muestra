import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { CARPETAS, addHistorial } from "./constants";

// doc = documento existente para reenviar una nueva versión (opcional)
export default function SubirDocumentoDialog({ open, onOpenChange, doc, onSaved }) {
  const [form, setForm] = useState(doc || { carpeta: "protocolos", version: "1" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const me = await base44.auth.me();
    let archivo = {};
    if (file) {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      archivo = { archivo_uri: file_uri, archivo_nombre: file.name };
    }
    const data = {
      titulo: form.titulo, codigo: form.codigo, descripcion: form.descripcion, carpeta: form.carpeta,
      version: form.version, vigencia_desde: form.vigencia_desde, proxima_revision: form.proxima_revision,
      ...archivo, estado: "en_revision", autor_nombre: me.full_name,
      historial: addHistorial(doc, me.full_name, doc ? "Reenviado a revisión" : "Enviado a revisión"),
    };
    if (doc) await base44.entities.DocumentoPrevencion.update(doc.id, data);
    else await base44.entities.DocumentoPrevencion.create(data);
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{doc ? "Enviar nueva versión" : "Subir documento para aprobación"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Título *</Label><Input required value={form.titulo || ""} onChange={(e) => set("titulo", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Código</Label><Input placeholder="D-001-PR" value={form.codigo || ""} onChange={(e) => set("codigo", e.target.value)} /></div>
            <div><Label>Versión</Label><Input value={form.version || ""} onChange={(e) => set("version", e.target.value)} /></div>
          </div>
          <div><Label>Carpeta</Label>
            <Select value={form.carpeta} onValueChange={(v) => set("carpeta", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CARPETAS).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Descripción / cambios</Label><Textarea value={form.descripcion || ""} onChange={(e) => set("descripcion", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Vigencia desde</Label><Input type="date" value={form.vigencia_desde || ""} onChange={(e) => set("vigencia_desde", e.target.value)} /></div>
            <div><Label>Próxima revisión</Label><Input type="date" value={form.proxima_revision || ""} onChange={(e) => set("proxima_revision", e.target.value)} /></div>
          </div>
          <div><Label>Archivo {doc ? "(opcional, reemplaza el anterior)" : "*"}</Label>
            <Input type="file" required={!doc} onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Enviar al Director
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}