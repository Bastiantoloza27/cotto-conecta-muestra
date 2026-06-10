import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const shiftTypeLabels = { manana: "Mañana", tarde: "Tarde", noche: "Noche", largo: "Largo" };
import { format, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Clock, ChevronLeft, ChevronRight, Pencil, Trash2, FileDown } from "lucide-react";
import InformeTurnosImprimible from "@/components/informes/InformeTurnosImprimible";
import { printReport } from "@/lib/printReport";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import TurnoCuidadoras from "@/components/turnos/TurnoCuidadoras";
import TurnoTens from "@/components/turnos/TurnoTens";

const sendShiftEmail = async (shiftData, staffMembers) => {
  const member = staffMembers.find(s => s.full_name === shiftData.staff_name);
  if (!member?.email) return;
  const horario = shiftData.hora_inicio
    ? `${shiftData.hora_inicio}${shiftData.hora_fin ? ` – ${shiftData.hora_fin}` : ""}`
    : shiftTypeLabels[shiftData.shift_type] || shiftData.shift_type;
  await base44.integrations.Core.SendEmail({
    to: member.email,
    subject: `📋 Se te ha asignado un turno – ${shiftData.date}`,
    body: `Hola ${shiftData.staff_name},\n\nEl Director ha registrado un turno a tu nombre:\n\n• Fecha: ${shiftData.date}\n• Turno: ${shiftTypeLabels[shiftData.shift_type] || shiftData.shift_type}\n• Horario: ${horario}\n• Área: ${shiftData.area || "—"}\n\nSi tienes dudas, comunícate con la administración.\n\nSaludos,\nPequeño Cottolengo Quintero`,
  });
};

const shiftColors = {
  manana: "bg-amber-50 text-amber-700 border-amber-200",
  tarde: "bg-blue-50 text-blue-700 border-blue-200",
  noche: "bg-indigo-50 text-indigo-700 border-indigo-200",
  largo: "bg-purple-50 text-purple-700 border-purple-200",
};

const statusEmojis = { programado: "📋", presente: "✅", ausente: "❌", reemplazo: "🔄", licencia: "🏥" };

