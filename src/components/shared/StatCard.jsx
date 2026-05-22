import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, trend, className }) {
  return (
    <Card className={cn("p-5 hover:shadow-md transition-shadow duration-200", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1.5">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground mt-1">{trend}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>
    </Card>
  );
}