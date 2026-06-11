import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import DialogIngesta from "./DialogIngesta";
import { createRoot } from "react-dom/client";
import InformeIngestaImprimible from "./InformeIngestaImprimible";

const COMIDAS = [
  { key: "desayuno",          emoji: "🌅", label: "Desayuno",         turno: "manana", opcional: false },
  { key: "colacion_manana",   emoji: "🍎", label: "Colación",         turno: "manana", opcional: false },
  { key: "almuerzo",          emoji: "☀️", label: "Almuerzo",         turno: "tarde",  opcional: false },
  { key: "once",              emoji: "🍵", label: "Once",             turno: "tarde",  opcional: false },
  { key: "hidratacion",       emoji: "💧", label: "Hidratación",      turno: "tarde",  opcional: false, soloHidratacion: true },
  { key: "cena",              emoji: "🌙", label: "Cena",             turno: "noche",  opcional: false },
  { key: "colacion_nocturna", emoji: "🌛", label: "Colación Nocturna",turno: "noche",  opcional: true  },
];

const PORCION_INFO = {
  "0":        { emoji: "🍽️", label: "Nada",    color: "bg-slate-100 text-slate-600 border-slate-300" },
  "1/4":      { emoji: "🥣", label: "¼ plato", color: "bg-orange-100 text-orange-700 border-orange-300" },
  "1/2":      { emoji: "🥗", label: "½ plato", color: "bg-amber-100 text-amber-700 border-amber-300" },
  "3/4":      { emoji: "🍲", label: "¾ plato", color: "bg-green-100 text-green-700 border-green-300" },
  "completo": { emoji: "✅", label: "Completo", color: "bg-green-200 text-green-800 border-green-400" },
};

