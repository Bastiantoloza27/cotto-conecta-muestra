import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Utensils } from "lucide-react";
import { toast } from "sonner";

const PORCIONES = [
  { valor: "0",       emoji: "🍽️",  label: "Nada",       desc: "0%",  color: "border-slate-300 bg-slate-50 text-slate-500" },
  { valor: "1/4",     emoji: "🥣",  label: "¼ plato",    desc: "25%", color: "border-orange-300 bg-orange-50 text-orange-700" },
  { valor: "1/2",     emoji: "🥗",  label: "½ plato",    desc: "50%", color: "border-amber-300 bg-amber-50 text-amber-700" },
  { valor: "3/4",     emoji: "🍲",  label: "¾ plato",    desc: "75%", color: "border-green-300 bg-green-50 text-green-700" },
  { valor: "completo",emoji: "✅",  label: "Completo",   desc: "100%",color: "border-green-500 bg-green-100 text-green-800" },
];

const HIDRATACION = [
  { valor: "ninguna",  emoji: "🚫", label: "Ninguna",  color: "border-red-300 bg-red-50 text-red-700" },
  { valor: "poca",     emoji: "💧", label: "Poca",     color: "border-orange-300 bg-orange-50 text-orange-700" },
  { valor: "adecuada", emoji: "💦", label: "Adecuada", color: "border-blue-300 bg-blue-50 text-blue-700" },
  { valor: "buena",    emoji: "🌊", label: "Buena",    color: "border-cyan-400 bg-cyan-50 text-cyan-800" },
];

const TIPO_COMIDA = [
  { valor: "desayuno",          emoji: "🌅", label: "Desayuno" },
  { valor: "colacion_manana",   emoji: "🍎", label: "Colación" },
  { valor: "almuerzo",          emoji: "☀️", label: "Almuerzo" },
  { valor: "once",              emoji: "🍵", label: "Once" },
  { valor: "cena",              emoji: "🌙", label: "Cena" },
  { valor: "colacion_nocturna", emoji: "🌛", label: "Colación Nocturna" },
];

