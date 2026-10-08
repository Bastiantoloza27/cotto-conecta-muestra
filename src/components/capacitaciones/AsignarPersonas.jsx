import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

export default function AsignarPersonas({ seleccion, onChange }) {
  const { data: users = [] } = useQuery({ queryKey: ["usuarios-app"], queryFn: () => base44.entities.User.list() });
  const toggle = (u) => onChange(seleccion.some((s) => s.email === u.email) ? seleccion.filter((s) => s.email !== u.email) : [...seleccion, { email: u.email, nombre: u.full_name }]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Trabajadores <span className="ml-1 text-xs bg-green-100 text-green-700 rounded px-2 py-0.5">{seleccion.length} personas</span></span>
        <Button type="button" variant="link" size="sm" onClick={() => onChange(users.map((u) => ({ email: u.email, nombre: u.full_name })))}>Seleccionar todos</Button>
      </div>
      <div className="border rounded-lg max-h-56 overflow-y-auto divide-y">
        {users.map((u) => (
          <label key={u.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
            <Checkbox checked={seleccion.some((s) => s.email === u.email)} onCheckedChange={() => toggle(u)} />
            <span className="flex-1">{u.full_name || u.email}</span>
            <span className="text-xs text-muted-foreground">{u.email}</span>
          </label>
        ))}
      </div>
    </div>
  );
}