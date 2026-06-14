import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ClipboardList, Activity, Plus, CheckCircle2, XCircle, AlertTriangle, Download, Stethoscope, Pencil, Trash2, EyeOff, Eye, UserPlus, Utensils, FlaskConical } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BristolScale, { BRISTOL } from "@/components/registros/BristolScale";
import AlertaDeposicion from "@/components/registros/AlertaDeposicion";
import InformeDeposicionImprimible from "@/components/registros/InformeDeposicionImprimible";
import InformeSignosVitalesImprimible from "@/components/informes/InformeSignosVitalesImprimible";
import TabIntervenciones from "@/components/intervenciones/TabIntervenciones";
import TabIngesta from "@/components/registros/TabIngesta";
import TabExamenesBioquimicos from "@/components/examenes/TabExamenesBioquimicos";
import { toast } from "sonner";
import { createRoot } from "react-dom/client";

const TURNOS = [
  { key: "manana", label: "Mañana", icon: "🌅", color: "bg-amber-50 border-amber-200" },
  { key: "tarde", label: "Tarde", icon: "🌤️", color: "bg-sky-50 border-sky-200" },
  { key: "noche", label: "Noche", icon: "🌙", color: "bg-indigo-50 border-indigo-200" },
];

function calcDiasSinDeposicion(residentId, deposiciones, fechaBase) {
  let dias = 0;
  let fecha = parseISO(fechaBase);
  while (dias < 10) {
    const dateStr = format(fecha, "yyyy-MM-dd");
    const tieneHoy = deposiciones.some(
      d => d.resident_id === residentId && d.date === dateStr && d.tuvo_deposicion
    );
    if (tieneHoy) break;
    dias++;
    fecha = subDays(fecha, 1);
  }
  return dias;
}

// ─── Tarjeta de deposición por turno ───────────────────────────────────────
function TarjetaTurno({ turno, resident, registro, onEdit, onDelete }) {
  const tieneRegistro = !!registro;
  const deposito = registro?.tuvo_deposicion;

  return (
    <div
      className={`rounded-lg border p-3 transition-all relative group ${
        tieneRegistro
          ? deposito
            ? "bg-green-50 border-green-300"
            : "bg-slate-50 border-slate-300"
          : "bg-white border-dashed border-border hover:border-primary/50 cursor-pointer hover:shadow-sm"
      }`}
      onClick={() => !tieneRegistro && onEdit(turno, registro)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">{turno.icon} {turno.label}</span>
        {tieneRegistro ? (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(turno, registro); }}
              className="p-1 rounded hover:bg-black/10 transition-colors opacity-60 hover:opacity-100"
              title="Editar"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(registro); }}
              className="p-1 rounded hover:bg-red-100 transition-colors opacity-60 hover:opacity-100 text-red-500"
              title="Eliminar"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <Plus className="w-4 h-4 text-muted-foreground/40" />
        )}
      </div>
      {tieneRegistro && deposito && (
        <div className="space-y-1">
          {registro.cantidad && (
            <Badge variant="outline" className="text-[10px] capitalize">{registro.cantidad}</Badge>
          )}
          {registro.tipo_bristol && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Bristol:</span>
              <span className="text-[10px] font-bold">{registro.tipo_bristol}</span>
              <span className="text-[10px]">{BRISTOL.find(b => b.tipo === registro.tipo_bristol)?.emoji}</span>
            </div>
          )}
          {registro.diuresis !== undefined && (
            <p className="text-[10px] text-muted-foreground">Diuresis: {registro.diuresis ? "✅ Sí" : "❌ No"}</p>
          )}
        </div>
      )}
      {tieneRegistro && !deposito && (
        <p className="text-[11px] text-muted-foreground">Sin deposición</p>
      )}
      {!tieneRegistro && (
        <p className="text-[11px] text-muted-foreground/50">Sin registrar</p>
      )}
    </div>
  );
}

