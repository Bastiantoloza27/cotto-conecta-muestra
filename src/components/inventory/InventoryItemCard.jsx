import { Pencil, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export function getStockLevel(item) {
  const { current_stock = 0, minimum_stock = 0, warning_stock = 0 } = item;
  if (minimum_stock > 0 && current_stock <= minimum_stock) return "critico";
  if (warning_stock > 0 && current_stock <= warning_stock) return "moderado";
  return "ok";
}

const levelStyles = {
  ok:       { bar: "bg-green-500",  text: "text-green-700",  badge: "bg-green-100 text-green-800",  label: "OK",       card: "" },
  moderado: { bar: "bg-amber-400",  text: "text-amber-700",  badge: "bg-amber-100 text-amber-800",  label: "Moderado", card: "border-amber-300" },
  critico:  { bar: "bg-red-500",    text: "text-red-700",    badge: "bg-red-100 text-red-800",      label: "Crítico",  card: "border-red-300 bg-red-50/30" },
};

export default function InventoryItemCard({ item, onEdit, onDelete }) {
  const level = getStockLevel(item);
  const styles = levelStyles[level];

  const maxRef = Math.max(item.warning_stock || 0, item.minimum_stock || 0) * 3 || item.current_stock || 1;
  const pct = Math.min(100, Math.round((item.current_stock / maxRef) * 100));

  return (
    <Card className={`p-3 transition-all ${styles.card}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{item.name}</p>
          {item.category === "vestuario" && (item.tipo_prenda || item.talla) ? (
            <p className="text-[10px] text-muted-foreground">
              {item.tipo_prenda ? item.tipo_prenda.replace("_", " ") : ""}
              {item.tipo_prenda && item.talla ? " · " : ""}
              {item.talla ? `Talla ${item.talla}` : ""}
            </p>
          ) : item.subcategory ? (
            <p className="text-[10px] text-muted-foreground">{item.subcategory}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(item)}>
            <Pencil className="w-3 h-3" />
          </Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Stock display */}
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-2xl font-bold leading-none ${styles.text}`}>{item.current_stock ?? 0}</span>
        <span className="text-xs text-muted-foreground mb-0.5">{item.unit || "unid."}</span>
        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles.badge}`}>
          {styles.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all ${styles.bar}`} style={{ width: `${pct}%` }} />
      </div>

      {/* Thresholds */}
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        {item.warning_stock > 0 && (
          <span>🟡 Alerta: {item.warning_stock} {item.unit || ""}</span>
        )}
        {item.minimum_stock > 0 && (
          <span>🔴 Crítico: {item.minimum_stock} {item.unit || ""}</span>
        )}
      </div>

      {item.location && (
        <p className="text-[10px] text-muted-foreground mt-1">📍 {item.location}</p>
      )}
      {item.last_restock_date && (
        <p className="text-[10px] text-muted-foreground">
          🔄 Reposición: {format(parseISO(item.last_restock_date), "dd MMM yyyy", { locale: es })}
        </p>
      )}
      {item.expiry_date && (() => {
        const days = differenceInDays(parseISO(item.expiry_date), new Date());
        const expired = days < 0;
        const soon = days >= 0 && days <= 30;
        return (
          <p className={`text-[10px] font-medium mt-0.5 ${expired ? "text-red-600" : soon ? "text-amber-600" : "text-muted-foreground"}`}>
            {expired ? "⛔" : soon ? "⚠️" : "📅"} Vence: {format(parseISO(item.expiry_date), "dd MMM yyyy", { locale: es })}
            {expired && " (VENCIDO)"}
            {!expired && soon && ` (en ${days}d)`}
          </p>
        );
      })()}
    </Card>
  );
}