import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, PlayCircle, BookOpen } from "lucide-react";

const COLOR_MAP = {
  purple: "from-purple-50 to-purple-100/50 border-purple-200",
  blue:   "from-blue-50 to-blue-100/50 border-blue-200",
  green:  "from-green-50 to-green-100/50 border-green-200",
  orange: "from-orange-50 to-orange-100/50 border-orange-200",
  pink:   "from-pink-50 to-pink-100/50 border-pink-200",
  teal:   "from-teal-50 to-teal-100/50 border-teal-200",
};

const EMOJI_BG = {
  purple: "bg-purple-100",
  blue:   "bg-blue-100",
  green:  "bg-green-100",
  orange: "bg-orange-100",
  pink:   "bg-pink-100",
  teal:   "bg-teal-100",
};

export default function NovedadCard({ novedad, tipoConfig, isAdmin, destacada, borrador, onEdit, onDelete, onVerTutorial }) {
  const colorKey = novedad.color || "purple";
  const gradientClass = COLOR_MAP[colorKey] || COLOR_MAP.purple;
  const emojiBgClass = EMOJI_BG[colorKey] || EMOJI_BG.purple;
  const TipoIcon = tipoConfig?.icon;

  return (
    <div className={`relative rounded-2xl border bg-gradient-to-br p-5 flex flex-col gap-3 transition-all hover:shadow-md ${gradientClass} ${destacada ? "ring-2 ring-yellow-300/60" : ""} ${borrador ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${emojiBgClass}`}>
          {novedad.emoji || "✨"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            {tipoConfig && (
              <Badge className={`text-[10px] border gap-1 ${tipoConfig.color}`}>
                {TipoIcon && <TipoIcon className="w-3 h-3" />}
                {tipoConfig.label}
              </Badge>
            )}
            {borrador && <Badge variant="outline" className="text-[10px]">Borrador</Badge>}
            {destacada && <span className="text-[10px] text-yellow-600 font-semibold">⭐ Destacado</span>}
          </div>
          {novedad.modulo && (
            <p className="text-[10px] text-muted-foreground">{novedad.modulo}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="flex-1">
        <h3 className="font-semibold text-sm leading-snug mb-1">{novedad.titulo}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{novedad.descripcion}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-black/5">
        <span className="text-[10px] text-muted-foreground">
          {novedad.fecha_publicacion
            ? format(parseISO(novedad.fecha_publicacion), "d MMM yyyy", { locale: es })
            : "Sin fecha"}
        </span>
        {onVerTutorial && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 bg-white/70"
            onClick={onVerTutorial}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Ver tutorial
          </Button>
        )}
      </div>
    </div>
  );
}