import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";

const TIPOS = [
  { value: "equipo_completo", label: "Equipo Completo" },
  { value: "salud", label: "Equipo de Salud" },
  { value: "cuidado", label: "Equipo de Cuidado" },
  { value: "administracion", label: "Administración" },
  { value: "pastoral", label: "Pastoral" },
  { value: "directiva", label: "Reunión Directiva" },
  { value: "otra", label: "Otra" },
];

const EMPTY = {
  titulo: "",
  fecha: format(new Date(), "yyyy-MM-dd"),
  hora_inicio: "",
  hora_termino: "",
  lugar: "Sala de reuniones",
  tipo: "equipo_completo",
  convocante: "",
  acuerdos: "",
  observaciones: "",
  proxima_reunion: "",
};

export default function ActaFormDialog({ open, onClose, onSubmit, acta, user }) {
  const [form, setForm] = useState(EMPTY);
  const [participantes, setParticipantes] = useState([""]);
  const [ordenDia, setOrdenDia] = useState([""]);

  useEffect(() => {
    if (acta) {
      setForm({
        titulo: acta.titulo || "",
        fecha: acta.fecha || format(new Date(), "yyyy-MM-dd"),
        hora_inicio: acta.hora_inicio || "",
        hora_termino: acta.hora_termino || "",
        lugar: acta.lugar || "",
        tipo: acta.tipo || "equipo_completo",
        convocante: acta.convocante || "",
        acuerdos: acta.acuerdos || "",
        observaciones: acta.observaciones || "",
        proxima_reunion: acta.proxima_reunion || "",
      });
      setParticipantes(acta.participantes ? JSON.parse(acta.participantes) : [""]);
      setOrdenDia(acta.orden_del_dia ? JSON.parse(acta.orden_del_dia) : [""]);
    } else {
      setForm({ ...EMPTY, convocante: user?.full_name || "" });
      setParticipantes([""]);
      setOrdenDia([""]);
    }
  }, [acta, user, open]);

  const f = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleListChange = (list, setList, idx, val) => {
    const next = [...list];
    next[idx] = val;
    setList(next);
  };

  const addItem = (list, setList) => setList([...list, ""]);
  const removeItem = (list, setList, idx) => setList(list.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      participantes: JSON.stringify(participantes.filter(p => p.trim())),
      orden_del_dia: JSON.stringify(ordenDia.filter(o => o.trim())),
      autor_email: user?.email || "",
      autor_nombre: user?.full_name || user?.email || "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{acta ? "Editar Acta" : "Nueva Acta de Reunión"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Datos generales */}
          <div className="space-y-3">
            <div>
              <Label>Título de la reunión <span className="text-destructive">*</span></Label>
              <Input value={form.titulo} onChange={f("titulo")} placeholder="Ej: Reunión mensual de equipo" required className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.fecha} onChange={f("fecha")} required className="mt-1" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hora inicio</Label>
                <Input type="time" value={form.hora_inicio} onChange={f("hora_inicio")} className="mt-1" />
              </div>
              <div>
                <Label>Hora término</Label>
                <Input type="time" value={form.hora_termino} onChange={f("hora_termino")} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lugar</Label>
                <Input value={form.lugar} onChange={f("lugar")} className="mt-1" />
              </div>
              <div>
                <Label>Convocante / Quien dirige</Label>
                <Input value={form.convocante} onChange={f("convocante")} className="mt-1" />
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div>
            <Label className="mb-2 block">Participantes</Label>
            <div className="space-y-2">
              {participantes.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={p}
                    onChange={e => handleListChange(participantes, setParticipantes, i, e.target.value)}
                    placeholder={`Participante ${i + 1}`}
                    className="flex-1"
                  />
                  {participantes.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => removeItem(participantes, setParticipantes, i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addItem(participantes, setParticipantes)}>
                <Plus className="w-3 h-3 mr-1" /> Agregar participante
              </Button>
            </div>
          </div>

          {/* Orden del día */}
          <div>
            <Label className="mb-2 block">Orden del día</Label>
            <div className="space-y-2">
              {ordenDia.map((o, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-xs text-muted-foreground mt-2.5 w-5 shrink-0">{i + 1}.</span>
                  <Input
                    value={o}
                    onChange={e => handleListChange(ordenDia, setOrdenDia, i, e.target.value)}
                    placeholder={`Punto ${i + 1}`}
                    className="flex-1"
                  />
                  {ordenDia.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" onClick={() => removeItem(ordenDia, setOrdenDia, i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addItem(ordenDia, setOrdenDia)}>
                <Plus className="w-3 h-3 mr-1" /> Agregar punto
              </Button>
            </div>
          </div>

          {/* Acuerdos */}
          <div>
            <Label>Acuerdos y compromisos</Label>
            <Textarea value={form.acuerdos} onChange={f("acuerdos")} rows={4} placeholder="Detalla los acuerdos tomados durante la reunión..." className="mt-1" />
          </div>

          {/* Observaciones y próxima */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Observaciones generales</Label>
              <Textarea value={form.observaciones} onChange={f("observaciones")} rows={2} className="mt-1" />
            </div>
            <div>
              <Label>Próxima reunión (fecha sugerida)</Label>
              <Input type="date" value={form.proxima_reunion} onChange={f("proxima_reunion")} className="mt-1" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar acta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}