// Componente visual del plato interactivo
function PlatoVisual({ porcion, onChange }) {
  const idx = PORCIONES.findIndex(p => p.valor === porcion);

  // SVG del plato con segmentos
  const segments = [
    { id: "1/4",    path: "M 100,100 L 100,20 A 80,80 0 0,1 180,100 Z",        fill: "#f97316" },
    { id: "1/2",    path: "M 100,100 L 180,100 A 80,80 0 0,1 100,180 Z",       fill: "#eab308" },
    { id: "3/4",    path: "M 100,100 L 100,180 A 80,80 0 0,1 20,100 Z",        fill: "#22c55e" },
    { id: "completo",path:"M 100,100 L 20,100 A 80,80 0 0,1 100,20 Z",         fill: "#16a34a" },
  ];

  const getSegmentFill = (segId) => {
    const porciones = ["1/4","1/2","3/4","completo"];
    const selIdx = porciones.indexOf(porcion);
    const segIdx = porciones.indexOf(segId);
    if (porcion === "0") return "#e5e7eb";
    if (selIdx >= segIdx) return segments.find(s=>s.id===segId).fill;
    return "#f3f4f6";
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-md">
          {/* Fondo plato */}
          <circle cx="100" cy="100" r="88" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
          {/* Borde exterior decorativo */}
          <circle cx="100" cy="100" r="88" fill="none" stroke="#e2e8f0" strokeWidth="6" />

          {/* Segmentos del plato */}
          {segments.map(seg => (
            <path
              key={seg.id}
              d={seg.path}
              fill={getSegmentFill(seg.id)}
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200 hover:opacity-80"
              onClick={() => {
                // Al hacer click en un segmento, selecciona esa porción o la desmarca
                if (porcion === seg.id) onChange("0");
                else onChange(seg.id);
              }}
            />
          ))}

          {/* Centro del plato */}
          <circle
            cx="100" cy="100" r="18"
            fill={porcion === "0" ? "#e5e7eb" : "#dcfce7"}
            stroke="white" strokeWidth="2"
            className="cursor-pointer"
            onClick={() => onChange("0")}
          />
          {/* Texto central */}
          <text x="100" y="96" textAnchor="middle" fontSize="10" fill="#6b7280" fontWeight="600">
            {porcion === "completo" ? "✓" : porcion === "0" ? "—" : porcion}
          </text>
          <text x="100" y="108" textAnchor="middle" fontSize="8" fill="#9ca3af">
            {PORCIONES.find(p=>p.valor===porcion)?.desc || ""}
          </text>

          {/* Etiquetas de cuartos */}
          <text x="140" y="65" textAnchor="middle" fontSize="9" fill="#9ca3af">¼</text>
          <text x="155" y="125" textAnchor="middle" fontSize="9" fill="#9ca3af">½</text>
          <text x="60" y="155" textAnchor="middle" fontSize="9" fill="#9ca3af">¾</text>
          <text x="45" y="75" textAnchor="middle" fontSize="9" fill="#9ca3af">1</text>
        </svg>
      </div>

      {/* Botones rápidos debajo del plato */}
      <div className="flex gap-2 flex-wrap justify-center">
        {PORCIONES.map(p => (
          <button
            key={p.valor}
            type="button"
            onClick={() => onChange(p.valor)}
            className={`px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${
              porcion === p.valor ? p.color + " scale-105 shadow-sm" : "border-border bg-white text-muted-foreground hover:border-primary/40"
            }`}
          >
            {p.emoji} {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DialogIngesta({ open, onClose, resident, turno, tipoComida, registro, date, onSave }) {
  const [form, setForm] = useState({
    porcion_consumida: registro?.porcion_consumida || null,
    gramos_consumidos: registro?.gramos_consumidos || "",
    hidratacion: registro?.hidratacion || null,
    encargada: registro?.encargada || "",
    observaciones: registro?.observaciones || "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.porcion_consumida) { toast.error("Selecciona la porción consumida"); return; }
    await onSave(form, registro?.id);
    onClose();
  };

  const turnoInfo = { manana: { icon: "🌅", label: "Mañana" }, tarde: { icon: "🌤️", label: "Tarde" }, noche: { icon: "🌙", label: "Noche" } }[turno];
  const comidaInfo = TIPO_COMIDA.find(t => t.valor === tipoComida);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Utensils className="w-5 h-5 text-primary" />
            Control de Ingesta — {resident?.preferred_name || resident?.full_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {comidaInfo?.emoji} {comidaInfo?.label} · {turnoInfo?.icon} {turnoInfo?.label} · {format(parseISO(date), "dd MMMM yyyy", { locale: es })}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-1">
          {/* Plato visual interactivo */}
          <div>
            <Label className="text-sm font-semibold mb-3 block text-center">¿Cuánto consumió? — Toca el plato</Label>
            <PlatoVisual
              porcion={form.porcion_consumida || "0"}
              onChange={(v) => set("porcion_consumida", v)}
            />
          </div>

          {/* Gramos (opcional) */}
          <div className="bg-muted/40 rounded-xl p-3">
            <Label className="text-sm font-semibold mb-1 block">
              ⚖️ Gramos consumidos <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
              type="number"
              min="0"
              max="2000"
              value={form.gramos_consumidos ?? ""}
              onChange={e => set("gramos_consumidos", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="ej: 150"
              className="text-center max-w-[120px]"
              />
              <span className="text-sm text-muted-foreground">gramos</span>
            </div>
          </div>

          {/* Hidratación */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">💧 Hidratación</Label>
            <div className="grid grid-cols-2 gap-2">
              {HIDRATACION.map(h => (
                <button
                  key={h.valor}
                  type="button"
                  onClick={() => set("hidratacion", h.valor)}
                  className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    form.hidratacion === h.valor
                      ? h.color + " shadow-sm scale-[1.02]"
                      : "border-border bg-white text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {h.emoji} {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Encargada */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold">👤 Encargada del turno</Label>
            <Input value={form.encargada} onChange={e => set("encargada", e.target.value)} placeholder="Nombre de la encargada" />
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold">📝 Observaciones <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
            <textarea
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              rows={3}
              value={form.observaciones}
              onChange={e => set("observaciones", e.target.value)}
              placeholder="Dificultad para tragar, preferencias, conducta durante la comida..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave}>Guardar registro</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}