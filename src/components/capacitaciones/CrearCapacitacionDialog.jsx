import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, FolderOpen, ClipboardCheck, Loader2 } from "lucide-react";
import PreguntasEditor from "./PreguntasEditor";
import AsignarPersonas from "./AsignarPersonas";
import RecursosEditor from "./RecursosEditor";
import GenerarPreguntas from "./GenerarPreguntas";
import { TIPOS_CAP } from "./utils";

const PASOS = [{ label: "Configuración", Icon: Settings }, { label: "Recursos", Icon: FolderOpen }, { label: "Evaluación", Icon: ClipboardCheck }];

export default function CrearCapacitacionDialog({ open, onOpenChange, onSaved }) {
  const [paso, setPaso] = useState(0);
  const [f, setF] = useState({ tipo: "seguridad", intentos: 3, duracion_min: 30, porcentaje_aprobacion: 75 });
  const [personas, setPersonas] = useState([]);
  const [preguntas, setPreguntas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const guardar = async () => {
    setSaving(true);
    const me = await base44.auth.me();
    const cap = await base44.entities.Capacitacion.create({ ...f, recursos: JSON.stringify(recursos), preguntas: JSON.stringify(preguntas), creador_nombre: me.full_name });
    if (personas.length) await base44.entities.AsignacionCapacitacion.bulkCreate(personas.map((p) => ({ capacitacion_id: cap.id, capacitacion_nombre: cap.nombre, usuario_email: p.email, usuario_nombre: p.nombre })));
    setSaving(false);
    setPaso(0); setF({ tipo: "seguridad", intentos: 3, duracion_min: 30, porcentaje_aprobacion: 75 }); setPersonas([]); setPreguntas([]); setRecursos([]);
    onSaved(); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Crear capacitación</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {PASOS.map(({ label, Icon }, i) => (
            <button key={label} type="button" onClick={() => f.nombre && setPaso(i)} className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium ${paso === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {paso === 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div><Label>Nombre de la capacitación *</Label><Input value={f.nombre || ""} onChange={(e) => set("nombre", e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Caducidad</Label><Input type="date" value={f.fecha_caducidad || ""} onChange={(e) => set("fecha_caducidad", e.target.value)} /></div>
                <div><Label>N° intentos</Label><Input type="number" value={f.intentos} onChange={(e) => set("intentos", +e.target.value)} /></div>
                <div><Label>Duración (min)</Label><Input type="number" value={f.duracion_min} onChange={(e) => set("duracion_min", +e.target.value)} /></div>
              </div>
              <div><Label>Tipo</Label>
                <Select value={f.tipo} onValueChange={(v) => set("tipo", v)}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TIPOS_CAP).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Descripción</Label><Textarea value={f.descripcion || ""} onChange={(e) => set("descripcion", e.target.value)} /></div>
            </div>
            <AsignarPersonas seleccion={personas} onChange={setPersonas} />
          </div>
        )}

        {paso === 1 && (
          <RecursosEditor recursos={recursos} onChange={setRecursos} />
        )}

        {paso === 2 && (
          <div className="space-y-3">
            <div className="w-48"><Label>% mínimo para aprobar</Label><Input type="number" value={f.porcentaje_aprobacion} onChange={(e) => set("porcentaje_aprobacion", +e.target.value)} /></div>
            <GenerarPreguntas form={f} recursos={recursos} onGeneradas={(g) => setPreguntas([...preguntas, ...g])} />
            <PreguntasEditor preguntas={preguntas} onChange={setPreguntas} />
          </div>
        )}

        <div className="flex justify-between border-t pt-3">
          <Button variant="outline" disabled={paso === 0} onClick={() => setPaso(paso - 1)}>Anterior</Button>
          {paso < 2
            ? <Button disabled={!f.nombre} onClick={() => setPaso(paso + 1)}>Siguiente</Button>
            : <Button disabled={saving || !preguntas.length} onClick={guardar}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}Publicar capacitación</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}