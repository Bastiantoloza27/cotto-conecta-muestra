import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";
import CrearCapacitacionDialog from "./CrearCapacitacionDialog";
import { TIPOS_CAP, estadoReal } from "./utils";

export default function CumplimientoCapacitaciones({ caps, asignaciones, onSaved }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button className="gap-2" onClick={() => setOpen(true)}><Plus className="w-4 h-4" />Crear capacitación</Button></div>
      {!caps.length && <Card className="p-8 text-center text-sm text-muted-foreground">Aún no hay capacitaciones creadas.</Card>}
      {caps.map((c) => {
        const as = asignaciones.filter((a) => a.capacitacion_id === c.id);
        const est = (k) => as.filter((a) => estadoReal(a, c) === k).length;
        const pct = as.length ? Math.round((est("aprobada") / as.length) * 100) : 0;
        return (
          <Card key={c.id} className="p-4 space-y-2">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-medium">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">{TIPOS_CAP[c.tipo]} · Caduca {c.fecha_caducidad || "—"} · {as.length} asignados</p>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-green-700">Aprobadas {est("aprobada")}</span>
                <span className="text-slate-600">Pendientes {est("pendiente")}</span>
                <span className="text-red-700">Atrasadas {est("atrasada")}</span>
                <span className="text-orange-700">Reprobadas {est("reprobada")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3"><Progress value={pct} className="h-2" /><span className="text-sm font-semibold w-12 text-right">{pct}%</span></div>
          </Card>
        );
      })}
      <CrearCapacitacionDialog open={open} onOpenChange={setOpen} onSaved={onSaved} />
    </div>
  );
}