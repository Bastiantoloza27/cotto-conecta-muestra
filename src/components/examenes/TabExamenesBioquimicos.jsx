import { useState, useRef, useEffect } from "react";
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
import { Plus, FlaskConical, Pencil, Trash2, CalendarClock, ChevronDown, ChevronUp, Upload, Sparkles, FileText, ExternalLink, Loader2, X, Files } from "lucide-react";
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

// ─── Extracción IA desde archivo ─────────────────────────────────────────────
async function extraerDatosConIA(fileUrls) {
  const prompt = `Eres un asistente clínico especializado en análisis de laboratorio. 
Analiza el/los documento(s) adjunto(s) que corresponden a exámenes, informes médicos o cualquier documento de salud de un paciente.
El documento puede tener múltiples páginas; analiza TODAS las páginas y extrae TODA la información que encuentres.

Intenta clasificar los valores en los paneles predefinidos (hemograma, glicemia, perfil_lipidico, hepatico, renal, tiroides).
Si un valor no encaja en ningún panel específico, ponlo en "observaciones".
Si el documento no es un examen de laboratorio estándar (por ejemplo es un informe médico, una receta, una epicrisis, etc.), 
igualmente extrae TODA la información relevante y ponla en "observaciones".

IMPORTANTE: Siempre rellena al menos el campo "observaciones" con un resumen de lo que encontraste en el documento, 
aunque no sea un examen de laboratorio estándar. Nunca dejes todos los campos vacíos.

Si un panel específico no aparece en el documento, déjalo vacío ("").`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    model: "gemini_3_1_pro",
    file_urls: Array.isArray(fileUrls) ? fileUrls : [fileUrls],
    response_json_schema: {
      type: "object",
      properties: {
        fecha_examen: { type: "string", description: "Fecha del examen o documento en formato YYYY-MM-DD, si aparece" },
        hemograma: { type: "string", description: "Parámetros del hemograma con valores y estado (normal/alto/bajo)" },
        glicemia: { type: "string", description: "Glicemia, HbA1c y otros parámetros de glucosa" },
        perfil_lipidico: { type: "string", description: "Colesterol total, HDL, LDL, triglicéridos" },
        hepatico: { type: "string", description: "GOT, GPT, fosfatasa alcalina, bilirrubina y otros hepáticos" },
        renal: { type: "string", description: "Creatinina, BUN, ácido úrico y otros renales" },
        tiroides: { type: "string", description: "TSH, T3, T4 y otros tiroideos" },
        observaciones: { type: "string", description: "OBLIGATORIO: resumen completo del documento, todos los parámetros no categorizados, diagnósticos, indicaciones u otra información relevante encontrada" },
      }
    }
  });
  return result;
}

