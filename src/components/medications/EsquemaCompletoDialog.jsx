import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, ListChecks } from "lucide-react";

const EMPTY_ROW = () => ({
  _id: Math.random().toString(36).slice(2),
  name: "",
  unidades_por_toma: 1,
  dosage: "",
  frequency: "diario",
  schedule_times: "",
  route: "oral",
});

export default function EsquemaCompletoDialog({ open, onOpenChange, resident }) {
  const [rows, setRows] = useState([EMPTY_ROW()]);
  const [errors, setErrors] = useState({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (meds) => Promise.all(meds.map(m => base44.entities.Medication.create(m))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident-meds", resident.id] });
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      toast({ title: "✅ Esquema guardado", description: `${rows.length} medicamento(s) agregados.` });
      setRows([EMPTY_ROW()]);
      setErrors({});
      onOpenChange(false);
    },
  });

  const setRow = (id, field, value) => {
    setRows(prev => prev.map(r => r._id === id ? { ...r, [field]: value } : r));
    setErrors(prev => ({ ...prev, [`${id}_${field}`]: undefined }));
  };

  const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);

  const removeRow = (id) => setRows(prev => prev.filter(r => r._id !== id));

  const handleSave = () => {
    const newErrors = {};
    rows.forEach(r => {
      if (!r.name.trim()) newErrors[`${r._id}_name`] = true;
      if (!r.dosage.trim()) newErrors[`${r._id}_dosage`] = true;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ title: "Completa los campos obligatorios", description: "Cada fila requiere Medicamento y Dosis.", variant: "destructive" });
      return;
    }
    const meds = rows.map(({ _id, ...r }) => ({
      ...r,
      resident_id: resident.id,
      resident_name: resident.preferred_name || resident.full_name,
      status: "activo",
      unidades_por_toma: Number(r.unidades_por_toma) || 1,
    }));
    mutation.mutate(meds);
  };

  const handleClose = (v) => {
    if (!v) { setRows([EMPTY_ROW()]); setErrors({}); }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            Agregar esquema completo
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Residente: <span className="font-medium text-foreground">{resident?.preferred_name || resident?.full_name}</span>
          </p>
        </DialogHeader>

        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2 pr-2 text-xs font-medium text-muted-foreground">Medicamento *</th>
                <th className="pb-2 pr-2 text-xs font-medium text-muted-foreground">Ud/toma</th>
                <th className="pb-2 pr-2 text-xs font-medium text-muted-foreground">Dosis *</th>
                <th className="pb-2 pr-2 text-xs font-medium text-muted-foreground">Frecuencia</th>
                <th className="pb-2 pr-2 text-xs font-medium text-muted-foreground">Horarios</th>
                <th className="pb-2 pr-2 text-xs font-medium text-muted-foreground">Vía</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row._id} className="align-top">
                  <td className="py-2 pr-2">
                    <Input
                      value={row.name}
                      onChange={e => setRow(row._id, "name", e.target.value)}
                      placeholder="Ej: Enalapril"
                      className={`h-8 text-sm ${errors[`${row._id}_name`] ? "border-destructive" : ""}`}
                    />
                  </td>
                  <td className="py-2 pr-2 w-20">
                    <Input
                      type="number"
                      min="0.1"
                      step="0.5"
                      value={row.unidades_por_toma}
                      onChange={e => setRow(row._id, "unidades_por_toma", e.target.value)}
                      className="h-8 text-sm w-20"
                    />
                  </td>
                  <td className="py-2 pr-2 w-24">
                    <Input
                      value={row.dosage}
                      onChange={e => setRow(row._id, "dosage", e.target.value)}
                      placeholder="500mg"
                      className={`h-8 text-sm w-24 ${errors[`${row._id}_dosage`] ? "border-destructive" : ""}`}
                    />
                  </td>
                  <td className="py-2 pr-2 w-32">
                    <Select value={row.frequency} onValueChange={v => setRow(row._id, "frequency", v)}>
                      <SelectTrigger className="h-8 text-sm w-32"><SelectValue /></SelectTrigger>
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
                  </td>
                  <td className="py-2 pr-2 w-32">
                    <Input
                      value={row.schedule_times}
                      onChange={e => setRow(row._id, "schedule_times", e.target.value)}
                      placeholder="08:00, 20:00"
                      className="h-8 text-sm w-32"
                    />
                  </td>
                  <td className="py-2 pr-2 w-28">
                    <Select value={row.route} onValueChange={v => setRow(row._id, "route", v)}>
                      <SelectTrigger className="h-8 text-sm w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oral">Oral</SelectItem>
                        <SelectItem value="sublingual">Sublingual</SelectItem>
                        <SelectItem value="topica">Tópica</SelectItem>
                        <SelectItem value="inyectable">Inyectable</SelectItem>
                        <SelectItem value="inhalatoria">Inhalatoria</SelectItem>
                        <SelectItem value="rectal">Rectal</SelectItem>
                        <SelectItem value="otra">Otra</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row._id)}
                      disabled={rows.length === 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Button variant="outline" size="sm" className="gap-1.5 w-fit mt-1" onClick={addRow}>
          <Plus className="w-3.5 h-3.5" /> Añadir fármaco
        </Button>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Guardando..." : `Guardar todos (${rows.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}