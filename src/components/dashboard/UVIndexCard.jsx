import { useQuery } from "@tanstack/react-query";
import { Sun, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const URL = "https://api.open-meteo.com/v1/forecast?latitude=-32.78&longitude=-71.53&daily=uv_index_max&current=uv_index&timezone=America%2FSantiago&forecast_days=1";

const LEVELS = [
  { max: 2.99, label: "Bajo", color: "bg-green-500", text: "text-green-700", tip: "Riesgo mínimo. Protección básica." },
  { max: 5.99, label: "Moderado", color: "bg-yellow-400", text: "text-yellow-700", tip: "Usar bloqueador y gorro en exteriores." },
  { max: 7.99, label: "Alto", color: "bg-orange-500", text: "text-orange-700", tip: "Evitar exposición entre 11:00 y 16:00." },
  { max: 10.99, label: "Muy alto", color: "bg-red-600", text: "text-red-700", tip: "Limitar salidas. Bloqueador, gorro y lentes." },
  { max: Infinity, label: "Extremo", color: "bg-purple-600", text: "text-purple-700", tip: "Evitar salir al sol. Máxima protección." },
];

const levelFor = (uv) => LEVELS.find((l) => uv <= l.max);

export default function UVIndexCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["uv-quintero"],
    queryFn: () => fetch(URL).then((r) => r.json()),
    refetchInterval: 60 * 60 * 1000,
  });

  if (isLoading) {
    return <Card className="p-4 mb-5 sm:mb-8 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Cargando índice UV...</Card>;
  }

  const max = Math.round(data?.daily?.uv_index_max?.[0] ?? 0);
  const current = Math.round(data?.current?.uv_index ?? 0);
  const lvl = levelFor(max);

  return (
    <Card className="p-4 mb-5 sm:mb-8 flex items-center gap-4">
      <div className={`w-14 h-14 rounded-xl ${lvl.color} flex flex-col items-center justify-center text-white shrink-0`}>
        <span className="text-2xl font-bold leading-none">{max}</span>
        <span className="text-[9px] uppercase">UV máx</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          <Sun className="w-4 h-4 text-amber-500" /> Índice UV hoy · Quintero
          <span className={`ml-1 ${lvl.text}`}>{lvl.label}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{lvl.tip}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">UV actual: {current}</p>
      </div>
    </Card>
  );
}