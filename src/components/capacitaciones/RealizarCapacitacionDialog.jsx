import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CircleCheck, Circle, PlayCircle, ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
import VisorRecurso from "./VisorRecurso";
import EvaluacionPaso from "./EvaluacionPaso";
import { parseRecursos } from "./utils";

export default function RealizarCapacitacionDialog({ asig, cap, onClose, onSaved }) {
  const recursos = parseRecursos(cap);
  const [paso, setPaso] = useState(0);
  const [vistos, setVistos] = useState([0]);
  const total = recursos.length + 1;
  const esEval = paso === recursos.length;
  const ir = (i) => { setPaso(i); setVistos((v) => (v.includes(i) ? v : [...v, i])); };
  const puedeIr = (i) => i <= Math.max(...vistos) + 0 || vistos.includes(i);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b bg-sidebar text-sidebar-foreground">
          <DialogTitle className="pr-8 text-base">Aula virtual · {cap.nombre}</DialogTitle>
          <div className="flex items-center gap-3 pt-1"><Progress value={(vistos.length / total) * 100} className="h-1.5" /><span className="text-xs whitespace-nowrap">{vistos.length}/{total} pasos</span></div>
        </DialogHeader>
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <aside className="md:w-64 border-b md:border-b-0 md:border-r overflow-y-auto bg-muted/30 p-2 space-y-1 max-h-40 md:max-h-none">
            {[...recursos.map((r) => ({ titulo: r.titulo, Icon: PlayCircle })), { titulo: "Evaluación final", Icon: ClipboardCheck }].map((s, i) => (
              <button key={i} disabled={!puedeIr(i)} onClick={() => ir(i)}
                className={`w-full flex items-center gap-2 text-left text-sm rounded-lg px-3 py-2 disabled:opacity-40 ${paso === i ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {vistos.includes(i) && paso !== i ? <CircleCheck className="w-4 h-4 text-green-600 shrink-0" /> : paso === i ? <s.Icon className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
                <span className="truncate">{i + 1}. {s.titulo}</span>
              </button>
            ))}
          </aside>
          <main className="flex-1 overflow-y-auto p-5 space-y-4">
            <h3 className="font-semibold text-lg">{esEval ? "Evaluación final" : recursos[paso].titulo}</h3>
            {paso === 0 && cap.descripcion && <p className="text-sm text-muted-foreground">{cap.descripcion}</p>}
            {esEval ? <EvaluacionPaso asig={asig} cap={cap} onSaved={onSaved} onClose={onClose} /> : <VisorRecurso recurso={recursos[paso]} />}
          </main>
        </div>
        <div className="flex justify-between border-t px-5 py-3">
          <Button variant="outline" disabled={paso === 0} onClick={() => ir(paso - 1)} className="gap-1"><ChevronLeft className="w-4 h-4" />Anterior</Button>
          {!esEval && <Button onClick={() => ir(paso + 1)} className="gap-1">{paso + 1 === recursos.length ? "Ir a la evaluación" : "Siguiente paso"}<ChevronRight className="w-4 h-4" /></Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}