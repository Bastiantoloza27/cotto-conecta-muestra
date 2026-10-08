import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

export default function GenerarPreguntas({ form, recursos, onGeneradas }) {
  const [cantidad, setCantidad] = useState(5);
  const [cargando, setCargando] = useState(false);

  const generar = async () => {
    setCargando(true);
    const archivos = recursos.filter((r) => r.tipo === "archivo" && /\.(pdf|png|jpe?g|webp)$/i.test(r.nombre_archivo || ""));
    const file_urls = await Promise.all(archivos.map(async (r) => (await base44.integrations.Core.CreateFileSignedUrl({ file_uri: r.uri, expires_in: 600 })).signed_url));
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Eres experto en prevención de riesgos y capacitación laboral en Chile, en una residencia de cuidado de personas con alta dependencia.
Crea exactamente ${cantidad} preguntas de selección múltiple en español para evaluar la capacitación "${form.nombre}".
Descripción: ${form.descripcion || "sin descripción"}.
Temas de los módulos: ${recursos.map((r) => r.titulo).join("; ") || "no indicados"}.
Si se adjuntan documentos, basa las preguntas en su contenido. Cada pregunta con 3 o 4 alternativas claras y una sola correcta (índice desde 0). Varía la posición de la correcta.`,
      file_urls: file_urls.length ? file_urls : undefined,
      response_json_schema: {
        type: "object",
        properties: { preguntas: { type: "array", items: { type: "object", properties: { pregunta: { type: "string" }, opciones: { type: "array", items: { type: "string" } }, correcta: { type: "number" } } } } },
      },
    });
    onGeneradas(res.preguntas || []);
    setCargando(false);
  };

  return (
    <div className="flex flex-wrap items-end gap-2 border rounded-lg p-3 bg-primary/5">
      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-medium flex items-center gap-1"><Sparkles className="w-4 h-4 text-primary" />Generar preguntas automáticamente</p>
        <p className="text-xs text-muted-foreground">Según el nombre, la descripción y los documentos de la clase.</p>
      </div>
      <div className="w-24"><Input type="number" min={1} max={20} value={cantidad} onChange={(e) => setCantidad(+e.target.value)} /></div>
      <Button type="button" disabled={cargando || !form.nombre} onClick={generar} className="gap-1">
        {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Generar
      </Button>
    </div>
  );
}