import { toast } from "@/components/ui/use-toast";
import { Clock, CheckCircle2, Undo2, XCircle, Mail } from "lucide-react";

const TIPOS = {
  en_revision: { Icon: Clock, title: "Enviado al Director", cls: "bg-amber-500" },
  aprobado: { Icon: CheckCircle2, title: "Documento aprobado", cls: "bg-green-600" },
  devuelto: { Icon: Undo2, title: "Devuelto con sugerencias", cls: "bg-primary" },
  rechazado: { Icon: XCircle, title: "Documento rechazado", cls: "bg-red-600" },
};

export function notificar(estado, titulo) {
  const { Icon, title, cls } = TIPOS[estado];
  toast({
    title: (
      <span className="flex items-center gap-2">
        <span className={`w-7 h-7 rounded-lg ${cls} text-white flex items-center justify-center shrink-0`}><Icon className="w-4 h-4" /></span>
        {title}
      </span>
    ),
    description: (
      <div className="mt-1 space-y-1">
        <p className="text-sm font-medium truncate">{titulo}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />Correo enviado al Director y al Prevencionista</p>
      </div>
    ),
  });
}