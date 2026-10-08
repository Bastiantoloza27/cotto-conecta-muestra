import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link2, Upload, Trash2, Loader2, PlayCircle, FileText } from "lucide-react";

export default function RecursosEditor({ recursos, onChange }) {
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [subiendo, setSubiendo] = useState(false);

  const addLink = () => {
    onChange([...recursos, { titulo: titulo || `Recurso ${recursos.length + 1}`, tipo: "link", url }]);
    setTitulo(""); setUrl("");
  };
  const addArchivo = async (file) => {
    if (!file) return;
    setSubiendo(true);
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    onChange([...recursos, { titulo: titulo || file.name, tipo: "archivo", uri: file_uri, nombre_archivo: file.name }]);
    setTitulo(""); setSubiendo(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Cada recurso será un paso de la clase, en el orden en que los agregues.</p>
      {recursos.map((r, i) => (
        <div key={i} className="flex items-center gap-3 border rounded-lg px-3 py-2">
          <span className="text-sm font-semibold text-primary">Paso {i + 1}</span>
          {r.tipo === "link" ? <PlayCircle className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-primary" />}
          <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.titulo}</p><p className="text-xs text-muted-foreground truncate">{r.url || r.nombre_archivo}</p></div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange(recursos.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
        </div>
      ))}
      <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
        <Input placeholder="Título del paso (ej: Módulo 1 - Uso de extintores)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        <div className="flex gap-2">
          <Input placeholder="Enlace de YouTube, Vimeo, Drive o web" value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button type="button" variant="outline" disabled={!url} onClick={addLink} className="gap-1"><Link2 className="w-4 h-4" />Agregar enlace</Button>
        </div>
        <label className="flex items-center justify-center gap-2 border border-dashed rounded-lg py-2 text-sm cursor-pointer hover:bg-muted">
          {subiendo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Subir video, PDF o imagen
          <input type="file" className="hidden" accept="video/*,application/pdf,image/*,.ppt,.pptx,.doc,.docx" onChange={(e) => addArchivo(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}