// ─── Fila de residente (deposiciones) ──────────────────────────────────────
function FilaResidente({ resident, deposiciones, today, onEdit, onDelete, onHide, diasSin }) {
  const registrosPorTurno = {};
  TURNOS.forEach(t => {
    registrosPorTurno[t.key] = deposiciones.find(
      d => d.resident_id === resident.id && d.date === today && d.turno === t.key
    );
  });

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {(resident.preferred_name || resident.full_name)?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{resident.preferred_name || resident.full_name}</p>
          <p className="text-[11px] text-muted-foreground">{resident.room ? `Hab. ${resident.room}` : ""}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {diasSin >= 3 && (
            <Badge className={`text-[10px] ${
              diasSin >= 6 ? "bg-red-500" : diasSin >= 5 ? "bg-orange-500" : "bg-amber-500"
            } text-white border-0`}>
              {diasSin}d sin dep.
            </Badge>
          )}
          <button
            onClick={() => onHide(resident.id)}
            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Ocultar de esta lista"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {diasSin >= 3 && (
        <div className="mb-3">
          <AlertaDeposicion diasSinDeposicion={diasSin} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {TURNOS.map(turno => (
          <TarjetaTurno
            key={turno.key}
            turno={turno}
            resident={resident}
            registro={registrosPorTurno[turno.key]}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </Card>
  );
}

// ─── Dialog registro deposición ────────────────────────────────────────────
function DialogDeposicion({ open, onClose, resident, turno, registro, date, onSave }) {
  const [form, setForm] = useState({
    tuvo_deposicion: registro?.tuvo_deposicion ?? null,
    cantidad: registro?.cantidad || "",
    tipo_bristol: registro?.tipo_bristol || null,
    diuresis: registro?.diuresis ?? null,
    encargada: registro?.encargada || "",
    observaciones: registro?.observaciones || "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (form.tuvo_deposicion === null) { toast.error("Indica si hubo deposición"); return; }
    await onSave(form, registro?.id);
    onClose();
  };

  const turnoInfo = TURNOS.find(t => t.key === turno);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="w-5 h-5 text-primary" />
            Deposición — {resident?.preferred_name || resident?.full_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {turnoInfo?.icon} {turnoInfo?.label} · {format(parseISO(date), "dd MMMM yyyy", { locale: es })}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {/* ¿Hubo deposición? */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">¿Hubo deposición?</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => set("tuvo_deposicion", true)}
                className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  form.tuvo_deposicion === true
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "border-border hover:border-green-300"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" /> Sí
              </button>
              <button
                type="button"
                onClick={() => { set("tuvo_deposicion", false); set("cantidad", ""); set("tipo_bristol", null); }}
                className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  form.tuvo_deposicion === false
                    ? "bg-red-50 border-red-400 text-red-700"
                    : "border-border hover:border-red-300"
                }`}
              >
                <XCircle className="w-4 h-4" /> No
              </button>
            </div>
          </div>

          {/* Si hubo deposición */}
          {form.tuvo_deposicion === true && (
            <>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Cantidad</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["mancha", "poco", "mucho"].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("cantidad", c)}
                      className={`p-2.5 rounded-lg border-2 text-sm font-medium capitalize transition-all ${
                        form.cantidad === c
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Escala de Bristol</Label>
                <BristolScale value={form.tipo_bristol} onChange={v => set("tipo_bristol", v)} />
                {form.tipo_bristol && (
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    {BRISTOL.find(b => b.tipo === form.tipo_bristol)?.desc}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Diuresis */}
          {form.tuvo_deposicion !== null && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Diuresis (orina)</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => set("diuresis", true)}
                  className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.diuresis === true ? "bg-blue-50 border-blue-400 text-blue-700" : "border-border hover:border-blue-300"
                  }`}
                >
                  ✅ Sí
                </button>
                <button
                  type="button"
                  onClick={() => set("diuresis", false)}
                  className={`p-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.diuresis === false ? "bg-slate-100 border-slate-400 text-slate-700" : "border-border hover:border-slate-300"
                  }`}
                >
                  ❌ No
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Encargada del turno</Label>
            <Input value={form.encargada} onChange={e => set("encargada", e.target.value)} placeholder="Nombre de la encargada" />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-semibold">Observaciones <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Notas adicionales..." />
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

// ─── Dialog signos vitales ─────────────────────────────────────────────────
function DialogSignosVitales({ open, onClose, resident, registro, date, onSave }) {
  const [form, setForm] = useState({
    pa_sistolica: registro?.pa_sistolica || "",
    pa_diastolica: registro?.pa_diastolica || "",
    saturacion: registro?.saturacion || "",
    temperatura: registro?.temperatura || "",
    frecuencia_cardiaca: registro?.frecuencia_cardiaca || "",
    encargada: registro?.encargada || "",
    observaciones: registro?.observaciones || "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const getAlerta = () => {
    const alertas = [];
    if (form.saturacion && form.saturacion < 90) alertas.push("⚠️ Saturación muy baja (<90%)");
    if (form.temperatura && form.temperatura > 38) alertas.push("⚠️ Fiebre (>38°C)");
    if (form.temperatura && form.temperatura < 35) alertas.push("⚠️ Hipotermia (<35°C)");
    if (form.pa_sistolica && form.pa_sistolica > 160) alertas.push("⚠️ PA alta (>160)");
    if (form.pa_sistolica && form.pa_sistolica < 90) alertas.push("⚠️ PA baja (<90)");
    return alertas;
  };

  const alertas = getAlerta();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Activity className="w-5 h-5 text-primary" />
            Signos Vitales — {resident?.preferred_name || resident?.full_name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{format(parseISO(date), "dd MMMM yyyy", { locale: es })}</p>
        </DialogHeader>

        {alertas.length > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-3 space-y-1">
            {alertas.map((a, i) => <p key={i} className="text-sm text-red-700 font-medium">{a}</p>)}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Presión Arterial</Label>
            <div className="flex items-center gap-2">
              <Input type="number" value={form.pa_sistolica} onChange={e => set("pa_sistolica", e.target.value)} placeholder="Sistólica" className="text-center" />
              <span className="text-muted-foreground font-bold">/</span>
              <Input type="number" value={form.pa_diastolica} onChange={e => set("pa_diastolica", e.target.value)} placeholder="Diastólica" className="text-center" />
              <span className="text-xs text-muted-foreground">mmHg</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saturación O₂</Label>
            <div className="flex items-center gap-1">
              <Input type="number" value={form.saturacion} onChange={e => set("saturacion", e.target.value)} placeholder="98" className={`text-center ${form.saturacion && form.saturacion < 90 ? "border-red-400 bg-red-50" : ""}`} />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Temperatura</Label>
            <div className="flex items-center gap-1">
              <Input type="number" step="0.1" value={form.temperatura} onChange={e => set("temperatura", e.target.value)} placeholder="36.5" className={`text-center ${form.temperatura && (form.temperatura > 38 || form.temperatura < 35) ? "border-red-400 bg-red-50" : ""}`} />
              <span className="text-xs text-muted-foreground">°C</span>
            </div>
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Frecuencia Cardíaca</Label>
            <div className="flex items-center gap-1">
              <Input type="number" value={form.frecuencia_cardiaca} onChange={e => set("frecuencia_cardiaca", e.target.value)} placeholder="70" className="text-center" />
              <span className="text-xs text-muted-foreground">lpm</span>
            </div>
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Encargada</Label>
            <Input value={form.encargada} onChange={e => set("encargada", e.target.value)} placeholder="Nombre de la encargada" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Observaciones</Label>
            <Input value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Notas adicionales..." />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={async () => { await onSave(form, registro?.id); onClose(); }}>Guardar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function RegistroSalud() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("deposiciones");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dialogDep, setDialogDep] = useState(null); // { resident, turno, registro }
  const [dialogVit, setDialogVit] = useState(null); // { resident, registro }
  const [confirmDelete, setConfirmDelete] = useState(null); // registro a eliminar
  const [mostrarOcultos, setMostrarOcultos] = useState(false);
  const [residentesOcultos, setResidentesOcultos] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dep_ocultos") || "[]"); } catch { return []; }
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-activos"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const { data: deposiciones = [] } = useQuery({
    queryKey: ["deposiciones", selectedDate],
    queryFn: () => base44.entities.RegistroDeposicion.filter({}, "-date", 500),
    staleTime: 30000,
  });

  const { data: signosVitales = [] } = useQuery({
    queryKey: ["signos-vitales", selectedDate],
    queryFn: () => base44.entities.RegistroSignosVitales.filter({}, "-date", 200),
    staleTime: 30000,
  });

  const saveDep = useMutation({
    mutationFn: async ({ form, id, residentId, residentName, turno }) => {
      const data = { ...form, resident_id: residentId, resident_name: residentName, date: selectedDate, turno };
      if (id) return base44.entities.RegistroDeposicion.update(id, data);
      return base44.entities.RegistroDeposicion.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deposiciones"] }); toast.success("Registro guardado"); },
  });

  const deleteDep = useMutation({
    mutationFn: (id) => base44.entities.RegistroDeposicion.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["deposiciones"] }); toast.success("Registro eliminado"); setConfirmDelete(null); },
  });

  const handleHideResident = (residentId) => {
    const nuevos = [...residentesOcultos, residentId];
    setResidentesOcultos(nuevos);
    localStorage.setItem("dep_ocultos", JSON.stringify(nuevos));
    toast.success("Residente ocultado de la lista. Puedes restaurarlo con el botón 'Ver ocultos'.");
  };

  const handleShowResident = (residentId) => {
    const nuevos = residentesOcultos.filter(id => id !== residentId);
    setResidentesOcultos(nuevos);
    localStorage.setItem("dep_ocultos", JSON.stringify(nuevos));
  };

  const saveVit = useMutation({
    mutationFn: async ({ form, id, residentId, residentName }) => {
      const data = { ...form, resident_id: residentId, resident_name: residentName, date: selectedDate };
      if (id) return base44.entities.RegistroSignosVitales.update(id, data);
      return base44.entities.RegistroSignosVitales.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["signos-vitales"] }); toast.success("Signos vitales guardados"); },
  });

  const prevDay = () => setSelectedDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"));
  const nextDay = () => setSelectedDate(format(subDays(parseISO(selectedDate), -1), "yyyy-MM-dd"));
  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

  const handleDescargarInforme = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Permite ventanas emergentes para descargar el informe"); return; }
    const div = printWindow.document.createElement("div");
    printWindow.document.body.appendChild(div);
    printWindow.document.title = `Deposiciones ${selectedDate}`;
    const root = createRoot(div);
    root.render(
      <InformeDeposicionImprimible
        residents={residents}
        deposiciones={deposiciones}
        date={selectedDate}
        diasSinPorResidente={diasSinPorResidente}
      />
    );
    setTimeout(() => {
      printWindow.print();
    }, 600);
  };

  // Calcular días sin deposición por residente
  const diasSinPorResidente = useMemo(() => {
    const map = {};
    residents.forEach(r => {
      map[r.id] = calcDiasSinDeposicion(r.id, deposiciones, selectedDate);
    });
    return map;
  }, [residents, deposiciones, selectedDate]);

  const signoPorResidente = {};
  residents.forEach(r => {
    signoPorResidente[r.id] = signosVitales.find(s => s.resident_id === r.id && s.date === selectedDate);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" /> Registro de Salud
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">Deposiciones y Signos Vitales diarios</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {tab === "deposiciones" && (
            <Button variant="outline" size="sm" onClick={handleDescargarInforme} className="gap-1.5 text-xs h-8 px-2 sm:px-3">
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Informe</span>
            </Button>
          )}
          {tab === "signos" && (
            <Button variant="outline" size="sm" onClick={() => {
              const printWindow = window.open("", "_blank");
              if (!printWindow) { toast.error("Permite ventanas emergentes"); return; }
              printWindow.document.title = `Signos Vitales ${selectedDate}`;
              const div = printWindow.document.createElement("div");
              printWindow.document.body.appendChild(div);
              const root = createRoot(div);
              root.render(<InformeSignosVitalesImprimible residents={residents} signosVitales={signosVitales} date={selectedDate} />);
              setTimeout(() => printWindow.print(), 700);
            }} className="gap-1.5 text-xs h-8 px-2 sm:px-3">
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Informe</span>
            </Button>
          )}
        </div>
      </div>

      {/* Navegación de fecha */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={prevDay}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="text-center min-w-[180px]">
          <p className="font-semibold text-sm capitalize">
            {format(parseISO(selectedDate), "EEEE dd 'de' MMMM yyyy", { locale: es })}
          </p>
          {isToday && <p className="text-xs text-primary font-medium">Hoy</p>}
        </div>
        <Button variant="outline" size="icon" onClick={nextDay} disabled={isToday}><ChevronRight className="w-4 h-4" /></Button>
        {!isToday && (
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}>
            Hoy
          </Button>
        )}
      </div>

      {/* Alerta resumen */}
      {Object.values(diasSinPorResidente).some(d => d >= 3) && (
        <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {Object.values(diasSinPorResidente).filter(d => d >= 3).length} residente(s) con 3 o más días sin deposición — requieren atención según protocolo.
          </p>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        {/* Mobile: grid 3+2. Desktop: single TabsList */}
        <div className="mb-5 sm:hidden">
          <div className="grid grid-cols-3 gap-1 mb-1">
            {[
              { value: "deposiciones", icon: ClipboardList, label: "Deposic." },
              { value: "signos", icon: Activity, label: "S. Vitales" },
              { value: "ingesta", icon: Utensils, label: "Ingesta" },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-colors border ${
                  tab === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { value: "examenes", icon: FlaskConical, label: "Exámenes" },
              { value: "intervenciones", icon: Stethoscope, label: "Intervenciones" },
            ].map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-colors border ${
                  tab === value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
              </button>
            ))}
          </div>
        </div>
        <TabsList className="mb-5 hidden sm:flex w-auto">
          <TabsTrigger value="deposiciones" className="gap-1.5">
            <ClipboardList className="w-4 h-4" /> Deposiciones
          </TabsTrigger>
          <TabsTrigger value="signos" className="gap-1.5">
            <Activity className="w-4 h-4" /> Signos Vitales
          </TabsTrigger>
          <TabsTrigger value="ingesta" className="gap-1.5">
            <Utensils className="w-4 h-4" /> Control Ingesta
          </TabsTrigger>
          <TabsTrigger value="examenes" className="gap-1.5">
            <FlaskConical className="w-4 h-4" /> Exámenes
          </TabsTrigger>
          <TabsTrigger value="intervenciones" className="gap-1.5">
            <Stethoscope className="w-4 h-4" /> Intervenciones
          </TabsTrigger>
        </TabsList>

        {/* ── TAB DEPOSICIONES ── */}
        <TabsContent value="deposiciones">
          {/* Barra de acciones lista */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">
              {residents.filter(r => !residentesOcultos.includes(r.id)).length} residentes visibles
              {residentesOcultos.length > 0 && ` · ${residentesOcultos.length} oculto(s)`}
            </p>
            {residentesOcultos.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs gap-1.5" onClick={() => setMostrarOcultos(v => !v)}>
                {mostrarOcultos ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {mostrarOcultos ? "Ocultar sección" : `Ver ocultos (${residentesOcultos.length})`}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {residents.length === 0 ? (
              <Card className="p-10 text-center">
                <p className="text-muted-foreground text-sm">No hay residentes activos</p>
              </Card>
            ) : (
              residents.filter(r => !residentesOcultos.includes(r.id)).map(resident => (
                <FilaResidente
                  key={resident.id}
                  resident={resident}
                  deposiciones={deposiciones}
                  today={selectedDate}
                  diasSin={diasSinPorResidente[resident.id] || 0}
                  onEdit={(turno, registro) => setDialogDep({ resident, turno: turno.key || turno, registro })}
                  onDelete={(registro) => setConfirmDelete(registro)}
                  onHide={handleHideResident}
                />
              ))
            )}
          </div>

          {/* Sección de residentes ocultos */}
          {mostrarOcultos && residentesOcultos.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Residentes ocultos</p>
              <div className="space-y-2">
                {residents.filter(r => residentesOcultos.includes(r.id)).map(resident => (
                  <Card key={resident.id} className="p-3 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-sm shrink-0">
                        {(resident.preferred_name || resident.full_name)?.[0]}
                      </div>
                      <p className="text-sm flex-1 text-muted-foreground">{resident.preferred_name || resident.full_name}</p>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => handleShowResident(resident.id)}>
                        <UserPlus className="w-3 h-3" /> Restaurar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Leyenda bristol */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Escala de Bristol — Referencia</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { tipos: "1-2", label: "Estreñimiento", color: "text-red-600" },
                { tipos: "3-4", label: "Normal / Ideal", color: "text-green-600" },
                { tipos: "5-6", label: "Tendencia diarrea", color: "text-orange-600" },
                { tipos: "7", label: "Diarrea", color: "text-red-700" },
              ].map(item => (
                <div key={item.tipos} className="bg-white rounded-lg p-2 text-center border">
                  <p className={`text-xs font-bold ${item.color}`}>Tipo {item.tipos}</p>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── TAB SIGNOS VITALES ── */}
        <TabsContent value="signos">
          <div className="space-y-3">
            {residents.map(resident => {
              const sv = signoPorResidente[resident.id];
              const tieneAlerta = sv && (
                (sv.saturacion && sv.saturacion < 90) ||
                (sv.temperatura && (sv.temperatura > 38 || sv.temperatura < 35)) ||
                (sv.pa_sistolica && (sv.pa_sistolica > 160 || sv.pa_sistolica < 90))
              );

              return (
                <Card
                  key={resident.id}
                  className={`p-4 cursor-pointer hover:shadow-sm transition-all ${tieneAlerta ? "border-red-300 bg-red-50/50" : ""}`}
                  onClick={() => setDialogVit({ resident, registro: sv })}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {(resident.preferred_name || resident.full_name)?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{resident.preferred_name || resident.full_name}</p>
                      {sv ? (
                        <div className="flex flex-wrap gap-3 mt-1">
                          {sv.pa_sistolica && (
                            <span className={`text-xs font-medium ${sv.pa_sistolica > 160 || sv.pa_sistolica < 90 ? "text-red-600" : "text-foreground"}`}>
                              🫀 {sv.pa_sistolica}/{sv.pa_diastolica} mmHg
                            </span>
                          )}
                          {sv.saturacion && (
                            <span className={`text-xs font-medium ${sv.saturacion < 90 ? "text-red-600" : "text-foreground"}`}>
                              💨 {sv.saturacion}%
                            </span>
                          )}
                          {sv.temperatura && (
                            <span className={`text-xs font-medium ${sv.temperatura > 38 ? "text-red-600" : "text-foreground"}`}>
                              🌡️ {sv.temperatura}°C
                            </span>
                          )}
                          {sv.frecuencia_cardiaca && (
                            <span className="text-xs font-medium">❤️ {sv.frecuencia_cardiaca} lpm</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">Sin registro — clic para agregar</p>
                      )}
                    </div>
                    {tieneAlerta
                      ? <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      : sv
                        ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        : <Plus className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                    }
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Referencia valores normales */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Valores de referencia</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              <div className="bg-white rounded-lg p-2 border text-center">
                <p className="font-bold text-foreground">PA</p>
                <p className="text-green-600">90-140 / 60-90</p>
              </div>
              <div className="bg-white rounded-lg p-2 border text-center">
                <p className="font-bold text-foreground">Saturación</p>
                <p className="text-green-600">≥ 95%</p>
              </div>
              <div className="bg-white rounded-lg p-2 border text-center">
                <p className="font-bold text-foreground">Temperatura</p>
                <p className="text-green-600">35 – 37.5°C</p>
              </div>
              <div className="bg-white rounded-lg p-2 border text-center">
                <p className="font-bold text-foreground">Frecuencia</p>
                <p className="text-green-600">60 – 100 lpm</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB INGESTA ── */}
        <TabsContent value="ingesta">
          <TabIngesta residents={residents} selectedDate={selectedDate} />
        </TabsContent>

        {/* ── TAB EXÁMENES BIOQUÍMICOS ── */}
        <TabsContent value="examenes">
          <TabExamenesBioquimicos residents={residents} />
        </TabsContent>

        {/* ── TAB INTERVENCIONES ── */}
        <TabsContent value="intervenciones">
          <TabIntervenciones residents={residents} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {dialogDep && (
        <DialogDeposicion
          open={!!dialogDep}
          onClose={() => setDialogDep(null)}
          resident={dialogDep.resident}
          turno={dialogDep.turno}
          registro={dialogDep.registro}
          date={selectedDate}
          onSave={(form, id) => saveDep.mutateAsync({
            form, id,
            residentId: dialogDep.resident.id,
            residentName: dialogDep.resident.full_name,
            turno: dialogDep.turno,
          })}
        />
      )}

      {dialogVit && (
        <DialogSignosVitales
          open={!!dialogVit}
          onClose={() => setDialogVit(null)}
          resident={dialogVit.resident}
          registro={dialogVit.registro}
          date={selectedDate}
          onSave={(form, id) => saveVit.mutateAsync({
            form, id,
            residentId: dialogVit.resident.id,
            residentName: dialogVit.resident.full_name,
          })}
        />
      )}

      {/* Confirmar eliminación de registro */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el registro de deposición del turno <strong className="capitalize">{confirmDelete?.turno}</strong> del <strong>{confirmDelete?.resident_name}</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteDep.mutate(confirmDelete.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}