import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Simbología oficial de cuidadoras
const TURNO_CONFIG = {
  TL1:   { label: "TL1", desc: "Encargado/a turno 08:30–20:00", hora_inicio: "08:30", hora_fin: "20:00", bg: "bg-green-200 text-green-900", border: "border-green-400" },
  TL2:   { label: "TL2", desc: "Turno largo 08:00–19:30",       hora_inicio: "08:00", hora_fin: "19:30", bg: "bg-teal-200 text-teal-900",  border: "border-teal-400" },
  N1:    { label: "N1",  desc: "Noche 20:00–07:30",             hora_inicio: "20:00", hora_fin: "07:30", bg: "bg-indigo-200 text-indigo-900", border: "border-indigo-400" },
  N2:    { label: "N2",  desc: "Noche 20:30–20:30",             hora_inicio: "20:30", hora_fin: "20:30", bg: "bg-violet-200 text-violet-900", border: "border-violet-400" },
  N:     { label: "N",   desc: "Noche",                         hora_inicio: "20:00", hora_fin: "07:30", bg: "bg-blue-200 text-blue-900", border: "border-blue-400" },
  V:     { label: "V",   desc: "Vacaciones",                    hora_inicio: "",      hora_fin: "",      bg: "bg-orange-200 text-orange-900", border: "border-orange-400" },
  LIBRE: { label: "LIBRE", desc: "Libre / descanso",            hora_inicio: "",      hora_fin: "",      bg: "bg-gray-100 text-gray-500", border: "border-gray-200" },
};

// Cuidadoras del turno Mayo 2026 (extraídas del PDF)
const CUIDADORAS_DEFAULT = [
  "Jeniffer",
  "Valeria",
  "Francisca A.",
  "Andrea",
  "Nadia",
  "Judith",
  "Andrés",
  "Monserrat",
  "Marjorie",
];

function TurnoCell({ turno, onEdit, onDelete }) {
  const cfg = TURNO_CONFIG[turno?.shift_type] || TURNO_CONFIG["LIBRE"];
  if (!turno) return <td className="border border-gray-200 px-1 py-0.5 text-center min-w-[42px]"><span className="text-[10px] text-gray-300">—</span></td>;

  return (
    <td className="border border-gray-200 px-0.5 py-0.5 text-center min-w-[42px]">
      <div className={`group relative rounded px-1 py-0.5 text-[11px] font-semibold border ${cfg.bg} ${cfg.border} cursor-pointer`}>
        {cfg.label}
        <div className="absolute inset-0 hidden group-hover:flex items-center justify-center gap-0.5 bg-white/80 rounded">
          <button onClick={() => onEdit(turno)} className="p-0.5 hover:text-primary"><Pencil className="w-2.5 h-2.5" /></button>
          <button onClick={() => onDelete(turno)} className="p-0.5 hover:text-destructive"><Trash2 className="w-2.5 h-2.5" /></button>
        </div>
      </div>
    </td>
  );
}

