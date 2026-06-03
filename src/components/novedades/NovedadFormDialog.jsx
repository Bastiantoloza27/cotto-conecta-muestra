import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const TIPOS = ["novedad", "tutorial", "mejora", "aviso"];
const COLORES = ["purple", "blue", "green", "orange", "pink", "teal"];
const COLOR_LABELS = { purple: "Morado", blue: "Azul", green: "Verde", orange: "Naranja", pink: "Rosa", teal: "Teal" };
const COLOR_DOTS = {
  purple: "bg-purple-500", blue: "bg-blue-500", green: "bg-green-500",
  orange: "bg-orange-500", pink: "bg-pink-500", teal: "bg-teal-500"
};

const emptyPaso = () => ({ titulo: "", descripcion: "", imagen_url: "" });

export default function NovedadFormDialog({ open, novedad, onClose, onSave }) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "novedad",
    emoji: "✨",
    color: "purple",
    modulo: "",
    publicado: true,
    destacado: false,
    fecha_publicacion: format(new Date(), "yyyy-MM-dd"),
    pasos: "",
  });
  const [pasos, setPasos] = useState([]);
  const [tieneTutorial, setTieneTutorial] = useState(false);

  useEffect(() => {
    if (novedad) {
      setForm({
        titulo: novedad.titulo || "",
        descripcion: novedad.descripcion || "",
        tipo: novedad.tipo || "novedad",
        emoji: novedad.emoji || "✨",
        color: novedad.color || "purple",
        modulo: novedad.modulo || "",
        publicado: novedad.publicado !== false,
        destacado: novedad.destacado || false,
        fecha_publicacion: novedad.fecha_publicacion || format(new Date(), "yyyy-MM-dd"),
        pasos: novedad.pasos || "",
      });
      if (novedad.pasos) {
        try { setPasos(JSON.parse(novedad.pasos)); setTieneTutorial(true); } catch { setPasos([]); }
      }
    }
  }, [novedad]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("El título es obligatorio"); return; }
    if (!form.descripcion.trim()) { toast.error("La descripción es obligatoria"); return; }
    const data = {
      ...form,
      pasos: tieneTutorial && pasos.length > 0 ? JSON.stringify(pasos) : "",
    };
    await onSave(data, novedad?.id);
    onClose();
  };

  const updatePaso = (i, k, v) => {
    setPasos(prev => prev.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {novedad ? "Editar publicación" : "Nueva publicación"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Básico */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <Label className="text-xs font-semibold">Título *</Label>
              <Input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ej: Nueva pestaña de Intervenciones Profesionales" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs font-semibold">Descripción *</Label>
              <Textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)} placeholder="Explica brevemente qué cambió o qué se puede hacer ahora..." className="min-h-[80px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Módulo / sección</Label>
              <Input value={form.modulo} onChange={e => set("modulo", e.target.value)} placeholder="Ej: Registro de Salud" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Emoji</Label>
              <Input value={form.emoji} onChange={e => set("emoji", e.target.value)} placeholder="✨" maxLength={4} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Color</Label>
              <Select value={form.color} onValueChange={v => set("color", v)}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${COLOR_DOTS[form.color]}`} />
                    <span>{COLOR_LABELS[form.color]}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {COLORES.map(c => (
                    <SelectItem key={c} value={c}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${COLOR_DOTS[c]}`} />
                        {COLOR_LABELS[c]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Fecha</Label>
              <Input type="date" value={form.fecha_publicacion} onChange={e => set("fecha_publicacion", e.target.value)} />
            </div>
          </div>

          {/* Switches */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.publicado} onCheckedChange={v => set("publicado", v)} id="pub" />
              <Label htmlFor="pub" className="text-sm">Publicado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.destacado} onCheckedChange={v => set("destacado", v)} id="dest" />
              <Label htmlFor="dest" className="text-sm">Destacado ⭐</Label>
            </div>
          </div>

          {/* Tutorial */}
          <div className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={tieneTutorial} onCheckedChange={v => { setTieneTutorial(v); if (v && pasos.length === 0) setPasos([emptyPaso()]); }} id="tut" />
              <Label htmlFor="tut" className="text-sm font-semibold">Incluir tutorial paso a paso</Label>
            </div>

            {tieneTutorial && (
              <div className="space-y-3">
                {pasos.map((p, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/30 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Paso {i + 1}</span>
                      {pasos.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setPasos(prev => prev.filter((_, idx) => idx !== i))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <Input placeholder="Título del paso" value={p.titulo} onChange={e => updatePaso(i, "titulo", e.target.value)} />
                    <Textarea placeholder="Descripción del paso..." value={p.descripcion} onChange={e => updatePaso(i, "descripcion", e.target.value)} className="min-h-[60px]" />
                    <Input placeholder="URL de imagen (opcional)" value={p.imagen_url} onChange={e => updatePaso(i, "imagen_url", e.target.value)} />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setPasos(prev => [...prev, emptyPaso()])}>
                  <Plus className="w-3.5 h-3.5" /> Agregar paso
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave}>
              {novedad ? "Guardar cambios" : "Publicar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}