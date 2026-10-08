import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { embedUrl, extension } from "./utils";

export default function VisorRecurso({ recurso }) {
  const [src, setSrc] = useState(recurso.url || null);

  useEffect(() => {
    if (recurso.tipo === "archivo") {
      setSrc(null);
      base44.integrations.Core.CreateFileSignedUrl({ file_uri: recurso.uri, expires_in: 3600 }).then((r) => setSrc(r.signed_url));
    } else setSrc(recurso.url);
  }, [recurso]);

  if (!src) return <div className="aspect-video flex items-center justify-center bg-muted rounded-xl"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const ext = extension(recurso.nombre_archivo || src);
  const embed = recurso.tipo === "link" ? embedUrl(src) : null;
  const marco = "w-full aspect-video rounded-xl bg-black";

  if (embed) return <iframe src={embed} className={marco} allow="autoplay; fullscreen; encrypted-media" allowFullScreen title={recurso.titulo} />;
  if (["mp4", "webm", "mov", "m4v", "ogg"].includes(ext)) return <video src={src} controls className={marco} />;
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return <img src={src} alt={recurso.titulo} className="w-full rounded-xl object-contain max-h-[60vh] bg-muted" />;
  if (ext === "pdf") return <iframe src={src} className="w-full h-[60vh] rounded-xl border" title={recurso.titulo} />;

  return (
    <div className="aspect-video flex flex-col items-center justify-center gap-3 bg-muted rounded-xl text-center p-6">
      <p className="text-sm text-muted-foreground">Este material se abre en una nueva pestaña.</p>
      <Button asChild className="gap-2"><a href={src} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" />Abrir material</a></Button>
    </div>
  );
}