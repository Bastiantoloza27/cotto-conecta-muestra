import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileDown, Trophy, RotateCcw } from "lucide-react";
import { abrirArchivo } from "@/components/prevencion/constants";
import { parsePreguntas } from "./utils";

export default function RealizarCapacitacionDialog({ asig, cap, onClose, onSaved }) {
  const [resp, setResp] = useState({});
  const [resultado, setResultado] = useState(null);
  const [saving, setSaving] = useState(false);
  if (!asig || !cap) return null;
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

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="pr-6">{cap.nombre}</DialogTitle></DialogHeader>
        {cap.descripcion && <p className="text-sm text-muted-foreground">{cap.descripcion}</p>}
        <div className="flex flex-wrap gap-2">
          {cap.recurso_url && <Button variant="outline" asChild className="gap-2"><a href={cap.recurso_url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />Ver material</a></Button>}
          {cap.recurso_uri && <Button variant="outline" className="gap-2" onClick={() => abrirArchivo(cap.recurso_uri)}><FileDown className="w-4 h-4" />{cap.recurso_nombre}</Button>}
        </div>

        {resultado ? (
          <div className="text-center py-6 space-y-2">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${resultado.aprobo ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
              {resultado.aprobo ? <Trophy className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
            </div>
            <p className="text-2xl font-bold">{resultado.pct}%</p>
            <p className="text-sm">{resultado.correctas} de {preguntas.length} correctas · {resultado.aprobo ? "Aprobaste la capacitación" : "No alcanzaste el mínimo"}</p>
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground border-t pt-3">Evaluación · {restantes} intento(s) disponibles · Aprueba con {cap.porcentaje_aprobacion}%</p>
            {preguntas.map((p, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium">{i + 1}. {p.pregunta}</p>
                {p.opciones.map((o, k) => (
                  <button key={k} type="button" onClick={() => setResp({ ...resp, [i]: k })}
                    className={`w-full text-left text-sm border rounded-lg px-3 py-2 ${resp[i] === k ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>{o}</button>
                ))}
              </div>
            ))}
            <Button disabled={saving || restantes <= 0 || Object.keys(resp).length < preguntas.length} onClick={enviar}>Enviar respuestas</Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}