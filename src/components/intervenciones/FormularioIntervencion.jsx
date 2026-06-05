import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const PROFESIONES = [
  { key: "nutricionista", label: "Nutricionista", color: "bg-green-100 text-green-800 border-green-300", icon: "🥗" },
  { key: "terapeuta_ocupacional", label: "Terapeuta Ocupacional", color: "bg-purple-100 text-purple-800 border-purple-300", icon: "🤲" },
  { key: "tens", label: "TENS", color: "bg-blue-100 text-blue-800 border-blue-300", icon: "🩺" },
  { key: "kinesiologo", label: "Kinesiólogo/a", color: "bg-orange-100 text-orange-800 border-orange-300", icon: "🏃" },
  { key: "psicologo", label: "Psicólogo/a", color: "bg-pink-100 text-pink-800 border-pink-300", icon: "🧠" },
  { key: "trabajador_social", label: "Trabajador/a Social", color: "bg-teal-100 text-teal-800 border-teal-300", icon: "🤝" },
];

// ─── Tipos de intervención por profesión ───────────────────────────────────
const TIPOS_INTERVENCION = {
  nutricionista: ["Evaluación nutricional", "Control de peso y antropometría", "Educación alimentaria", "Ajuste de dieta terapéutica", "Valoración disfagia", "Seguimiento nutricional", "Otro"],
  terapeuta_ocupacional: ["Evaluación funcional AVD", "Terapia de estimulación cognitiva", "Entrenamiento AVD básicas", "Entrenamiento AVD instrumentales", "Valoración independencia funcional", "Adaptación del entorno", "Estimulación sensorial", "Otro"],
  tens: ["Control signos vitales", "Administración de medicamentos", "Curación herida / úlcera", "Higiene y aseo", "Traslado y posicionamiento", "Registro eliminación", "Apoyo en alimentación", "Sondas y ostomías", "Otro"],
  kinesiologo: ["Evaluación kinésica", "Kinesioterapia respiratoria", "Rehabilitación motora", "Ejercicios de movilidad articular", "Estimulación motriz", "Prevención caídas", "Ejercicios de equilibrio", "Masoterapia", "Otro"],
  psicologo: ["Evaluación psicológica", "Sesión de psicoterapia individual", "Evaluación cognitiva", "Psicoeducación a familia", "Intervención en crisis", "Estimulación cognitiva", "Evaluación estado mental", "Intervención conductual", "Otro"],
  trabajador_social: ["Evaluación social", "Visita familiar", "Gestión de beneficios", "Coordinación con redes de apoyo", "Intervención en crisis familiar", "Trámites legales / judiciales", "Vinculación con familia", "Informe social", "Plan de intervención familiar", "Otro"],
};

