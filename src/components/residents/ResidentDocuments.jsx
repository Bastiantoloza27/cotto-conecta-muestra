import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Trash2, Download, Plus, File } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORY_LABELS = {
  evaluacion: { label: "Evaluación", color: "bg-blue-100 text-blue-800" },
  informe: { label: "Informe", color: "bg-purple-100 text-purple-800" },
  ficha_clinica: { label: "Ficha clínica", color: "bg-green-100 text-green-800" },
  contrato: { label: "Contrato", color: "bg-amber-100 text-amber-800" },
  identificacion: { label: "Identificación", color: "bg-teal-100 text-teal-800" },
  legal: { label: "Legal", color: "bg-red-100 text-red-800" },
  otro: { label: "Otro", color: "bg-gray-100 text-gray-800" },
};

const FILE_ICONS = {
  pdf: "📄",
  docx: "📝",
  doc: "📝",
  xlsx: "📊",
  xls: "📊",
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
};

export default function ResidentDocuments({ residentId, residentName }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", category: "otro", notes: "" });
  const [file, setFile] = useState(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["resident-docs", residentId],
    queryFn: () => base44.entities.ResidentDocument.filter({ resident_id: residentId }, "-created_date", 50),
    enabled: !!residentId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ResidentDocument.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resident-docs", residentId] });
      toast.success("Documento eliminado");
    },
  });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    if (!form.title) {
      setForm(prev => ({ ...prev, title: selected.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const handleUpload = async () => {
    if (!file) { toast.error("Selecciona un archivo"); return; }
    if (!form.title.trim()) { toast.error("Ingresa un título"); return; }

    setUploading(true);
    const me = await base44.auth.me();
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const ext = file.name.split(".").pop().toLowerCase();

    await base44.entities.ResidentDocument.create({
      resident_id: residentId,
      resident_name: residentName,
      title: form.title,
      category: form.category,
      file_url,
      file_name: file.name,
      file_type: ext,
      uploaded_by: me?.full_name || me?.email || "Desconocido",
      notes: form.notes,
    });

    qc.invalidateQueries({ queryKey: ["resident-docs", residentId] });
    toast.success("Documento subido correctamente");
    setShowForm(false);
    setForm({ title: "", category: "otro", notes: "" });
    setFile(null);
    setUploading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{documents.length} documento{documents.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Subir documento
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : documents.length === 0 ? (
        <Card className="p-10 text-center">
          <File className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No hay documentos subidos aún</p>
          <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => setShowForm(true)}>
            <Upload className="w-4 h-4" /> Subir primer documento
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const cat = CATEGORY_LABELS[doc.category] || CATEGORY_LABELS.otro;
            const icon = FILE_ICONS[doc.file_type] || "📎";
            return (
              <Card key={doc.id} className="p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
                <div className="text-2xl shrink-0">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate">{doc.title}</p>
                    <Badge className={`${cat.color} border-0 text-[10px]`}>{cat.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {doc.file_name} · Subido por {doc.uploaded_by}
                    {doc.created_date && ` · ${format(new Date(doc.created_date), "dd MMM yyyy", { locale: es })}`}
                  </p>
                  {doc.notes && <p className="text-xs text-muted-foreground mt-1 italic">{doc.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(doc.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog subir documento */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Subir documento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Archivo *</Label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {file ? file.name : "Haz clic para seleccionar un archivo"}
                </span>
                <span className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, imágenes, etc.</span>
                <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt" />
              </label>
            </div>
            <div className="space-y-1">
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Evaluación funcional enero 2025" />
            </div>
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="evaluacion">Evaluación</SelectItem>
                  <SelectItem value="informe">Informe</SelectItem>
                  <SelectItem value="ficha_clinica">Ficha clínica</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="identificacion">Identificación</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Observaciones <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Descripción breve del documento..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={uploading}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={uploading} className="gap-2">
                <Upload className="w-4 h-4" />
                {uploading ? "Subiendo..." : "Subir documento"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}