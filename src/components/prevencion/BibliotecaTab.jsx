import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, ArrowLeft, FileText } from "lucide-react";
import { CARPETAS, abrirArchivo } from "./constants";

export default function BibliotecaTab({ docs }) {
  const aprobados = docs.filter((d) => d.estado === "aprobado");
  const [carpeta, setCarpeta] = useState(null);
  const [q, setQ] = useState("");

  const lista = aprobados.filter((d) =>
    (q ? `${d.titulo} ${d.codigo || ""}`.toLowerCase().includes(q.toLowerCase()) : d.carpeta === carpeta)
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar documento por nombre o código..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {!carpeta && !q ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(CARPETAS).map(([k, c]) => {
            const n = aprobados.filter((d) => d.carpeta === k).length;
            return (
              <button key={k} onClick={() => setCarpeta(k)} className={`border rounded-xl p-4 text-left hover:shadow-md transition-all ${c.color}`}>
                <span className="text-3xl">{c.emoji}</span>
                <p className="font-semibold text-sm mt-2">{c.label}</p>
                <p className="text-xs opacity-70">{n} documento{n !== 1 ? "s" : ""}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {carpeta && !q && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setCarpeta(null)}>
              <ArrowLeft className="w-4 h-4" />{CARPETAS[carpeta].emoji} {CARPETAS[carpeta].label}
            </Button>
          )}
          {lista.length === 0 && <Card className="p-8 text-center text-sm text-muted-foreground">No hay documentos aquí todavía</Card>}
          {lista.map((d) => (
            <Card key={d.id} className="p-3 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{d.titulo}</p>
                <p className="text-xs text-muted-foreground">{d.codigo} · v{d.version}{d.vigencia_desde && ` · Vigente desde ${d.vigencia_desde}`}</p>
              </div>
              {d.archivo_uri && (
                <Button size="sm" className="gap-1" onClick={() => abrirArchivo(d.archivo_uri)}><Download className="w-4 h-4" />Abrir</Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}