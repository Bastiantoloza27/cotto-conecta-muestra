import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FlaskConical, Pencil, Trash2, CalendarClock, ChevronDown, ChevronUp, Upload, Sparkles, FileText, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

const PANELES = [
  { key: "hemograma",       label: "🩸 Hemograma",        hint: "Hematocrito, Hemoglobina, Leucocitos, Plaquetas..." },
  { key: "glicemia",        label: "🍬 Glicemia",          hint: "Glicemia en ayunas, HbA1c..." },
  { key: "perfil_lipidico", label: "💛 Perfil Lipídico",   hint: "Colesterol total, HDL, LDL, Triglicéridos..." },
  { key: "hepatico",        label: "🫁 Hepático",          hint: "GOT/AST, GPT/ALT, Fosfatasa alcalina, Bilirrubina..." },
  { key: "renal",           label: "🔵 Renal",             hint: "Creatinina, BUN, Clearance de creatinina, Ácido úrico..." },
  { key: "tiroides",        label: "🦋 Tiroides",          hint: "TSH, T3, T4..." },
];

const EMPTY_FORM = {
  resident_id: "", resident_name: "", fecha_examen: "", proxima_fecha: "",
  hemograma: "", glicemia: "", perfil_lipidico: "", hepatico: "", renal: "", tiroides: "",
  observaciones: "", profesional_nombre: "", archivo_url: "", archivo_nombre: "",
};

