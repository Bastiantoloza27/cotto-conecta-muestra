import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Users, User } from "lucide-react";

const AREAS = ["salud", "cuidado", "administracion", "pastoral", "servicios_generales", "otro"];
const AREA_LABELS = {
  salud: "Salud", cuidado: "Cuidado", administracion: "Administración",
  pastoral: "Pastoral", servicios_generales: "Servicios Generales", otro: "Otro"
};

const EMPTY_FORM = {
  titulo: "",
  mensaje: "",
  prioridad: "informativo",
  requiere_confirmacion: false,
};

export default function NuevoAvisoDialog({ open, onClose, onEnviar, onBorrador, allUsers, staffMembers, sending }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [modoDestino, setModoDestino] = useState("todos"); // "todos" | "area" | "personas"
  const [areaSeleccionada, setAreaSeleccionada] = useState("salud");
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState([]); // emails

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const togglePersona = (email) => {
    setPersonasSeleccionadas(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const resolverAreasDestino = () => {
    if (modoDestino === "todos") return "todos";
    if (modoDestino === "area") return areaSeleccionada;
    return "personas_especificas";
  };

  const resolverDestinatariosEmails = () => {
    // Usuarios de plataforma + staff sin cuenta, sin duplicados
    const emailsEnPlataforma = new Set(allUsers.map(u => u.email).filter(Boolean));
    const staffSinCuenta = staffMembers.filter(s => s.email && !emailsEnPlataforma.has(s.email));
    const todosConArea = [
      ...allUsers.filter(u => u.email).map(u => {
        const staffMatch = staffMembers.find(s => s.email === u.email);
        return { email: u.email, full_name: u.full_name, area: staffMatch?.area || "" };
      }),
      ...staffSinCuenta.map(s => ({ email: s.email, full_name: s.full_name, area: s.area || "" })),
    ];
    if (modoDestino === "todos") return todosConArea;
    if (modoDestino === "area") return todosConArea.filter(d => d.area === areaSeleccionada);
    // personas específicas
    return personasSeleccionadas.map(email => {
      const found = todosConArea.find(x => x.email === email);
      return { email, full_name: found?.full_name || email, area: found?.area || "" };
    });
  };

  const handleEnviar = () => {
    onEnviar({
      form: { ...form, areas_destino: resolverAreasDestino() },
      destinatarios: resolverDestinatariosEmails(),
    });
    handleClose();
  };

  const handleBorrador = () => {
    onBorrador({ ...form, areas_destino: resolverAreasDestino() });
    handleClose();
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setModoDestino("todos");
    setPersonasSeleccionadas([]);
    onClose();
  };

  // Combinar users + staff con email para el selector de personas (sin duplicados)
  const emailsEnPlataforma = new Set(allUsers.map(u => u.email).filter(Boolean));
  const todasLasPersonas = [
    ...allUsers.filter(u => u.email).map(u => ({ email: u.email, nombre: u.full_name || u.email, fuente: "usuario" })),
    ...staffMembers
      .filter(s => s.email && !emailsEnPlataforma.has(s.email))
      .map(s => ({ email: s.email, nombre: s.full_name || s.email, fuente: "personal" }))
  ];

  const valid = form.titulo.trim() && form.mensaje.trim() &&
    (modoDestino !== "personas" || personasSeleccionadas.length > 0);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo aviso</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Título */}
          <div>
            <Label className="text-xs mb-1 block font-semibold">Título *</Label>
            <Input
              value={form.titulo}
              onChange={e => set("titulo", e.target.value)}
              placeholder="Ej: Reunión de equipo mañana"
            />
          </div>

          {/* Mensaje */}
          <div>
            <Label className="text-xs mb-1 block font-semibold">Mensaje *</Label>
            <Textarea
              value={form.mensaje}
              onChange={e => set("mensaje", e.target.value)}
              rows={4}
              placeholder="Escribe el contenido del aviso..."
            />
          </div>

          {/* Prioridad */}
          <div>
            <Label className="text-xs mb-1 block font-semibold">Prioridad</Label>
            <Select value={form.prioridad} onValueChange={v => set("prioridad", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="informativo">📗 Informativo</SelectItem>
                <SelectItem value="importante">⚠️ Importante</SelectItem>
                <SelectItem value="urgente">🚨 Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destinatarios */}
          <div>
            <Label className="text-xs mb-2 block font-semibold">¿A quién va dirigido?</Label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { key: "todos", label: "Todos", IconC: Users },
                { key: "area", label: "Por área", IconC: Users },
                { key: "personas", label: "Personas", IconC: User },
              ].map(({ key, label, IconC }) => (
                <button
                  key={key}
                  onClick={() => setModoDestino(key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                    modoDestino === key
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <IconC className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {modoDestino === "area" && (
              <Select value={areaSeleccionada} onValueChange={setAreaSeleccionada}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AREAS.map(a => (
                    <SelectItem key={a} value={a}>{AREA_LABELS[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {modoDestino === "personas" && (
              <div className="border rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5">
                {todasLasPersonas.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No hay personas con email registrado</p>
                ) : (
                  todasLasPersonas.map(p => (
                    <label key={p.email} className="flex items-center gap-2.5 cursor-pointer p-1 rounded hover:bg-muted/50">
                      <Checkbox
                        checked={personasSeleccionadas.includes(p.email)}
                        onCheckedChange={() => togglePersona(p.email)}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{p.nombre}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                      </div>
                      <span className={`text-[10px] ml-auto shrink-0 px-1.5 py-0.5 rounded-full ${
                        p.fuente === "usuario" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {p.fuente === "usuario" ? "Usuario" : "Personal"}
                      </span>
                    </label>
                  ))
                )}
                {personasSeleccionadas.length > 0 && (
                  <p className="text-[11px] text-primary font-medium pt-1 border-t">{personasSeleccionadas.length} persona(s) seleccionada(s)</p>
                )}
              </div>
            )}
          </div>

          {/* Requiere confirmación */}
          <div className="flex items-center gap-3">
            <Switch
              checked={form.requiere_confirmacion}
              onCheckedChange={v => set("requiere_confirmacion", v)}
            />
            <Label className="text-sm">Requiere confirmación de lectura</Label>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleClose}>Cancelar</Button>
            <Button variant="outline" size="sm" onClick={handleBorrador} disabled={!form.titulo || !form.mensaje}>
              Guardar borrador
            </Button>
            <Button size="sm" onClick={handleEnviar} disabled={!valid || sending}>
              {sending ? "Enviando..." : <><Send className="w-3.5 h-3.5 mr-1" /> Enviar</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}