export default function TurnoCuidadoras() {
  const [monthDate, setMonthDate] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ staff_name: "", date: "", shift_type: "TL1", notes: "" });
  const queryClient = useQueryClient();

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const monthKey = format(monthDate, "yyyy-MM");
  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts-cuidadoras", monthKey],
    queryFn: async () => {
      const from = format(monthStart, "yyyy-MM-dd");
      const to = format(monthEnd, "yyyy-MM-dd");
      // Traer directamente con filtro de rango de fechas y grupo
      const page1 = await base44.entities.StaffShift.filter({ grupo_turno: "cuidadoras" }, "date", 500);
      const page2 = await base44.entities.StaffShift.filter({ grupo_turno: "cuidadoras" }, "-date", 500);
      // Unir ambas páginas y deduplicar por id
      const seen = new Set();
      const all = [];
      for (const s of [...page1, ...page2]) {
        if (!seen.has(s.id)) { seen.add(s.id); all.push(s); }
      }
      return all.filter(s => s.date >= from && s.date <= to);
    },
  });

  // Obtener nombres únicos de cuidadoras (desde turnos + defaults)
  const nombres = [...new Set([...CUIDADORAS_DEFAULT, ...shifts.map(s => s.staff_name)])].filter(Boolean);

  // Mapa: nombre -> fecha -> turno
  const turnoMap = {};
  for (const s of shifts) {
    if (!turnoMap[s.staff_name]) turnoMap[s.staff_name] = {};
    turnoMap[s.staff_name][s.date] = s;
  }

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffShift.create({ ...data, grupo_turno: "cuidadoras" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts-cuidadoras"] }); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffShift.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shifts-cuidadoras"] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StaffShift.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts-cuidadoras"] }),
  });

  const resetForm = () => setForm({ staff_name: "", date: format(new Date(), "yyyy-MM-dd"), shift_type: "TL1", notes: "" });

  const handleDelete = (turno) => {
    if (confirm(`¿Eliminar turno ${turno.shift_type} de ${turno.staff_name} el ${turno.date}?`)) {
      deleteMutation.mutate(turno.id);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-base font-semibold capitalize min-w-[140px] text-center">
            {format(monthDate, "MMMM yyyy", { locale: es })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Agregar turno
        </Button>
      </div>

      {/* Simbología */}
      <div className="flex flex-wrap gap-2 mb-4">
        {Object.entries(TURNO_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${cfg.bg} ${cfg.border}`}>
            <span className="font-bold">{cfg.label}</span>
            <span className="opacity-70 font-normal hidden sm:inline">— {cfg.desc}</span>
          </div>
        ))}
      </div>

      {/* Cuadro mensual */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="text-xs border-collapse w-full min-w-max">
          <thead>
            <tr className="bg-muted/50">
              <th className="border border-gray-200 px-3 py-2 text-left font-semibold sticky left-0 bg-muted/80 z-10 min-w-[120px]">Nombre</th>
              {days.map(d => (
                <th key={d.toString()} className={`border border-gray-200 px-1 py-1.5 text-center min-w-[42px] ${
                  format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground"
                }`}>
                  <div className="font-medium">{format(d, "d")}</div>
                  <div className="text-[9px] capitalize opacity-60">{format(d, "EEE", { locale: es })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nombres.map((nombre, idx) => (
              <tr key={nombre} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}>
                <td className="border border-gray-200 px-3 py-1.5 font-medium sticky left-0 bg-inherit z-10 whitespace-nowrap">{nombre}</td>
                {days.map(d => {
                  const dateStr = format(d, "yyyy-MM-dd");
                  const turno = turnoMap[nombre]?.[dateStr];
                  return (
                    <TurnoCell
                      key={dateStr}
                      turno={turno}
                      onEdit={(t) => setEditing(t)}
                      onDelete={handleDelete}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario agregar */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>📋 Agregar turno cuidadora</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 mt-2">
            <div>
              <Label>Nombre *</Label>
              <Input
                value={form.staff_name}
                onChange={e => set("staff_name", e.target.value)}
                placeholder="Nombre de la cuidadora"
                list="cuidadoras-list"
              />
              <datalist id="cuidadoras-list">
                {nombres.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha *</Label>
                <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} required />
              </div>
              <div>
                <Label>Turno *</Label>
                <Select value={form.shift_type} onValueChange={v => set("shift_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TURNO_CONFIG).map(([k, c]) => (
                      <SelectItem key={k} value={k}>{c.label} — {c.desc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notas (opcional)</Label>
              <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Observación..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Formulario editar */}
      {editing && (
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>✏️ Editar turno</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editing.id, data: editing }); }} className="space-y-4 mt-2">
              <div>
                <Label>Nombre</Label>
                <Input value={editing.staff_name} onChange={e => setEditing(p => ({ ...p, staff_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={editing.date} onChange={e => setEditing(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <Label>Turno</Label>
                  <Select value={editing.shift_type} onValueChange={v => setEditing(p => ({ ...p, shift_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TURNO_CONFIG).map(([k, c]) => (
                        <SelectItem key={k} value={k}>{c.label} — {c.desc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Input value={editing.notes || ""} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Guardando..." : "Actualizar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}