// ─── Extracción IA desde archivo ───────────────────────────────────────────
async function extraerDatosConIA(fileUrl) {
  const prompt = `Eres un asistente clínico especializado en análisis de laboratorio. 
Analiza la imagen o documento adjunto que corresponde a un examen de laboratorio o examen bioquímico de un paciente.

Extrae TODOS los valores que encuentres y organízalos en los siguientes paneles. Para cada panel, lista los parámetros con su valor y unidad, e indica brevemente si está normal, alto o bajo según los rangos de referencia.

Si un panel no aparece en el documento, déjalo vacío ("").

Responde SOLO con el JSON indicado, sin texto adicional.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    file_urls: [fileUrl],
    response_json_schema: {
      type: "object",
      properties: {
        fecha_examen: { type: "string", description: "Fecha del examen en formato YYYY-MM-DD, si aparece en el documento" },
        hemograma: { type: "string", description: "Parámetros del hemograma con valores y estado (normal/alto/bajo)" },
        glicemia: { type: "string", description: "Glicemia, HbA1c y otros parámetros de glucosa" },
        perfil_lipidico: { type: "string", description: "Colesterol total, HDL, LDL, triglicéridos" },
        hepatico: { type: "string", description: "GOT, GPT, fosfatasa alcalina, bilirrubina y otros hepáticos" },
        renal: { type: "string", description: "Creatinina, BUN, ácido úrico y otros renales" },
        tiroides: { type: "string", description: "TSH, T3, T4 y otros tiroideos" },
        observaciones: { type: "string", description: "Otros parámetros no categorizados u observaciones relevantes del laboratorio" },
      }
    }
  });
  return result;
}

// ─── Zona de carga de archivo ───────────────────────────────────────────────
function ZonaArchivo({ onExtracted, onFileUploaded, archivoActual }) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [fileUrl, setFileUrl] = useState(archivoActual?.url || "");
  const [fileName, setFileName] = useState(archivoActual?.nombre || "");
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.info("Subiendo archivo...");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url);
    setFileName(file.name);
    onFileUploaded(file_url, file.name);
    setUploading(false);
    toast.success("Archivo subido. Ahora puedes extraer los datos con IA.");
  };

  const handleExtract = async () => {
    if (!fileUrl) { toast.error("Primero sube un archivo"); return; }
    setExtracting(true);
    toast.info("La IA está leyendo el examen, esto puede tardar unos segundos...");
    const datos = await extraerDatosConIA(fileUrl);
    onExtracted(datos);
    setExtracting(false);
    toast.success("¡Datos extraídos! Revisa y ajusta los campos si es necesario.");
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Upload className="w-4 h-4 text-primary" />
        Adjuntar examen original
      </p>

      {fileUrl ? (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 flex-1 min-w-0">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs truncate text-muted-foreground">{fileName}</span>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0">
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
            </a>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            Reemplazar
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 w-full"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Subiendo..." : "Seleccionar foto o PDF"}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFile}
      />

      {fileUrl && (
        <Button
          type="button"
          size="sm"
          className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={handleExtract}
          disabled={extracting}
        >
          {extracting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Extrayendo datos con IA...</>
            : <><Sparkles className="w-4 h-4" /> Extraer datos automáticamente con IA</>
          }
        </Button>
      )}

      <p className="text-[11px] text-muted-foreground">
        Sube una foto o PDF del examen y la IA completará los campos automáticamente. El archivo queda guardado como respaldo.
      </p>
    </div>
  );
}

// ─── Formulario ────────────────────────────────────────────────────────────
function FormDialog({ open, onClose, residents, editing, residentFixed }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() =>
    editing
      ? { ...EMPTY_FORM, ...editing }
      : residentFixed
        ? { ...EMPTY_FORM, resident_id: residentFixed.id, resident_name: residentFixed.preferred_name || residentFixed.full_name }
        : EMPTY_FORM
  );

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleResident = (id) => {
    const r = residents.find(r => r.id === id);
    set("resident_id", id);
    set("resident_name", r?.preferred_name || r?.full_name || "");
  };

  const handleExtracted = (datos) => {
    setForm(prev => ({
      ...prev,
      fecha_examen: datos.fecha_examen || prev.fecha_examen,
      hemograma: datos.hemograma || prev.hemograma,
      glicemia: datos.glicemia || prev.glicemia,
      perfil_lipidico: datos.perfil_lipidico || prev.perfil_lipidico,
      hepatico: datos.hepatico || prev.hepatico,
      renal: datos.renal || prev.renal,
      tiroides: datos.tiroides || prev.tiroides,
      observaciones: datos.observaciones
        ? (prev.observaciones ? prev.observaciones + "\n" + datos.observaciones : datos.observaciones)
        : prev.observaciones,
    }));
  };

  const mutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.ExamenBioquimico.update(editing.id, data)
      : base44.entities.ExamenBioquimico.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["examenes-bioquimicos"] });
      toast.success(editing ? "Examen actualizado" : "Examen registrado");
      onClose();
    },
  });

  const handleSave = () => {
    if (!form.resident_id) { toast.error("Selecciona un residente"); return; }
    if (!form.fecha_examen) { toast.error("Ingresa la fecha del examen"); return; }
    mutation.mutate(form);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            {editing ? "Editar examen bioquímico" : "Registrar examen bioquímico"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Residente */}
          {residentFixed || editing ? (
            <div className="rounded-lg bg-muted/50 border px-3 py-2">
              <p className="text-xs text-muted-foreground">Residente</p>
              <p className="text-sm font-semibold">{form.resident_name}</p>
            </div>
          ) : (
            <div>
              <Label>Residente *</Label>
              <Select value={form.resident_id} onValueChange={handleResident}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {residents.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Zona adjunto + IA */}
          <ZonaArchivo
            archivoActual={form.archivo_url ? { url: form.archivo_url, nombre: form.archivo_nombre } : null}
            onFileUploaded={(url, nombre) => { set("archivo_url", url); set("archivo_nombre", nombre); }}
            onExtracted={handleExtracted}
          />

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fecha del examen *</Label>
              <Input type="date" value={form.fecha_examen} onChange={e => set("fecha_examen", e.target.value)} />
            </div>
            <div>
              <Label>Próximos exámenes sugeridos</Label>
              <Input type="date" value={form.proxima_fecha} onChange={e => set("proxima_fecha", e.target.value)} />
            </div>
          </div>

          {/* Paneles */}
          {PANELES.map(panel => (
            <div key={panel.key}>
              <Label className="flex items-center gap-1 mb-1">{panel.label}</Label>
              <Textarea
                rows={3}
                value={form[panel.key]}
                onChange={e => set(panel.key, e.target.value)}
                placeholder={`Parámetros y resultados: ${panel.hint}`}
                className="text-sm resize-none"
              />
            </div>
          ))}

          <div>
            <Label>Observaciones generales</Label>
            <Textarea rows={2} value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Observaciones, interpretación general, recomendaciones..." className="text-sm resize-none" />
          </div>

          <div>
            <Label>Profesional que registra</Label>
            <Input value={form.profesional_nombre} onChange={e => set("profesional_nombre", e.target.value)} placeholder="Nombre del profesional" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : "Guardar examen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tarjeta de examen ─────────────────────────────────────────────────────
function ExamenCard({ examen, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const panelesCargados = PANELES.filter(p => examen[p.key]?.trim());
  const diasParaProximo = examen.proxima_fecha
    ? differenceInDays(parseISO(examen.proxima_fecha), new Date())
    : null;

  return (
    <Card className={`p-4 ${diasParaProximo !== null && diasParaProximo <= 14 && diasParaProximo >= 0 ? "border-amber-300 bg-amber-50/40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
              {examen.resident_name}
            </p>
            <Badge variant="outline" className="text-[10px]">
              {format(parseISO(examen.fecha_examen), "dd MMM yyyy", { locale: es })}
            </Badge>
            {examen.archivo_url && (
              <a href={examen.archivo_url} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="text-[10px] flex items-center gap-1 hover:bg-primary/5 cursor-pointer">
                  <FileText className="w-2.5 h-2.5" />
                  Archivo adjunto
                  <ExternalLink className="w-2.5 h-2.5" />
                </Badge>
              </a>
            )}
            {examen.proxima_fecha && (
              <Badge
                variant="outline"
                className={`text-[10px] flex items-center gap-1 ${
                  diasParaProximo !== null && diasParaProximo <= 14 && diasParaProximo >= 0
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : diasParaProximo !== null && diasParaProximo < 0
                      ? "bg-red-50 text-red-700 border-red-300"
                      : ""
                }`}
              >
                <CalendarClock className="w-2.5 h-2.5" />
                Próximo: {format(parseISO(examen.proxima_fecha), "dd MMM yyyy", { locale: es })}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {panelesCargados.map(p => (
              <span key={p.key} className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5">
                {p.label.split(" ").slice(1).join(" ")}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => onEdit(examen)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(examen)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-2">
          {panelesCargados.map(panel => (
            <div key={panel.key}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{panel.label}</p>
              <p className="text-sm whitespace-pre-wrap">{examen[panel.key]}</p>
            </div>
          ))}
          {examen.observaciones && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Observaciones</p>
              <p className="text-sm whitespace-pre-wrap">{examen.observaciones}</p>
            </div>
          )}
          {examen.profesional_nombre && (
            <p className="text-[11px] text-muted-foreground mt-1">Registrado por: {examen.profesional_nombre}</p>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── Vista principal ───────────────────────────────────────────────────────
export default function TabExamenesBioquimicos({ residents, residentFixed }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterResidente, setFilterResidente] = useState(residentFixed?.id || "todos");

  const { data: examenes = [] } = useQuery({
    queryKey: ["examenes-bioquimicos"],
    queryFn: () => base44.entities.ExamenBioquimico.list("-fecha_examen", 300),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExamenBioquimico.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["examenes-bioquimicos"] }); toast.success("Examen eliminado"); },
  });

  const handleEdit = (examen) => { setEditing(examen); setShowForm(true); };
  const handleDelete = (examen) => {
    if (confirm(`¿Eliminar el examen del ${examen.fecha_examen} de ${examen.resident_name}?`)) {
      deleteMutation.mutate(examen.id);
    }
  };

  const filtered = examenes.filter(e =>
    filterResidente === "todos" ? true : e.resident_id === filterResidente
  );

  const proximos = examenes.filter(e => {
    if (!e.proxima_fecha) return false;
    return differenceInDays(parseISO(e.proxima_fecha), new Date()) <= 14;
  });

  return (
    <div className="space-y-4">
      {proximos.length > 0 && (
        <Card className="p-3 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
            <CalendarClock className="w-4 h-4 shrink-0" />
            {proximos.length} examen(es) con fecha sugerida próxima o vencida:
            {" "}{proximos.map(e => e.resident_name).join(", ")}
          </p>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {!residentFixed && (
          <Select value={filterResidente} onValueChange={setFilterResidente}>
            <SelectTrigger className="w-48 h-8 text-sm"><SelectValue placeholder="Todos los residentes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los residentes</SelectItem>
              {residents.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" className="gap-1.5 ml-auto" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Nuevo examen
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <FlaskConical className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Sin exámenes registrados</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(examen => (
            <ExamenCard key={examen.id} examen={examen} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showForm && (
        <FormDialog
          open={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          residents={residents}
          editing={editing}
          residentFixed={residentFixed}
        />
      )}
    </div>
  );
}