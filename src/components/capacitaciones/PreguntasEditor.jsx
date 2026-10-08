import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, CircleCheck, Circle } from "lucide-react";

export default function PreguntasEditor({ preguntas, onChange }) {
  const upd = (i, patch) => onChange(preguntas.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const add = () => onChange([...preguntas, { pregunta: "", opciones: ["", "", ""], correcta: 0 }]);

  return (
    <div className="space-y-3">
      {preguntas.map((p, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <div className="flex gap-2">
            <span className="text-sm font-semibold text-primary pt-2">{i + 1}.</span>
            <Input placeholder="Pregunta" value={p.pregunta} onChange={(e) => upd(i, { pregunta: e.target.value })} />
            <Button type="button" variant="ghost" size="icon" onClick={() => onChange(preguntas.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
          </div>
          {p.opciones.map((o, k) => (
            <div key={k} className="flex items-center gap-2 pl-5">
              <button type="button" onClick={() => upd(i, { correcta: k })} title="Marcar como correcta">
                {p.correcta === k ? <CircleCheck className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
              </button>
              <Input className="h-8" placeholder={`Alternativa ${k + 1}`} value={o} onChange={(e) => upd(i, { opciones: p.opciones.map((x, m) => (m === k ? e.target.value : x)) })} />
            </div>
          ))}
          <Button type="button" variant="link" size="sm" className="pl-12" onClick={() => upd(i, { opciones: [...p.opciones, ""] })}>+ Alternativa</Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={add} className="w-full gap-2"><Plus className="w-4 h-4" />Agregar pregunta</Button>
      <p className="text-xs text-muted-foreground">Toca el círculo para marcar la alternativa correcta.</p>
    </div>
  );
}