// ─── Campos clínicos específicos por profesión ─────────────────────────────
function CamposClinicos({ profesion, datos, onChange }) {
  const set = (k, v) => onChange({ ...datos, [k]: v });

  if (profesion === "nutricionista") return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Peso actual (kg)</Label>
        <Input type="number" step="0.1" value={datos.peso || ""} onChange={e => set("peso", e.target.value)} placeholder="Ej: 62.5" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Talla (cm)</Label>
        <Input type="number" value={datos.talla || ""} onChange={e => set("talla", e.target.value)} placeholder="Ej: 165" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">IMC calculado</Label>
        <Input readOnly value={datos.peso && datos.talla ? (datos.peso / Math.pow(datos.talla / 100, 2)).toFixed(1) : ""} className="bg-muted" placeholder="Auto" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Estado nutricional</Label>
        <Select value={datos.estado_nutricional || ""} onValueChange={v => set("estado_nutricional", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Normal", "Bajo peso leve", "Bajo peso moderado", "Bajo peso severo", "Sobrepeso", "Obesidad"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Tipo de dieta</Label>
        <Select value={datos.tipo_dieta || ""} onValueChange={v => set("tipo_dieta", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Normal", "Blanda", "Papilla", "Licuada", "Hiposódica", "Diabética", "Hipocalórica", "Hipercalórica", "Disfagia leve", "Disfagia severa"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Apetito</Label>
        <Select value={datos.apetito || ""} onValueChange={v => set("apetito", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Conservado", "Disminuido", "Ausente", "Aumentado"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Suplementos / soporte nutricional</Label>
        <Input value={datos.suplementos || ""} onChange={e => set("suplementos", e.target.value)} placeholder="Ej: Ensure 200ml c/12h" />
      </div>
    </div>
  );

  if (profesion === "terapeuta_ocupacional") return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Nivel de independencia AVD</Label>
        <Select value={datos.independencia_avd || ""} onValueChange={v => set("independencia_avd", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Independiente", "Supervisión", "Asistencia mínima", "Asistencia moderada", "Asistencia máxima", "Dependiente total"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Estado cognitivo</Label>
        <Select value={datos.estado_cognitivo || ""} onValueChange={v => set("estado_cognitivo", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Conservado", "Leve deterioro", "Deterioro moderado", "Deterioro severo"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Escala Barthel (0-100)</Label>
        <Input type="number" min="0" max="100" step="5" value={datos.barthel || ""} onChange={e => set("barthel", e.target.value)} placeholder="Ej: 60" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Motivación / colaboración</Label>
        <Select value={datos.motivacion || ""} onValueChange={v => set("motivacion", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Muy buena", "Buena", "Regular", "Escasa", "Nula"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Actividades realizadas</Label>
        <Input value={datos.actividades || ""} onChange={e => set("actividades", e.target.value)} placeholder="Ej: Estimulación cognitiva con tablero, ejercicios de destreza manual" />
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Productos de apoyo / adaptaciones</Label>
        <Input value={datos.productos_apoyo || ""} onChange={e => set("productos_apoyo", e.target.value)} placeholder="Ej: Cubiertos adaptados, tablero de comunicación" />
      </div>
    </div>
  );

  if (profesion === "tens") return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">PA (mmHg)</Label>
        <Input value={datos.pa || ""} onChange={e => set("pa", e.target.value)} placeholder="Ej: 120/80" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Saturación O₂ (%)</Label>
        <Input type="number" value={datos.saturacion || ""} onChange={e => set("saturacion", e.target.value)} placeholder="Ej: 97" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Temperatura (°C)</Label>
        <Input type="number" step="0.1" value={datos.temperatura || ""} onChange={e => set("temperatura", e.target.value)} placeholder="Ej: 36.5" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">FC (lpm)</Label>
        <Input type="number" value={datos.fc || ""} onChange={e => set("fc", e.target.value)} placeholder="Ej: 72" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Dolor (EVA 0-10)</Label>
        <Input type="number" min="0" max="10" value={datos.dolor_eva || ""} onChange={e => set("dolor_eva", e.target.value)} placeholder="0-10" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Estado piel / heridas</Label>
        <Select value={datos.estado_piel || ""} onValueChange={v => set("estado_piel", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Íntegra", "UPP grado I", "UPP grado II", "UPP grado III", "UPP grado IV", "Herida crónica", "Herida aguda", "Otra lesión"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Medicamentos administrados</Label>
        <Input value={datos.medicamentos || ""} onChange={e => set("medicamentos", e.target.value)} placeholder="Ej: Paracetamol 500mg VO 08:00h" />
      </div>
    </div>
  );

  if (profesion === "kinesiologo") return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Estado respiratorio</Label>
        <Select value={datos.estado_respiratorio || ""} onValueChange={v => set("estado_respiratorio", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Normal", "Leve compromiso", "Moderado compromiso", "Severo compromiso"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Tono muscular</Label>
        <Select value={datos.tono_muscular || ""} onValueChange={v => set("tono_muscular", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Normal", "Hipotonía leve", "Hipotonía severa", "Hipertonía leve", "Hipertonía severa", "Espasticidad"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Marcha / desplazamiento</Label>
        <Select value={datos.marcha || ""} onValueChange={v => set("marcha", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Independiente", "Con bastón", "Con andador", "Con silla de ruedas manual", "Silla de ruedas eléctrica", "No deambula"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Dolor (EVA 0-10)</Label>
        <Input type="number" min="0" max="10" value={datos.dolor_eva || ""} onChange={e => set("dolor_eva", e.target.value)} placeholder="0-10" />
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Técnicas aplicadas</Label>
        <Input value={datos.tecnicas || ""} onChange={e => set("tecnicas", e.target.value)} placeholder="Ej: Kinesioterapia respiratoria, drenaje postural, ejercicios activos" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Nº sesión</Label>
        <Input type="number" value={datos.num_sesion || ""} onChange={e => set("num_sesion", e.target.value)} placeholder="Ej: 5" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Respuesta al tratamiento</Label>
        <Select value={datos.respuesta || ""} onValueChange={v => set("respuesta", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Muy buena", "Buena", "Regular", "Sin cambios", "Deterioro"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (profesion === "psicologo") return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Estado emocional</Label>
        <Select value={datos.estado_emocional || ""} onValueChange={v => set("estado_emocional", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Estable", "Ansioso/a", "Deprimido/a", "Irritable", "Eufórico/a", "Indiferente", "Lábil", "Angustiado/a"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Estado cognitivo</Label>
        <Select value={datos.estado_cognitivo || ""} onValueChange={v => set("estado_cognitivo", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Conservado", "Leve deterioro", "Deterioro moderado", "Deterioro severo"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Orientación</Label>
        <Select value={datos.orientacion || ""} onValueChange={v => set("orientacion", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Orientado/a en T-E-P", "Desorientado/a temporal", "Desorientado/a espacial", "Desorientado/a en persona", "Desorientación total"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Conducta en sesión</Label>
        <Select value={datos.conducta_sesion || ""} onValueChange={v => set("conducta_sesion", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Colaborador/a", "Parcialmente colaborador/a", "Resistente", "Agitado/a", "Retraído/a"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Mini-Mental / Test aplicado</Label>
        <Input value={datos.test_cognitivo || ""} onChange={e => set("test_cognitivo", e.target.value)} placeholder="Ej: MMSE 24/30, Lobo 28/35" />
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Técnicas / abordaje terapéutico</Label>
        <Input value={datos.tecnicas || ""} onChange={e => set("tecnicas", e.target.value)} placeholder="Ej: Reminiscencia, psicoterapia de apoyo, orientación a la realidad" />
      </div>
    </div>
  );

  if (profesion === "trabajador_social") return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Red de apoyo familiar</Label>
        <Select value={datos.red_apoyo || ""} onValueChange={v => set("red_apoyo", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Activa y presente", "Limitada", "Ausente", "En conflicto", "En proceso de vinculación"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Situación habitacional previa</Label>
        <Select value={datos.situacion_habitacional || ""} onValueChange={v => set("situacion_habitacional", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["Casa propia", "Casa familiar", "Arriendo", "Allegado/a", "Sin vivienda estable", "Otro"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Previsión de salud</Label>
        <Select value={datos.prevision || ""} onValueChange={v => set("prevision", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["FONASA A", "FONASA B", "FONASA C", "FONASA D", "ISAPRE", "Sin previsión", "Otro"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Pensión / ingreso</Label>
        <Select value={datos.pension || ""} onValueChange={v => set("pension", v)}>
          <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
          <SelectContent>
            {["PBS Vejez", "PBS Invalidez", "Pensión contributiva", "Sin pensión", "Otro"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Beneficios / gestiones en curso</Label>
        <Input value={datos.beneficios || ""} onChange={e => set("beneficios", e.target.value)} placeholder="Ej: Gestión SENADIS, bono alivio, credencial discapacidad" />
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs font-semibold">Contacto familiar clave</Label>
        <Input value={datos.contacto_familiar || ""} onChange={e => set("contacto_familiar", e.target.value)} placeholder="Nombre, relación y teléfono" />
      </div>
    </div>
  );

  return null;
}

// ─── Dialog principal ───────────────────────────────────────────────────────
export default function FormularioIntervencion({ open, onClose, resident: residentProp, intervencion, onSave, residents = [] }) {
  const esEdicion = !!intervencion;
  const [resident, setResident] = useState(residentProp || null);

  const [form, setForm] = useState({
    fecha: intervencion?.fecha || format(new Date(), "yyyy-MM-dd"),
    profesion: intervencion?.profesion || "",
    profesional_nombre: intervencion?.profesional_nombre || "",
    tipo_intervencion: intervencion?.tipo_intervencion || "",
    evaluacion: intervencion?.evaluacion || "",
    objetivos: intervencion?.objetivos || "",
    acciones: intervencion?.acciones || "",
    indicaciones: intervencion?.indicaciones || "",
    proxima_sesion: intervencion?.proxima_sesion || "",
    firma: intervencion?.firma || "",
    observaciones: intervencion?.observaciones || "",
  });

  const [datosClinicos, setDatosClinicos] = useState(() => {
    if (intervencion?.datos_clinicos) {
      try { return JSON.parse(intervencion.datos_clinicos); } catch { return {}; }
    }
    return {};
  });

  useEffect(() => {
    setForm(f => ({ ...f, tipo_intervencion: "" }));
    setDatosClinicos({});
  }, [form.profesion]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.profesion) { toast.error("Selecciona la profesión"); return; }
    if (!form.profesional_nombre) { toast.error("Ingresa el nombre del profesional"); return; }
    if (!form.tipo_intervencion) { toast.error("Selecciona el tipo de intervención"); return; }
    if (!resident) { toast.error("Selecciona un residente"); return; }
    await onSave({
      ...form,
      datos_clinicos: JSON.stringify(datosClinicos),
      resident_id: resident.id,
      resident_name: resident.full_name,
    }, intervencion?.id);
    onClose();
  };

  const prof = PROFESIONES.find(p => p.key === form.profesion);
  const tipos = TIPOS_INTERVENCION[form.profesion] || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {prof ? `${prof.icon} Intervención ${prof.label}` : "📋 Nueva Intervención"}
            {resident && <span className="text-muted-foreground font-normal text-sm">— {resident.preferred_name || resident.full_name}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Selector de residente si no viene pre-seleccionado */}
          {!residentProp && residents.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Residente</Label>
              <Select
                value={resident?.id || ""}
                onValueChange={v => setResident(residents.find(r => r.id === v) || null)}
              >
                <SelectTrigger><SelectValue placeholder="Seleccionar residente..." /></SelectTrigger>
                <SelectContent>
                  {residents.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.preferred_name || r.full_name} {r.room ? `· Hab. ${r.room}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Datos básicos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Fecha</Label>
              <Input type="date" value={form.fecha} onChange={e => set("fecha", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Profesión</Label>
              <Select value={form.profesion} onValueChange={v => set("profesion", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar profesión" /></SelectTrigger>
                <SelectContent>
                  {PROFESIONES.map(p => (
                    <SelectItem key={p.key} value={p.key}>{p.icon} {p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nombre del profesional</Label>
              <Input value={form.profesional_nombre} onChange={e => set("profesional_nombre", e.target.value)} placeholder="Nombre y apellido" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de intervención</Label>
              <Select value={form.tipo_intervencion} onValueChange={v => set("tipo_intervencion", v)} disabled={!form.profesion}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Datos clínicos específicos por área */}
          {form.profesion && (
            <div className="border rounded-xl p-4 bg-muted/30 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {prof?.icon} Datos clínicos — {prof?.label}
              </p>
              <CamposClinicos profesion={form.profesion} datos={datosClinicos} onChange={setDatosClinicos} />
            </div>
          )}

          {/* Evaluación y acciones */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Evaluación / hallazgos</Label>
              <Textarea value={form.evaluacion} onChange={e => set("evaluacion", e.target.value)} placeholder="Descripción de la evaluación clínica realizada..." className="min-h-[70px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Objetivos de la intervención</Label>
              <Textarea value={form.objetivos} onChange={e => set("objetivos", e.target.value)} placeholder="Objetivos terapéuticos propuestos..." className="min-h-[60px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Acciones realizadas</Label>
              <Textarea value={form.acciones} onChange={e => set("acciones", e.target.value)} placeholder="Descripción detallada de las acciones realizadas durante la intervención..." className="min-h-[70px]" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Indicaciones / plan a seguir</Label>
              <Textarea value={form.indicaciones} onChange={e => set("indicaciones", e.target.value)} placeholder="Indicaciones para el equipo de cuidado y plan de continuidad..." className="min-h-[60px]" />
            </div>
          </div>

          {/* Cierre */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Próxima sesión</Label>
              <Input type="date" value={form.proxima_sesion} onChange={e => set("proxima_sesion", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Firma (nombre completo)</Label>
              <Input value={form.firma} onChange={e => set("firma", e.target.value)} placeholder="Nombre completo + RUT" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs font-semibold">Observaciones adicionales</Label>
              <Textarea value={form.observaciones} onChange={e => set("observaciones", e.target.value)} placeholder="Observaciones del equipo, familia u otras anotaciones..." className="min-h-[50px]" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave}>
              {esEdicion ? "Actualizar intervención" : "Guardar intervención"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}