// ─── Dialog: Subir PDF y generar ficha digital ───────────────────────────────
function SubirPDFDialog({ open, onClose, residents, residentFixed }) {
  const qc = useQueryClient();
  const inputRef = useRef();
  const [archivos, setArchivos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [residenteId, setResidenteId] = useState(residentFixed?.id || "");
  const [residenteNombre, setResidenteNombre] = useState(residentFixed?.preferred_name || residentFixed?.full_name || "");
  const [fichaData, setFichaData] = useState(null);

  useEffect(() => {
    if (open) {
      setArchivos([]);
      setFichaData(null);
      setResidenteId(residentFixed?.id || "");
      setResidenteNombre(residentFixed?.preferred_name || residentFixed?.full_name || "");
    }
  }, [open]);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    toast.info(`Subiendo ${files.length} archivo(s)...`);
    const nuevos = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      nuevos.push({ url: file_url, nombre: file.name });
    }
    setArchivos(prev => [...prev, ...nuevos]);
    setUploading(false);
    e.target.value = "";
  };

  const handleExtract = async () => {
    if (!residenteId) { toast.error("Selecciona un residente primero"); return; }
    if (!archivos.length) { toast.error("Sube al menos un archivo"); return; }
    setExtracting(true);
    toast.info("La IA está leyendo el documento, puede tardar hasta 60 segundos...");
    try {
      const urls = archivos.map(a => a.url);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Tiempo agotado. El PDF puede ser muy extenso, intenta con un archivo más pequeño.")), 90000)
      );
      const datos = await Promise.race([extraerDatosConIA(urls), timeout]);
      const tieneContenido = datos && Object.values(datos).some(v => v && String(v).trim() !== "");
      if (!tieneContenido) {
        toast.warning("La IA no pudo leer el documento. Intenta con una imagen o un PDF de mejor calidad.");
        setExtracting(false);
        return;
      }
      setFichaData(datos);
      toast.success("¡Transcripción lista! Revisa la ficha y guárdala.");
    } catch (err) {
      toast.error(err?.message || "Error al procesar con IA");
    } finally {
      setExtracting(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.ExamenBioquimico.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["examenes-bioquimicos"] });
      toast.success("Ficha guardada correctamente");
      onClose();
    },
  });

  const handleGuardar = () => {
    const archivo_url = archivos.map(a => a.url).join("||");
    const archivo_nombre = archivos.map(a => a.nombre).join("||");
    saveMutation.mutate({
      resident_id: residenteId,
      resident_name: residenteNombre,
      fecha_examen: fichaData.fecha_examen || new Date().toISOString().split("T")[0],
      hemograma: fichaData.hemograma || "",
      glicemia: fichaData.glicemia || "",
      perfil_lipidico: fichaData.perfil_lipidico || "",
      hepatico: fichaData.hepatico || "",
      renal: fichaData.renal || "",
      tiroides: fichaData.tiroides || "",
      observaciones: fichaData.observaciones || "",
      archivo_url,
      archivo_nombre,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Transcribir examen con IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Residente */}
          {residentFixed ? (
            <div className="rounded-lg bg-muted/50 border px-3 py-2">
              <p className="text-xs text-muted-foreground">Residente</p>
              <p className="text-sm font-semibold">{residenteNombre}</p>
            </div>
          ) : (
            <div>
              <Label>Residente *</Label>
              <Select value={residenteId} onValueChange={id => {
                const r = residents.find(r => r.id === id);
                setResidenteId(id);
                setResidenteNombre(r?.preferred_name || r?.full_name || "");
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar residente..." /></SelectTrigger>
                <SelectContent>
                  {residents.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Zona subida */}
          {!fichaData && (
            <div className="rounded-xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-5 space-y-3">
              <p className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Sube el PDF o imagen del examen
              </p>
              {archivos.length > 0 && (
                <div className="space-y-1.5">
                  {archivos.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 text-xs">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate flex-1 text-muted-foreground">{a.nombre}</span>
                      <button type="button" onClick={() => setArchivos(prev => prev.filter((_, j) => j !== i))}>
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" className="w-full gap-2" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Subiendo..." : archivos.length > 0 ? "Agregar más archivos" : "Seleccionar PDF o imagen"}
              </Button>
              <input ref={inputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFiles} />
              {archivos.length > 0 && (
                <Button type="button" size="sm" className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleExtract} disabled={extracting}>
                  {extracting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Transcribiendo con IA...</>
                    : <><Sparkles className="w-4 h-4" /> Transcribir con IA</>}
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">La IA leerá el documento y generará una ficha digital estructurada lista para guardar.</p>
            </div>
          )}

          {/* Ficha digital resultado */}
          {fichaData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">Transcripción completada — revisa la ficha antes de guardar</span>
              </div>

              {fichaData.fecha_examen && (
                <div className="bg-muted/40 rounded-lg px-3 py-2 text-sm">
                  <span className="text-muted-foreground text-xs font-medium uppercase">Fecha del examen</span>
                  <p className="font-semibold">{fichaData.fecha_examen}</p>
                </div>
              )}

              {[...PANELES, { key: "observaciones", label: "📝 Observaciones" }].map(panel => {
                const val = fichaData[panel.key];
                if (!val?.trim()) return null;
                return (
                  <div key={panel.key} className="border rounded-lg p-3 bg-white">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{panel.label}</p>
                    <p className="text-sm whitespace-pre-wrap">{val}</p>
                  </div>
                );
              })}

              <div className="flex items-center gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => { setFichaData(null); setArchivos([]); }}>
                  Volver a subir
                </Button>
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" onClick={handleGuardar} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar ficha digital"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Zona de carga de archivos (dentro del formulario manual) ─────────────────
function ZonaArchivos({ archivos, onArchivosChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    toast.info(`Subiendo ${files.length} archivo(s)...`);
    const nuevos = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      nuevos.push({ url: file_url, nombre: file.name });
    }
    onArchivosChange([...archivos, ...nuevos]);
    setUploading(false);
    e.target.value = "";
  };

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <Files className="w-3.5 h-3.5" /> Adjuntar archivo(s) como respaldo
      </p>
      {archivos.length > 0 && (
        <div className="space-y-1">
          {archivos.map((archivo, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white border rounded px-2 py-1">
              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs truncate text-muted-foreground flex-1">{archivo.nombre}</span>
              <a href={archivo.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
              </a>
              <button type="button" onClick={() => onArchivosChange(archivos.filter((_, i) => i !== idx))}>
                <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" className="gap-1.5 w-full h-7 text-xs" onClick={() => inputRef.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {uploading ? "Subiendo..." : "Seleccionar archivo(s)"}
      </Button>
      <input ref={inputRef} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleFiles} />
    </div>
  );
}

// ─── Formulario ──────────────────────────────────────────────────────────────
function FormDialog({ open, onClose, residents, editing, residentFixed }) {
  const qc = useQueryClient();

  // archivos: array de {url, nombre}
  const buildInitialArchivos = (src) => {
    if (!src?.archivo_url) return [];
    // soporte legacy: un solo archivo guardado
    const urls = src.archivo_url.split("||");
    const nombres = src.archivo_nombre ? src.archivo_nombre.split("||") : [];
    return urls.map((url, i) => ({ url, nombre: nombres[i] || url.split("/").pop() }));
  };

  const buildInitialForm = (editingSrc, residentSrc) => {
    if (editingSrc) return { ...EMPTY_FORM, ...editingSrc };
    if (residentSrc) return { ...EMPTY_FORM, resident_id: residentSrc.id, resident_name: residentSrc.preferred_name || residentSrc.full_name };
    return { ...EMPTY_FORM };
  };

  const [form, setForm] = useState(() => buildInitialForm(editing, residentFixed));
  const [archivos, setArchivos] = useState(() => buildInitialArchivos(editing));

  useEffect(() => {
    if (open) {
      setForm(buildInitialForm(editing, residentFixed));
      setArchivos(buildInitialArchivos(editing));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleResident = (id) => {
    const r = residents.find(r => r.id === id);
    set("resident_id", id);
    set("resident_name", r?.preferred_name || r?.full_name || "");
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
    onError: (err) => {
      toast.error("Error al guardar: " + (err?.message || "intenta nuevamente"));
    },
  });

  const handleSave = () => {
    if (!form.resident_id) { toast.error("Selecciona un residente"); return; }

    // Serializar múltiples archivos con separador ||
    const archivo_url = archivos.map(a => a.url).join("||");
    const archivo_nombre = archivos.map(a => a.nombre).join("||");

    // Si no hay fecha, usar hoy
    const fecha_examen = form.fecha_examen || new Date().toISOString().split("T")[0];

    mutation.mutate({ ...form, fecha_examen, archivo_url, archivo_nombre });
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

          {/* Zona adjuntos */}
          <ZonaArchivos
            archivos={archivos}
            onArchivosChange={setArchivos}
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

// ─── Tarjeta de examen ────────────────────────────────────────────────────────
function ExamenCard({ examen, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const panelesCargados = PANELES.filter(p => examen[p.key]?.trim());
  const diasParaProximo = examen.proxima_fecha
    ? differenceInDays(parseISO(examen.proxima_fecha), new Date())
    : null;

  // Soporte para múltiples archivos (separados por ||) o legacy
  const archivosAdjuntos = examen.archivo_url
    ? examen.archivo_url.split("||").map((url, i) => {
        const nombres = examen.archivo_nombre ? examen.archivo_nombre.split("||") : [];
        return { url, nombre: nombres[i] || url.split("/").pop() };
      })
    : [];

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
            {archivosAdjuntos.map((archivo, idx) => (
              <a key={idx} href={archivo.url} target="_blank" rel="noopener noreferrer">
                <Badge variant="outline" className="text-[10px] flex items-center gap-1 hover:bg-primary/5 cursor-pointer">
                  <FileText className="w-2.5 h-2.5" />
                  {archivosAdjuntos.length > 1 ? `Archivo ${idx + 1}` : "Archivo adjunto"}
                  <ExternalLink className="w-2.5 h-2.5" />
                </Badge>
              </a>
            ))}
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

// ─── Vista principal ──────────────────────────────────────────────────────────
export default function TabExamenesBioquimicos({ residents, residentFixed }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showSubirPDF, setShowSubirPDF] = useState(false);
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
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => setShowSubirPDF(true)}>
            <Sparkles className="w-3.5 h-3.5" /> Transcribir con IA
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="w-3.5 h-3.5" /> Registro manual
          </Button>
        </div>
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

      <SubirPDFDialog
        open={showSubirPDF}
        onClose={() => setShowSubirPDF(false)}
        residents={residents}
        residentFixed={residentFixed}
      />
    </div>
  );
}