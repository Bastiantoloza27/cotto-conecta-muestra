import { Button } from "@/components/ui/button";

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon: ActionIcon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <Button onClick={action} className="gap-2 shrink-0">
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}