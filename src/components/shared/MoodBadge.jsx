import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const moodConfig = {
  muy_bien: { emoji: "😊", label: "Muy bien", class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  bien: { emoji: "🙂", label: "Bien", class: "bg-green-50 text-green-700 border-green-200" },
  regular: { emoji: "😐", label: "Regular", class: "bg-amber-50 text-amber-700 border-amber-200" },
  bajo: { emoji: "😔", label: "Bajo", class: "bg-orange-50 text-orange-700 border-orange-200" },
  critico: { emoji: "😢", label: "Crítico", class: "bg-red-50 text-red-700 border-red-200" },
};

export default function MoodBadge({ mood }) {
  const config = moodConfig[mood];
  if (!config) return null;
  return (
    <Badge variant="outline" className={cn("gap-1 font-normal", config.class)}>
      {config.emoji} {config.label}
    </Badge>
  );
}