export default function Shifts() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    staff_name: "", date: format(new Date(), "yyyy-MM-dd"),
    shift_type: "manana", area: "", status: "programado", notes: "",
    hora_inicio: "", hora_fin: "",
  });
  const queryClient = useQueryClient();

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: shifts = [] } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => base44.entities.StaffShift.list("-date", 200),
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-members-activos"],
    queryFn: () => base44.entities.StaffMember.filter({ status: "activo" }, "full_name", 200),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const shift = await base44.entities.StaffShift.create(data);
      await sendShiftEmail(data, staffMembers);
      return shift;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffShift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StaffShift.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const getShiftsForDay = (date) => {
    const d = format(date, "yyyy-MM-dd");
    return shifts.filter((s) => s.date === d);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Turnos y Personal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Calendario de turnos y gestión del equipo</p>
      </div>

      <Tabs defaultValue="profesionales">
        <TabsList className="mb-6">
          <TabsTrigger value="profesionales">🩺 Profesionales de Salud</TabsTrigger>
          <TabsTrigger value="cuidadoras">🤝 Cuidadoras</TabsTrigger>
          <TabsTrigger value="tens">💉 TENS</TabsTrigger>
        </TabsList>

        {/* ---- TAB PROFESIONALES ---- */}
        <TabsContent value="profesionales">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">
                {format(weekStart, "d MMM", { locale: es })} – {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
              </span>
              <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                Hoy
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => printReport(
                <InformeTurnosImprimible shifts={shifts.filter(s => days.some(d => format(d, "yyyy-MM-dd") === s.date))} weekStart={weekStart} days={days} />,
                "Cuadro de Turnos"
              )}>
                <FileDown className="w-4 h-4" /> Cuadro semanal
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" /> Asignar turno
              </Button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {days.map((day) => {
              const dayShifts = getShiftsForDay(day);
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              return (
                <Card key={day.toString()} className={`p-3 min-h-[120px] ${isToday ? "ring-2 ring-primary/30" : ""}`}>
                  <p className={`text-xs font-medium mb-2 ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE d", { locale: es })}
                  </p>
                  <div className="space-y-1">
                    {dayShifts.map((s) => (
                      <div key={s.id} className={`text-[11px] p-1.5 rounded border ${shiftColors[s.shift_type] || "bg-muted"} group relative`}>
                        <span className="mr-1">{statusEmojis[s.status] || ""}</span>
                        <span className="font-medium">{s.staff_name}</span>
                        <span className="block text-[10px] opacity-75 capitalize">
                          {s.shift_type}{s.hora_inicio && ` · ${s.hora_inicio}${s.hora_fin ? `–${s.hora_fin}` : ""}`}
                          {s.area && ` · ${s.area}`}
                        </span>
                        <div className="absolute top-0.5 right-0.5 hidden group-hover:flex gap-0.5">
                          <button onClick={() => setEditing(s)} className="p-0.5 rounded bg-white/70 hover:bg-white"><Pencil className="w-2.5 h-2.5" /></button>
                          <button onClick={() => { if (confirm("¿Eliminar turno?")) deleteMutation.mutate(s.id); }} className="p-0.5 rounded bg-white/70 hover:bg-white text-destructive"><Trash2 className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ---- TAB CUIDADORAS ---- */}
        <TabsContent value="cuidadoras">
          <TurnoCuidadoras />
        </TabsContent>

        {/* ---- TAB TENS ---- */}
        <TabsContent value="tens">
          <TurnoTens />
        </TabsContent>
      </Tabs>

      {editing && (
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>✏️ Editar turno</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ id: editing.id, data: editing }); }} className="space-y-4 mt-2">
              <div>
                <Label>Trabajador *</Label>
                <Select
                  value={editing.staff_name}
                  onValueChange={(v) => {
                    const member = staffMembers.find(s => s.full_name === v);
                    setEditing(p => ({ ...p, staff_name: v, staff_email: member?.email || p.staff_email, area: member?.area || p.area }));
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar personal..." /></SelectTrigger>
                  <SelectContent>
                    {staffMembers.map(s => (
                      <SelectItem key={s.id} value={s.full_name}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fecha</Label><Input type="date" value={editing.date} onChange={(e) => setEditing(p => ({ ...p, date: e.target.value }))} /></div>
                <div><Label>Turno</Label>
                  <Select value={editing.shift_type} onValueChange={(v) => setEditing(p => ({ ...p, shift_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manana">Mañana</SelectItem>
                      <SelectItem value="tarde">Tarde</SelectItem>
                      <SelectItem value="noche">Noche</SelectItem>
                      <SelectItem value="largo">Largo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Estado</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="presente">Presente</SelectItem>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="reemplazo">Reemplazo</SelectItem>
                    <SelectItem value="licencia">Licencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Hora inicio</Label><Input type="time" value={editing.hora_inicio || ""} onChange={(e) => setEditing(p => ({ ...p, hora_inicio: e.target.value }))} /></div>
                <div><Label>Hora fin</Label><Input type="time" value={editing.hora_fin || ""} onChange={(e) => setEditing(p => ({ ...p, hora_fin: e.target.value }))} /></div>
              </div>
              <div><Label>Área</Label><Input value={editing.area || ""} onChange={(e) => setEditing(p => ({ ...p, area: e.target.value }))} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Guardando..." : "Actualizar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>📋 Asignar turno</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 mt-2">
            <div>
              <Label>Trabajador *</Label>
              <Select
                value={form.staff_name}
                onValueChange={(v) => {
                  const member = staffMembers.find(s => s.full_name === v);
                  setForm(p => ({ ...p, staff_name: v, staff_email: member?.email || "", area: member?.area || p.area }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar personal..." /></SelectTrigger>
                <SelectContent>
                  {staffMembers.map(s => (
                    <SelectItem key={s.id} value={s.full_name}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div>
                <Label>Turno</Label>
                <Select value={form.shift_type} onValueChange={(v) => set("shift_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manana">Mañana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noche">Noche</SelectItem>
                    <SelectItem value="largo">Largo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora inicio</Label>
                <Input type="time" value={form.hora_inicio} onChange={(e) => set("hora_inicio", e.target.value)} />
              </div>
              <div>
                <Label>Hora fin</Label>
                <Input type="time" value={form.hora_fin} onChange={(e) => set("hora_fin", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Área</Label>
              <Input value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="Ej: Pabellón 1" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Asignar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}