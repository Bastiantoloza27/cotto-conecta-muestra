import { AlertTriangle, AlertCircle, Info } from "lucide-react";

const PROTOCOLO = [
  { dias: 3, nivel: "warning", texto: "3 días sin deposición", accion_peg: "Tacto + enema", accion_sin_peg: "30cc lactulosa" },
  { dias: 4, nivel: "warning", texto: "4 días sin deposición", accion_peg: "Extracción manual", accion_sin_peg: "Tacto + enema" },
  { dias: 5, nivel: "danger", texto: "5 días sin deposición", accion_peg: "Enema + PEG 20gms", accion_sin_peg: "Extracción manual" },
  { dias: 6, nivel: "critical", texto: "6 días sin deposición", accion_peg: "⚠️ URGENCIAS", accion_sin_peg: "Enema + PEG 20gms" },
];

export default function AlertaDeposicion({ diasSinDeposicion }) {
  if (diasSinDeposicion < 3) return null;

  const protocolo = PROTOCOLO.find(p => p.dias === diasSinDeposicion) || PROTOCOLO[PROTOCOLO.length - 1];
  const isCritical = diasSinDeposicion >= 6;
  const isDanger = diasSinDeposicion >= 5;

  return (
    <div className={`rounded-xl border-2 p-3 flex gap-3 items-start ${
      isCritical ? "bg-red-50 border-red-400" :
      isDanger ? "bg-orange-50 border-orange-400" :
      "bg-amber-50 border-amber-400"
    }`}>
      {isCritical
        ? <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      }
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${isCritical ? "text-red-700" : isDanger ? "text-orange-700" : "text-amber-700"}`}>
          ⚠️ {protocolo.texto}
        </p>
        <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/70 rounded p-1.5">
            <p className="font-semibold text-muted-foreground">Con PEG</p>
            <p className="font-medium">{protocolo.accion_peg}</p>
          </div>
          <div className="bg-white/70 rounded p-1.5">
            <p className="font-semibold text-muted-foreground">Sin PEG</p>
            <p className="font-medium">{protocolo.accion_sin_peg}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { PROTOCOLO };