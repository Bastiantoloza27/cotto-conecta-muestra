import { useState } from "react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, RefreshCw } from "lucide-react";
import { CARPETAS, ESTADOS } from "./constants";
import SubirDocumentoDialog from "./SubirDocumentoDialog";
import RevisionDialog from "./RevisionDialog";

export default function GestionTab({ docs, isAdmin, refetch }) {
  const [subir, setSubir] = useState(false);
  const [reenviar, setReenviar] = useState(null);
  const [ver, setVer] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const lista = docs.filter((d) => filtro === "todos" || d.estado === filtro);
  const pendientes = docs.filter((d) => d.estado === "en_revision").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setSubir(true)} className="gap-2"><Upload className="w-4 h-4" />Subir documento</Button>
        {isAdmin && pendientes > 0 && <Badge className="bg-amber-100 text-amber-800">{pendientes} pendiente{pendientes > 1 ? "s" : ""} de tu revisión</Badge>}
        <div className="flex gap-1 ml-auto flex-wrap">
          {["todos", ...Object.keys(ESTADOS)].map((e) => (
            <Button key={e} size="sm" variant={filtro === e ? "default" : "outline"} className="text-xs h-8" onClick={() => setFiltro(e)}>
              {e === "todos" ? "Todos" : ESTADOS[e].label}
            </Button>
          ))}
        </div>
      </div>

      {lista.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No hay documentos en esta vista</Card>
      ) : (
        <div className="space-y-2">
          {lista.map((d) => (
            <Card key={d.id} className="p-3 flex items-center gap-3 hover:shadow-sm cursor-pointer" onClick={() => setVer(d)}>
              <FileText className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{d.codigo && `${d.codigo} · `}{d.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {CARPETAS[d.carpeta]?.label} · v{d.version} · {d.autor_nombre} · {format(new Date(d.updated_date), "dd/MM/yyyy")}
                </p>
              </div>
              {d.estado === "devuelto" && (
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={(e) => { e.stopPropagation(); setReenviar(d); }}>
                  <RefreshCw className="w-3 h-3" />Corregir
                </Button>
              )}
              <Badge className={ESTADOS[d.estado]?.cls}>{ESTADOS[d.estado]?.label}</Badge>
            </Card>
          ))}
        </div>
      )}

      {subir && <SubirDocumentoDialog open onOpenChange={setSubir} onSaved={refetch} />}
      {reenviar && <SubirDocumentoDialog open doc={reenviar} onOpenChange={() => setReenviar(null)} onSaved={refetch} />}
      <RevisionDialog doc={ver} isAdmin={isAdmin} onClose={() => setVer(null)} onSaved={refetch} />
    </div>
  );
}