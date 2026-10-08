import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, PlayCircle } from "lucide-react";
import RealizarCapacitacionDialog from "./RealizarCapacitacionDialog";
import { ESTADOS_CAP, estadoReal, parsePreguntas } from "./utils";

export default function MisCapacitaciones({ asignaciones, caps, onSaved }) {
  const [filtro, setFiltro] = useState("todos");
  const [sel, setSel] = useState(null);
  const capOf = (a) => caps.find((c) => c.id === a.capacitacion_id);
  const conEstado = asignaciones.map((a) => ({ ...a, _estado: estadoReal(a, capOf(a)) }));
  const lista = conEstado.filter((a) => filtro === "todos" || a._estado === filtro);
  const count = (k) => conEstado.filter((a) => a._estado === k).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={filtro === "todos" ? "default" : "outline"} onClick={() => setFiltro("todos")}>Todos ({conEstado.length})</Button>
        {Object.entries(ESTADOS_CAP).map(([k, e]) => (
          <Button key={k} size="sm" variant={filtro === k ? "default" : "outline"} onClick={() => setFiltro(k)}>{e.label} ({count(k)})</Button>
        ))}
      </div>
      {!lista.length && <Card className="p-8 text-center text-sm text-muted-foreground"><GraduationCap className="w-8 h-8 mx-auto mb-2 text-primary/50" />No tienes capacitaciones en esta categoría.</Card>}
      {lista.map((a) => {
        const cap = capOf(a);
        const puede = a._estado === "pendiente" || a._estado === "atrasada";
        return (
          <Card key={a.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><GraduationCap className="w-5 h-5 text-primary" /></div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{a.capacitacion_nombre}</p>
              <p className="text-xs text-muted-foreground">
                Caduca {cap?.fecha_caducidad || "—"} · {parsePreguntas(cap).length} preguntas · Intento {a.intentos_usados || 0}/{cap?.intentos || 0} · Mejor nota {a.mejor_puntaje || 0}%
              </p>
            </div>
            <Badge className={ESTADOS_CAP[a._estado].cls}>{ESTADOS_CAP[a._estado].label}</Badge>
            {puede && cap && <Button size="sm" className="gap-1" onClick={() => setSel(a)}><PlayCircle className="w-4 h-4" />Realizar</Button>}
          </Card>
        );
      })}
      {sel && <RealizarCapacitacionDialog asig={sel} cap={capOf(sel)} onClose={() => setSel(null)} onSaved={onSaved} />}
    </div>
  );
}