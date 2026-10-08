import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Loader2 } from "lucide-react";
import { parsePreguntas } from "./utils";

export default function EvaluacionPaso({ asig, cap, onSaved, onClose }) {
  const [resp, setResp] = useState({});
  const [resultado, setResultado] = useState(null);
  const [saving, setSaving] = useState(false);
  const preguntas = parsePreguntas(cap);
  const restantes = (cap.intentos || 1) - (asig.intentos_usados || 0);

  const enviar = async () => {
    setSaving(true);
    const correctas = preguntas.filter((p, i) => resp[i] === p.correcta).length;
    const pct = Math.round((correctas / preguntas.length) * 100);
    const aprobo = pct >= (cap.porcentaje_aprobacion || 75);
    const usados = (asig.intentos_usados || 0) + 1;
    await base44.entities.AsignacionCapacitacion.update(asig.id, {
      intentos_usados: usados, mejor_puntaje: Math.max(pct, asig.mejor_puntaje || 0),
      estado: aprobo ? "aprobada" : usados >= cap.intentos ? "reprobada" : "pendiente",
      ...(aprobo && { fecha_aprobacion: new Date().toISOString() }),
    });
    setSaving(false);
    setResultado({ pct, correctas, aprobo });
    onSaved();
  };

  if (resultado) return (
    <div className="text-center py-10 space-y-2">
      <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${resultado.aprobo ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
        {resultado.aprobo ? <Trophy className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
      </div>
      <p className="text-3xl font-bold">{resultado.pct}%</p>
      <p className="text-sm">{resultado.correctas} de {preguntas.length} correctas · {resultado.aprobo ? "Aprobaste la capacitación" : "No alcanzaste el mínimo"}</p>
      <Button onClick={onClose}>Volver a mis capacitaciones</Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{restantes} intento(s) disponibles · Aprueba con {cap.porcentaje_aprobacion}%</p>
      {preguntas.map((p, i) => (
        <div key={i} className="space-y-2">
          <p className="text-sm font-medium">{i + 1}. {p.pregunta}</p>
          {p.opciones.map((o, k) => (
            <button key={k} type="button" onClick={() => setResp({ ...resp, [i]: k })}
              className={`w-full text-left text-sm border rounded-lg px-3 py-2 ${resp[i] === k ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>{o}</button>
          ))}
        </div>
      ))}
      <Button disabled={saving || restantes <= 0 || Object.keys(resp).length < preguntas.length} onClick={enviar} className="gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}Enviar respuestas
      </Button>
    </div>
  );
}