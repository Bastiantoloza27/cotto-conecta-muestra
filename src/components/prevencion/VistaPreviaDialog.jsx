import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ExternalLink } from "lucide-react";
import { CARPETAS } from "./constants";

const ext = (n = "") => n.split(".").pop().toLowerCase();

function Preview({ url, nombre }) {
  const e = ext(nombre);
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(e)) return <img src={url} alt={nombre} className="w-full h-full object-contain" />;
  if (e === "pdf") return <iframe src={url} title={nombre} className="w-full h-full" />;
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(e))
    return <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`} title={nombre} className="w-full h-full" />;
  return <p className="text-sm text-white/70 m-auto">No hay vista previa disponible para este formato</p>;
}

export default function VistaPreviaDialog({ doc, onClose }) {
  const { data: url, isLoading } = useQuery({
    queryKey: ["signed", doc?.archivo_uri],
    enabled: !!doc?.archivo_uri,
    queryFn: () => base44.integrations.Core.CreateFileSignedUrl({ file_uri: doc.archivo_uri, expires_in: 1800 }).then((r) => r.signed_url),
  });
  if (!doc) return null;

  const props = [
    ["Código", doc.codigo], ["Carpeta", CARPETAS[doc.carpeta]?.label], ["Versión", doc.version],
    ["Vigencia desde", doc.vigencia_desde], ["Próxima revisión", doc.proxima_revision],
    ["Autor", doc.autor_nombre], ["Archivo", doc.archivo_nombre],
  ];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw]">
        <DialogHeader><DialogTitle className="pr-6">{doc.titulo}</DialogTitle></DialogHeader>
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          <div className="bg-neutral-800 rounded-lg h-[60vh] flex overflow-hidden">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white m-auto" /> : url && <Preview url={url} nombre={doc.archivo_nombre} />}
          </div>
          <div className="space-y-3">
            <div className="bg-primary text-primary-foreground text-sm font-semibold rounded-t-lg px-3 py-2">Propiedades del archivo</div>
            <dl className="space-y-2 text-sm px-1">
              {props.map(([k, v]) => (
                <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="break-words">{v || "—"}</dd></div>
              ))}
            </dl>
            {doc.descripcion && <p className="text-xs text-muted-foreground px-1">{doc.descripcion}</p>}
            {url && (
              <div className="flex flex-col gap-2">
                <a href={url} download={doc.archivo_nombre}><Button className="w-full gap-2"><Download className="w-4 h-4" />Descargar</Button></a>
                <a href={url} target="_blank" rel="noreferrer"><Button variant="outline" className="w-full gap-2"><ExternalLink className="w-4 h-4" />Abrir en pestaña nueva</Button></a>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}