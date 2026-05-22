import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Pill, Clock, AlertCircle } from "lucide-react";
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

export default function Medications() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    resident_id: "", resident_name: "", name: "", dosage: "", frequency: "diario",
    schedule_times: "", route: "oral", prescribing_doctor: "", start_date: "",
    status: "activo", notes: "", stock_remaining: 0,
  });
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
    },
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleResident = (id) => {
    const r = residents.find((r) => r.id === id);
    set("resident_id", id);
    set("resident_name", r?.preferred_name || r?.full_name || "");
  };

  // Group by resident
  const grouped = {};
  medications.forEach((m) => {
    const key = m.resident_name || "Sin asignar";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  const lowStock = medications.filter((m) => m.status === "activo" && m.stock_remaining > 0 && m.stock_remaining < 10);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Medicación"
        subtitle="Control de medicamentos, horarios y administración"
        action={() => setShowForm(true)}
        actionLabel="Agregar medicamento"
        actionIcon={Plus}
      />

      {lowStock.length > 0 && (
        <Card className="p-3 mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800 font-medium">
              {lowStock.length} medicamento(s) con stock bajo
            </p>
          </div>
        </Card>
      )}

      {medications.length === 0 ? (
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
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{name[0]}</div>
                {name}
              </h3>
              <div className="space-y-2 ml-8">
                {meds.map((m) => (
                  <Card key={m.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-primary" /> {m.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.dosage} · {m.frequency?.replace("_", " ")} · {m.route}
                        </p>
                        {m.schedule_times && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {m.schedule_times}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {m.stock_remaining > 0 && (
                          <Badge variant="outline" className={`text-[10px] ${m.stock_remaining < 10 ? "bg-amber-50 text-amber-700 border-amber-200" : ""}`}>
                            Stock: {m.stock_remaining}
                          </Badge>
                        )}
                        <Badge variant={m.status === "activo" ? "default" : "secondary"} className="capitalize text-[10px]">
                          {m.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>💊 Agregar medicamento</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 mt-2">
            <div>
              <Label>Persona residente *</Label>
              <Select value={form.resident_id} onValueChange={handleResident}>
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
            <div>
              <Label>Médico prescriptor</Label>
              <Input value={form.prescribing_doctor} onChange={(e) => set("prescribing_doctor", e.target.value)} />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Agregar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}