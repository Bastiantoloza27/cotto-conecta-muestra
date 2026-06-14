import { Button } from "@/components/ui/button";

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon: ActionIcon }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">{subtitle}</p>}
      </div>
      {action && (
        <Button onClick={action} className="gap-2 shrink-0 h-9 px-3 sm:px-4 text-sm">
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          <span className="hidden sm:inline">{actionLabel}</span>
          <span className="sm:hidden">{ActionIcon ? "" : actionLabel}</span>
        </Button>
      )}
    </div>
  );
}