function TarjetaComida({ comida, registro, onEdit, onDelete }) {
  const tieneRegistro = !!registro;
  const porcionInfo = registro?.porcion_consumida ? PORCION_INFO[registro.porcion_consumida] : null;

  return (
    <div
      className={`rounded-xl border-2 p-3 transition-all ${
        tieneRegistro
          ? registro.porcion_consumida === "0" || registro.porcion_consumida === "1/4"
            ? "bg-orange-50 border-orange-200"
            : "bg-green-50 border-green-200"
          : "bg-white border-dashed border-border hover:border-primary/40 cursor-pointer hover:shadow-sm"
      }`}
      onClick={() => !tieneRegistro && onEdit(comida, registro)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{comida.emoji} {comida.label}{comida.opcional && <span className="ml-1 text-[9px] font-normal text-muted-foreground border rounded px-1">Opcional</span>}</span>
        {tieneRegistro ? (
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); onEdit(comida, registro); }} className="p-1 rounded hover:bg-black/10 transition-colors opacity-60 hover:opacity-100" title="Editar">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(registro); }} className="p-1 rounded hover:bg-red-100 transition-colors opacity-60 hover:opacity-100 text-red-500" title="Eliminar">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <Plus className="w-4 h-4 text-muted-foreground/40" />
        )}
      </div>

      {tieneRegistro ? (
        <div className="space-y-1">
          {comida.soloHidratacion ? (
            registro.hidratacion ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-300">
                💧 {registro.hidratacion.charAt(0).toUpperCase() + registro.hidratacion.slice(1)}
              </span>
            ) : <p className="text-[11px] text-muted-foreground/50">—</p>
          ) : (
            <>
              {porcionInfo && (
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${porcionInfo.color}`}>
                  {porcionInfo.emoji} {porcionInfo.label}
                </span>
              )}
              {registro.hidratacion && registro.hidratacion !== "ninguna" && (
                <p className="text-[11px] text-muted-foreground">💧 Hidrat.: {registro.hidratacion}</p>
              )}
            </>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/50">Sin registrar</p>
      )}
    </div>
  );
}

export default function TabIngesta({ residents, selectedDate }) {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(null); // { resident, comida, registro }
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: registros = [] } = useQuery({
    queryKey: ["ingestas"],
    queryFn: () => base44.entities.RegistroIngesta.filter({}, "-date", 1000),
    staleTime: 30000,
  });

  const saveIngesta = useMutation({
    mutationFn: async ({ form, id, residentId, residentName, comida }) => {
      const data = {
        ...form,
        resident_id: residentId,
        resident_name: residentName,
        date: selectedDate,
        turno: comida.turno,
        tipo_comida: comida.key,
      };
      if (id) return base44.entities.RegistroIngesta.update(id, data);
      return base44.entities.RegistroIngesta.create(data);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ingestas"] }); toast.success("Ingesta registrada"); },
  });

  const deleteIngesta = useMutation({
    mutationFn: (id) => base44.entities.RegistroIngesta.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ingestas"] }); toast.success("Registro eliminado"); setConfirmDelete(null); },
  });

  const getRegistro = (residentId, comidaKey) =>
    registros.find(r => r.resident_id === residentId && r.date === selectedDate && r.tipo_comida === comidaKey);

  const handleDescargar = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Permite ventanas emergentes para descargar el informe"); return; }
    printWindow.document.title = `Ingesta ${selectedDate}`;
    const div = printWindow.document.createElement("div");
    printWindow.document.body.appendChild(div);
    const root = createRoot(div);
    root.render(<InformeIngestaImprimible residents={residents} registros={registros} date={selectedDate} />);
    setTimeout(() => printWindow.print(), 700);
  };

  return (
    <>
      {/* Botón informe */}
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={handleDescargar} className="gap-1.5">
          📥 Descargar informe
        </Button>
      </div>

      <div className="space-y-4">
        {residents.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground text-sm">No hay residentes activos</p>
          </Card>
        ) : (
          residents.map(resident => {
            // Calcular resumen del día (solo comidas no opcionales o registradas)
            const comidasBase = COMIDAS.filter(c => !c.opcional);
            const regDia = COMIDAS.map(c => getRegistro(resident.id, c.key)).filter(Boolean);
            const totalComidas = comidasBase.length;
            const registradas = comidasBase.filter(c => getRegistro(resident.id, c.key)).length;
            const completadas = regDia.filter(r => r.porcion_consumida === "completo" || r.porcion_consumida === "3/4").length;

            return (
              <Card key={resident.id} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {(resident.preferred_name || resident.full_name)?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{resident.preferred_name || resident.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{resident.room ? `Hab. ${resident.room}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {registradas > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {registradas}/{totalComidas} registradas
                      </Badge>
                    )}
                    {completadas >= 3 && (
                      <Badge className="text-[10px] bg-green-500 text-white border-0">✓ Buena ingesta</Badge>
                    )}
                    {registradas >= 3 && completadas <= 1 && (
                      <Badge className="text-[10px] bg-orange-500 text-white border-0">⚠️ Ingesta baja</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMIDAS.map(comida => (
                    <TarjetaComida
                      key={comida.key}
                      comida={comida}
                      registro={getRegistro(resident.id, comida.key)}
                      onEdit={(c, r) => setDialog({ resident, comida: c, registro: r })}
                      onDelete={(r) => setConfirmDelete(r)}
                    />
                  ))}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-6 p-4 bg-muted/50 rounded-xl">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Referencia de porciones</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PORCION_INFO).map(([val, info]) => (
            <span key={val} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border ${info.color}`}>
              {info.emoji} {info.label}
            </span>
          ))}
        </div>
      </div>

      {/* Dialog de registro */}
      {dialog && (
        <DialogIngesta
          open={!!dialog}
          onClose={() => setDialog(null)}
          resident={dialog.resident}
          turno={dialog.comida?.turno}
          tipoComida={dialog.comida?.key}
          registro={dialog.registro}
          date={selectedDate}
          onSave={(form, id) => saveIngesta.mutateAsync({
            form, id,
            residentId: dialog.resident.id,
            residentName: dialog.resident.full_name,
            comida: dialog.comida,
          })}
        />
      )}

      {/* Confirmar eliminación */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el registro de <strong className="capitalize">{confirmDelete?.tipo_comida}</strong> de <strong>{confirmDelete?.resident_name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteIngesta.mutate(confirmDelete.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}