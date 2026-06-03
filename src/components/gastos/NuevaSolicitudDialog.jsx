import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Paperclip, X, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CATEGORIAS = [
  { value: "insumos", label: "Insumos" },
  { value: "traslado", label: "Traslado" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "capacitacion", label: "Capacitación" },
  { value: "otros", label: "Otros" },
];

export default function NuevaSolicitudDialog({ open, onClose, onSubmit, user }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [form, setForm] = useState({ motivo: "", categoria: "", monto: "", detalle: "" });
  const [archivos, setArchivos] = useState([]); // [{ name, url }]
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef();

  const handleArchivos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSubiendo(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setArchivos(prev => [...prev, { name: file.name, url: file_url }]);
    }
    setSubiendo(false);
    e.target.value = "";
  };

  const removeArchivo = (url) => setArchivos(prev => prev.filter(a => a.url !== url));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      solicitante_nombre: user?.full_name || user?.email || "",
      solicitante_email: user?.email || "",
      fecha_solicitud: today,
      motivo: form.motivo,
      categoria: form.categoria,
      monto: parseFloat(form.monto),
      detalle: form.detalle,
      archivos_urls: archivos.map(a => a.url).join(","),
      estado: "pendiente",
    });
    setForm({ motivo: "", categoria: "", monto: "", detalle: "" });
    setArchivos([]);
  };

  const valid = form.motivo && form.categoria && form.monto;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Solicitante</Label>
              <Input value={user?.full_name || user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input value={today} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Motivo del gasto <span className="text-destructive">*</span></Label>
            <Textarea
              value={form.motivo}
              onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
              placeholder="Describe el motivo del gasto..."
              rows={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Categoría <span className="text-destructive">*</span></Label>
              <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Monto (CLP) <span className="text-destructive">*</span></Label>
              <Input
                type="number"
                min="1"
                value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                placeholder="Ej: 15000"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Detalle adicional</Label>
            <Textarea
              value={form.detalle}
              onChange={e => setForm(f => ({ ...f, detalle: e.target.value }))}
              placeholder="Información adicional (opcional)..."
              rows={2}
            />
          </div>

          {/* Adjuntos */}
          <div className="space-y-2">
            <Label>Adjuntos <span className="text-muted-foreground text-xs">(boletas, presupuestos, fotos)</span></Label>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleArchivos} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendo}
            >
              {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {subiendo ? "Subiendo..." : "Seleccionar archivos"}
            </Button>
            {archivos.length > 0 && (
              <div className="space-y-1.5">
                {archivos.map(a => (
                  <div key={a.url} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary truncate flex-1 hover:underline">{a.name}</a>
                    <button type="button" onClick={() => removeArchivo(a.url)} className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!valid}>Enviar solicitud</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}