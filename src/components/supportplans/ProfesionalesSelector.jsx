import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, ChevronUp, Users } from "lucide-react";

/**
 * ProfesionalesSelector
 *
 * value: JSON string  →  [{ id, nombre, cargo, objetivo_individual, objetivo_conjunto }]
 * onChange: (jsonString) => void
 */
export default function ProfesionalesSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff-activo"],
    queryFn: () => base44.entities.StaffMember.list("-full_name", 200),
  });

  // Parse current value
  const parsed = (() => {
    try { return JSON.parse(value || "[]"); } catch { return []; }
  })();

  const isSelected = (id) => parsed.some((p) => p.id === id);

  const toggleStaff = (member) => {
    let next;
    if (isSelected(member.id)) {
      next = parsed.filter((p) => p.id !== member.id);
    } else {
      next = [...parsed, {
        id: member.id,
        nombre: member.full_name,
        cargo: member.position,
        objetivo_individual: "",
        objetivo_conjunto: "",
      }];
    }
    onChange(JSON.stringify(next));
  };

  const updateField = (id, field, val) => {
    const next = parsed.map((p) => p.id === id ? { ...p, [field]: val } : p);
    onChange(JSON.stringify(next));
  };

  const positionLabel = {
    director: "Director/a",
    enfermero: "Enfermero/a",
    tecnico_enfermeria: "TENS",
    kinesiologo: "Kinesiólogo/a",
    terapeuta_ocupacional: "Terapeuta Ocupacional",
    psicologo: "Psicólogo/a",
    trabajador_social: "Trabajador/a Social",
    nutricionista: "Nutricionista",
    medico: "Médico/a",
    auxiliar_cuidado: "Auxiliar de Cuidado",
    capellan: "Capellán",
    voluntario: "Voluntario/a",
    otro: "Otro",
  };

  const relevantStaff = staff.filter(s =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    (positionLabel[s.position] || s.position || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Selector */}
      <div className="border rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/60 transition-colors text-sm"
        >
          <span className="flex items-center gap-2 font-medium">
            <Users className="w-4 h-4 text-muted-foreground" />
            {parsed.length === 0
              ? "Seleccionar profesionales involucrados"
              : `${parsed.length} profesional${parsed.length > 1 ? "es" : ""} seleccionado${parsed.length > 1 ? "s" : ""}`}
          </span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {open && (
          <div className="border-t">
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Buscar por nombre o cargo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
            </div>
            <div className="max-h-52 overflow-y-auto divide-y divide-border/50">
            {isLoading && (
              <p className="text-xs text-muted-foreground text-center py-4">Cargando personal...</p>
            )}
            {!isLoading && relevantStaff.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                {staff.length === 0 ? "No hay personal registrado en el sistema." : "Sin resultados para la búsqueda."}
              </p>
            )}
            {relevantStaff.map((member) => {
              const selected = isSelected(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleStaff(member)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${selected ? "bg-primary/5" : "hover:bg-muted/40"}`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "bg-primary border-primary" : "border-border"}`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{member.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{positionLabel[member.position] || member.position}</p>
                  </div>
                </button>
              );
            })}
          </div>
            </div>
        )}
      </div>

      {/* Objetivos por profesional */}
      {parsed.length > 0 && (
        <div className="space-y-3">
          {/* Objetivo conjunto (si hay 2+) */}
          {parsed.length >= 2 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                🤝 Objetivo de trabajo conjunto del equipo
              </p>
              <Textarea
                placeholder="¿Qué meta comparte todo el equipo interdisciplinar para este plan?"
                rows={2}
                className="text-xs bg-white"
                value={parsed[0]?.objetivo_conjunto || ""}
                onChange={(e) => {
                  // Sync objetivo_conjunto across all selected
                  const next = parsed.map(p => ({ ...p, objetivo_conjunto: e.target.value }));
                  onChange(JSON.stringify(next));
                }}
              />
            </div>
          )}

          {/* Objetivos individuales */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              👤 Objetivos individuales por profesional
            </p>
            {parsed.map((p) => (
              <div key={p.id} className="rounded-lg border bg-white p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{positionLabel[p.cargo] || p.cargo}</Badge>
                  <span className="text-xs font-medium">{p.nombre}</span>
                </div>
                <Input
                  placeholder="Objetivo individual de este profesional en el plan..."
                  className="text-xs h-8"
                  value={p.objetivo_individual || ""}
                  onChange={(e) => updateField(p.id, "objetivo_individual", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}