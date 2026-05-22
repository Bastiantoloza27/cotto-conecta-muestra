import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail, Pencil, Trash2, User } from "lucide-react";

const POSITION_LABELS = {
  director: "Director/a",
  enfermero: "Enfermero/a",
  tecnico_enfermeria: "Téc. Enfermería",
  kinesiologo: "Kinesiólogo/a",
  terapeuta_ocupacional: "Terapeuta Ocup.",
  psicologo: "Psicólogo/a",
  trabajador_social: "Trabajador/a Social",
  nutricionista: "Nutricionista",
  medico: "Médico/a",
  auxiliar_cuidado: "Auxiliar de Cuidado",
  auxiliar_aseo: "Auxiliar de Aseo",
  administrativo: "Administrativo/a",
  capellan: "Capellán",
  voluntario: "Voluntario/a",
  otro: "Otro",
};

const AREA_LABELS = {
  salud: "Salud",
  cuidado: "Cuidado",
  administracion: "Administración",
  pastoral: "Pastoral",
  servicios_generales: "Servicios Generales",
  otro: "Otro",
};

const AREA_COLORS = {
  salud: "bg-blue-100 text-blue-800 border-blue-200",
  cuidado: "bg-green-100 text-green-800 border-green-200",
  administracion: "bg-purple-100 text-purple-800 border-purple-200",
  pastoral: "bg-amber-100 text-amber-800 border-amber-200",
  servicios_generales: "bg-gray-100 text-gray-700 border-gray-200",
  otro: "bg-muted text-muted-foreground border-border",
};

const STATUS_COLORS = {
  activo: "bg-emerald-100 text-emerald-800",
  licencia: "bg-orange-100 text-orange-800",
  vacaciones: "bg-sky-100 text-sky-800",
  inactivo: "bg-red-100 text-red-800",
};

const SHIFT_LABELS = {
  manana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
  mixto: "Mixto",
  administrativo: "Administrativo",
};

const EMPTY_FORM = {
  full_name: "", rut: "", position: "", area: "", responsibilities: "",
  shift_type: "", phone: "", email: "", admission_date: "",
  contract_type: "", status: "activo", specializations: "", notes: "", photo_url: "",
};

export default function Staff() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.StaffMember.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffMember.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); setShowForm(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffMember.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); setEditingStaff(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StaffMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const filtered = staff.filter(s => {
    const matchSearch = s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      POSITION_LABELS[s.position]?.toLowerCase().includes(search.toLowerCase());
    const matchArea = filterArea === "todos" || s.area === filterArea;
    return matchSearch && matchArea;
  });

  const openEdit = (member) => setEditingStaff({ ...member });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate({ id: editingStaff.id, data: editingStaff });
  };

  const activeCount = staff.filter(s => s.status === "activo").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Personal</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeCount} funcionario{activeCount !== 1 ? "s" : ""} activo{activeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Agregar funcionario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o cargo..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {["todos", ...Object.keys(AREA_LABELS)].map(area => (
            <button
              key={area}
              onClick={() => setFilterArea(area)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filterArea === area
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {area === "todos" ? "Todos" : AREA_LABELS[area]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No se encontraron funcionarios</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                    {member.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-tight">{member.full_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{POSITION_LABELS[member.position] || member.position}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(member)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(member.id)} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {member.area && (
                  <Badge variant="outline" className={`text-[10px] ${AREA_COLORS[member.area]}`}>
                    {AREA_LABELS[member.area]}
                  </Badge>
                )}
                {member.status && (
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[member.status]}`}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Badge>
                )}
                {member.shift_type && (
                  <Badge variant="outline" className="text-[10px]">
                    {SHIFT_LABELS[member.shift_type]}
                  </Badge>
                )}
                {member.contract_type && (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {member.contract_type}
                  </Badge>
                )}
              </div>

              {member.responsibilities && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{member.responsibilities}</p>
              )}

              <div className="space-y-1 mt-auto">
                {member.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" /> {member.phone}
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" /> {member.email}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New staff dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar funcionario</DialogTitle>
          </DialogHeader>
          <StaffForm form={form} setForm={setForm} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} isPending={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit staff dialog */}
      {editingStaff && (
        <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar funcionario</DialogTitle>
            </DialogHeader>
            <StaffForm form={editingStaff} setForm={setEditingStaff} onSubmit={handleUpdate} onCancel={() => setEditingStaff(null)} isPending={updateMutation.isPending} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function StaffForm({ form, setForm, onSubmit, onCancel, isPending }) {
  const f = (field) => (val) => setForm(prev => ({ ...prev, [field]: typeof val === "string" ? val : val.target.value }));
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label>Nombre completo *</Label>
          <Input value={form.full_name} onChange={f("full_name")} required />
        </div>
        <div className="space-y-1.5">
          <Label>RUT</Label>
          <Input value={form.rut} onChange={f("rut")} placeholder="12.345.678-9" />
        </div>
        <div className="space-y-1.5">
          <Label>Cargo *</Label>
          <Select value={form.position} onValueChange={f("position")}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {Object.entries(POSITION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Área</Label>
          <Select value={form.area} onValueChange={f("area")}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {Object.entries(AREA_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Turno habitual</Label>
          <Select value={form.shift_type} onValueChange={f("shift_type")}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              {Object.entries(SHIFT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de contrato</Label>
          <Select value={form.contract_type} onValueChange={f("contract_type")}>
            <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planta">Planta</SelectItem>
              <SelectItem value="contrata">Contrata</SelectItem>
              <SelectItem value="honorarios">Honorarios</SelectItem>
              <SelectItem value="voluntario">Voluntario</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select value={form.status} onValueChange={f("status")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="licencia">Licencia</SelectItem>
              <SelectItem value="vacaciones">Vacaciones</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Fecha de ingreso</Label>
          <Input type="date" value={form.admission_date} onChange={f("admission_date")} />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input value={form.phone} onChange={f("phone")} placeholder="+56 9 1234 5678" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={form.email} onChange={f("email")} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Responsabilidades y funciones</Label>
          <Textarea value={form.responsibilities} onChange={f("responsibilities")} rows={3} placeholder="Describe las principales funciones y responsabilidades..." />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Especializaciones / habilidades</Label>
          <Input value={form.specializations} onChange={f("specializations")} placeholder="Ej: atención a personas con discapacidad intelectual, primeros auxilios..." />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label>Notas adicionales</Label>
          <Textarea value={form.notes} onChange={f("notes")} rows={2} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar"}</Button>
      </div>
    </form>
  );
}