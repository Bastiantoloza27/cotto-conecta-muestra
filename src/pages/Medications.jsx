import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Pill, Clock, AlertCircle, AlertTriangle, Send, Pencil, Trash2, FileDown, ListChecks } from "lucide-react";
import InformeMedicacionImprimible from "@/components/informes/InformeMedicacionImprimible";
import { printReport } from "@/lib/printReport";
import EsquemaCompletoDialog from "@/components/medications/EsquemaCompletoDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/ui/use-toast";

// Stock semaphore helpers
function StockIndicator({ stock }) {
  if (!stock && stock !== 0) return null;
  const critical = stock < 5;
  const low = stock < 10;
  return (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 ${
        critical ? "bg-red-50 text-red-700 border-red-300" :
        low      ? "bg-amber-50 text-amber-700 border-amber-200" :
                   "bg-green-50 text-green-700 border-green-200"
      }`}
    >
      {critical && <AlertTriangle className="w-2.5 h-2.5" />}
      Stock: {stock}
    </Badge>
  );
}

export default function Medications() {
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("activo");
  const [showEsquema, setShowEsquema] = useState(false);
  const [esquemaResident, setEsquemaResident] = useState(null);
  const { toast } = useToast();
  const EMPTY_FORM = {
    resident_id: "", resident_name: "", name: "", dosage: "",
    unidades_por_toma: 1, forma_farmaceutica: "",
    consumo_mensual_manual: "",
    frequency: "diario", schedule_times: "", route: "oral",
    prescribing_doctor: "", start_date: "",
    status: "activo", notes: "", stock_remaining: "",
  };

  // Calcula tomas diarias: primero desde horarios, luego desde frecuencia
  function calcularTomasDiarias(schedule_times, frequency) {
    if (schedule_times) {
      const count = schedule_times.split(",").map(s => s.trim()).filter(Boolean).length;
      if (count > 0) return count;
    }
    return { cada_6h: 4, cada_8h: 3, cada_12h: 2, diario: 1, semanal: 0.14286 }[frequency] ?? null;
  }

  function calcularConsumoMensual(med) {
    const freq = med.frequency;
    if (freq === "sos" || freq === "otro") return null; // manual
    const tomas = calcularTomasDiarias(med.schedule_times, freq);
    if (!tomas) return null;
    const upt = Number(med.unidades_por_toma) || 1;
    return Math.round(upt * tomas * 30 * 10) / 10;
  }
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: medications = [] } = useQuery({
    queryKey: ["medications"],
    queryFn: () => base44.entities.Medication.list("-created_date", 200),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-active"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Medication.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Medication.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      setShowForm(false);
      setEditingMed(null);
      setForm(EMPTY_FORM);
      toast({ title: "Medicamento actualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Medication.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast({ title: "Medicamento eliminado" });
    },
  });

  const openEdit = (med) => {
    setEditingMed(med);
    setForm({
      resident_id: med.resident_id || "",
      resident_name: med.resident_name || "",
      name: med.name || "",
      dosage: med.dosage || "",
      unidades_por_toma: med.unidades_por_toma ?? 1,
      forma_farmaceutica: med.forma_farmaceutica || "",
      consumo_mensual_manual: med.consumo_mensual_manual ?? "",
      frequency: med.frequency || "diario",
      schedule_times: med.schedule_times || "",
      route: med.route || "oral",
      prescribing_doctor: med.prescribing_doctor || "",
      start_date: med.start_date || "",
      status: med.status || "activo",
      notes: med.notes || "",
      stock_remaining: med.stock_remaining ?? "",
    });
    setShowForm(true);
  };

  const handleDelete = (med) => {
    if (confirm(`¿Eliminar "${med.name}" de ${med.resident_name}? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(med.id);
    }
  };

  const notifyTeam = async (med) => {
    setSendingId(med.id);
    try {
      await base44.functions.invoke("notificarCambioMedicamento", {
        data: med,
        event: { type: "manual" },
      });
      toast({ title: "✅ Notificación enviada", description: `El equipo de salud y dirección fueron notificados sobre ${med.name}.` });
    } catch {
      toast({ title: "Error al notificar", description: "No se pudo enviar la notificación.", variant: "destructive" });
    }
    setSendingId(null);
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleResident = (id) => {
    const r = residents.find((r) => r.id === id);
    set("resident_id", id);
    set("resident_name", r?.preferred_name || r?.full_name || "");
  };

  const filtered = statusFilter === "todos"
    ? medications
    : medications.filter(m => m.status === statusFilter);

  // Group by resident
  const grouped = {};
  filtered.forEach((m) => {
    const key = m.resident_name || "Sin asignar";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  const critical = medications.filter(m => m.status === "activo" && m.stock_remaining > 0 && m.stock_remaining < 5);
  const lowStock = medications.filter(m => m.status === "activo" && m.stock_remaining >= 5 && m.stock_remaining < 10);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Medicación</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Control de medicamentos, horarios y administración</p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            onClick={() => printReport(
              <InformeMedicacionImprimible medications={filtered} residents={residents} statusFilter={statusFilter} />,
              "Informe Medicación"
            )}
            className="gap-2"
          >
            <FileDown className="w-4 h-4" /> Informe
          </Button>
          <Button variant="outline" onClick={() => setShowEsquema(true)} className="gap-2">
            <ListChecks className="w-4 h-4" />
            Esquema completo
          </Button>
          <Button onClick={() => { setEditingMed(null); setForm(EMPTY_FORM); setShowForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Agregar medicamento
          </Button>
        </div>
      </div>

      {/* Semaphore alerts */}
      {critical.length > 0 && (
        <Card className="p-3 mb-3 border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-800 font-medium">
              🔴 Stock crítico (&lt;5): {critical.map(m => `${m.name} (${m.resident_name})`).join(", ")}
            </p>
          </div>
        </Card>
      )}
      {lowStock.length > 0 && (
        <Card className="p-3 mb-5 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              🟡 Stock bajo (&lt;10): {lowStock.map(m => `${m.name} (${m.resident_name})`).join(", ")}
            </p>
          </div>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-muted rounded-lg p-1 w-fit">
        {[["activo", "Activos"], ["suspendido", "Suspendidos"], ["completado", "Completados"], ["todos", "Todos"]].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              statusFilter === val
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="Sin medicamentos registrados"
          description="Agrega los medicamentos de las personas residentes"
          actionLabel="Agregar medicamento"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([name, meds]) => (
            <div key={name}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                  {name[0]}
                </div>
                {name}
              </h3>
              <div className="space-y-2 ml-8">
                {meds.map((m) => (
                  <Card key={m.id} className={`p-3 ${m.stock_remaining > 0 && m.stock_remaining < 5 ? "border-red-200" : m.stock_remaining > 0 && m.stock_remaining < 10 ? "border-amber-100" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-primary shrink-0" />
                          {m.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.dosage}
                          {m.forma_farmaceutica && <> · <span className="capitalize">{m.forma_farmaceutica}</span></>}
                          {m.unidades_por_toma && m.unidades_por_toma !== 1 && <> · {m.unidades_por_toma} ud/toma</>}
                          {" · "}{m.frequency?.replace(/_/g, " ")} · {m.route}
                        </p>
                        {m.schedule_times && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" /> {m.schedule_times}
                          </p>
                        )}
                        {(() => {
                          const esManual = m.frequency === "sos" || m.frequency === "otro";
                          const consumo = esManual
                            ? (m.consumo_mensual_manual ?? null)
                            : calcularConsumoMensual(m);
                          if (!consumo && consumo !== 0) return null;
                          return (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              📦 ~{consumo} {m.forma_farmaceutica || "unid."}/mes
                            </p>
                          );
                        })()}
                        {m.prescribing_doctor && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">Dr/a. {m.prescribing_doctor}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {m.stock_remaining > 0 && <StockIndicator stock={m.stock_remaining} />}
                        <Badge
                          variant={m.status === "activo" ? "default" : "secondary"}
                          className="capitalize text-[10px]"
                        >
                          {m.status}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                            onClick={() => notifyTeam(m)}
                            disabled={sendingId === m.id}
                          >
                            <Send className="w-2.5 h-2.5" />
                            {sendingId === m.id ? "..." : "Notificar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(m)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Dialog selector de residente para esquema completo */}
      <Dialog open={showEsquema && !esquemaResident} onOpenChange={(v) => { if (!v) setShowEsquema(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ListChecks className="w-5 h-5 text-primary" />Esquema completo — ¿Para quién?</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">Selecciona el residente para agregar su esquema farmacológico completo.</p>
            <Select onValueChange={(id) => {
              const r = residents.find(r => r.id === id);
              setEsquemaResident(r);
            }}>
              <SelectTrigger><SelectValue placeholder="Seleccionar residente..." /></SelectTrigger>
              <SelectContent>
                {residents.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowEsquema(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {esquemaResident && (
        <EsquemaCompletoDialog
          open={showEsquema && !!esquemaResident}
          onOpenChange={(v) => { if (!v) { setShowEsquema(false); setEsquemaResident(null); } }}
          resident={esquemaResident}
        />
      )}

      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditingMed(null); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingMed ? "✏️ Editar medicamento" : "💊 Agregar medicamento"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const data = {
              ...form,
              stock_remaining: Number(form.stock_remaining) || 0,
              unidades_por_toma: Number(form.unidades_por_toma) || 1,
              consumo_mensual_manual: form.consumo_mensual_manual !== "" ? Number(form.consumo_mensual_manual) : null,
            };
            if (editingMed) {
              updateMutation.mutate({ id: editingMed.id, data });
            } else {
              createMutation.mutate(data);
            }
          }} className="space-y-4 mt-2">
            <div>
            <Label>Persona residente *</Label>
            <Select value={form.resident_id} onValueChange={handleResident} disabled={!!editingMed}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>
                {residents.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.preferred_name || r.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
            <div>
              <Label>Medicamento *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dosis *</Label>
                <Input value={form.dosage} onChange={(e) => set("dosage", e.target.value)} placeholder="Ej: 500mg" required />
              </div>
              <div>
                <Label>Unidades por toma</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.unidades_por_toma}
                  onChange={(e) => set("unidades_por_toma", e.target.value)}
                  placeholder="1"
                />
              </div>
            </div>
            <div>
              <Label>Forma farmacéutica</Label>
              <Select value={form.forma_farmaceutica} onValueChange={(v) => set("forma_farmaceutica", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprimido">Comprimido</SelectItem>
                  <SelectItem value="capsula">Cápsula</SelectItem>
                  <SelectItem value="gota">Gota</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="sobre">Sobre</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frecuencia</Label>
                <Select value={form.frequency} onValueChange={(v) => set("frequency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cada_6h">Cada 6h</SelectItem>
                    <SelectItem value="cada_8h">Cada 8h</SelectItem>
                    <SelectItem value="cada_12h">Cada 12h</SelectItem>
                    <SelectItem value="diario">Diario</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="sos">SOS</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Horarios</Label>
                <Input value={form.schedule_times} onChange={(e) => set("schedule_times", e.target.value)} placeholder="08:00, 20:00" />
              </div>
              <div>
                <Label>Vía</Label>
                <Select value={form.route} onValueChange={(v) => set("route", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oral">Oral</SelectItem>
                    <SelectItem value="sublingual">Sublingual</SelectItem>
                    <SelectItem value="topica">Tópica</SelectItem>
                    <SelectItem value="inyectable">Inyectable</SelectItem>
                    <SelectItem value="inhalatoria">Inhalatoria</SelectItem>
                    <SelectItem value="otra">Otra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Médico prescriptor</Label>
                <Input value={form.prescribing_doctor} onChange={(e) => set("prescribing_doctor", e.target.value)} />
              </div>
              <div>
                <Label>Stock inicial</Label>
                <Input type="number" value={form.stock_remaining} onChange={(e) => set("stock_remaining", e.target.value)} placeholder="0" />
              </div>
            </div>
            {editingMed && (
              <div>
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="suspendido">Suspendido</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {/* Consumo mensual estimado */}
            {(() => {
              const esManual = form.frequency === "sos" || form.frequency === "otro";
              const tomas = calcularTomasDiarias(form.schedule_times, form.frequency);
              const upt = Number(form.unidades_por_toma) || 1;
              const estimado = !esManual && tomas ? Math.round(upt * tomas * 30 * 10) / 10 : null;
              const unidadLabel = form.forma_farmaceutica || "unid.";
              return (
                <div className="rounded-xl bg-muted/50 border p-3 space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">📦 Consumo mensual estimado</Label>
                  {esManual ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={form.consumo_mensual_manual}
                        onChange={(e) => set("consumo_mensual_manual", e.target.value === "" ? "" : e.target.value)}
                        placeholder="Ingresa manualmente"
                        className="max-w-[140px]"
                      />
                      <span className="text-sm text-muted-foreground">{unidadLabel}</span>
                    </div>
                  ) : estimado !== null ? (
                    <p className="text-lg font-semibold text-foreground">
                      {estimado} <span className="text-sm font-normal text-muted-foreground">{unidadLabel}</span>
                      {tomas && form.schedule_times?.split(",").filter(Boolean).length > 0
                        ? <span className="text-[11px] text-muted-foreground ml-2">({tomas} tomas/día por horarios)</span>
                        : <span className="text-[11px] text-muted-foreground ml-2">({tomas} tomas/día por frecuencia)</span>
                      }
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No aplica</p>
                  )}
                </div>
              );
            })()}
            <div>
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingMed(null); setForm(EMPTY_FORM); }}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Guardando..." : editingMed ? "Guardar cambios" : "Agregar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}