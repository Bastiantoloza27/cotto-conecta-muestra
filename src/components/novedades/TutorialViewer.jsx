import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

export default function TutorialViewer({ novedad, onClose }) {
  const [paso, setPaso] = useState(0);

  let pasos = [];
  try { pasos = JSON.parse(novedad.pasos || "[]"); } catch { pasos = []; }

  if (!pasos.length) return null;

  const current = pasos[paso];
  const isLast = paso === pasos.length - 1;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {novedad.emoji || "📖"} {novedad.titulo}
          </DialogTitle>
        </DialogHeader>

        {/* Progreso */}
        <div className="flex gap-1.5 mb-2">
          {pasos.map((_, i) => (
            <div
              key={i}
              onClick={() => setPaso(i)}
              className={`h-1.5 rounded-full flex-1 cursor-pointer transition-all ${
                i <= paso ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">
          Paso {paso + 1} de {pasos.length}
        </p>

        {/* Contenido del paso */}
        <div className="space-y-4">
          {current.imagen_url && (
            <img
              src={current.imagen_url}
              alt={current.titulo}
              className="w-full rounded-xl border object-cover max-h-52"
            />
          )}
          <div className="bg-muted/40 rounded-xl p-4 space-y-2">
            <h3 className="font-semibold text-sm">{current.titulo}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {current.descripcion}
            </p>
          </div>
        </div>

        {/* Navegación */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={paso === 0}
            onClick={() => setPaso(p => p - 1)}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>

          {isLast ? (
            <Button size="sm" onClick={onClose} className="gap-1.5 bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4" /> ¡Listo!
            </Button>
          ) : (
            <Button size="sm" onClick={() => setPaso(p => p + 1)} className="gap-1">
              Siguiente <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}