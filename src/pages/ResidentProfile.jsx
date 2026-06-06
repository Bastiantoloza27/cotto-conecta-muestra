import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Heart, Phone, MapPin, Calendar, Brain, MessageCircle, Pill, AlertTriangle, ClipboardList, Pencil, Stethoscope, ListChecks } from "lucide-react";
import EsquemaCompletoDialog from "@/components/medications/EsquemaCompletoDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MoodBadge from "@/components/shared/MoodBadge";
import ResidentEditForm from "@/components/residents/ResidentEditForm";
import ResidentDocuments from "@/components/residents/ResidentDocuments";
import ResidentIntervenciones from "@/components/intervenciones/ResidentIntervenciones";

const depColors = {
  leve: "bg-green-50 text-green-700 border-green-200",
  moderada: "bg-amber-50 text-amber-700 border-amber-200",
  severa: "bg-orange-50 text-orange-700 border-orange-200",
  gran_dependencia: "bg-red-50 text-red-700 border-red-200",
};

export default function ResidentProfile() {
  const { id } = useParams();
  const [editing, setEditing] = useState(false);
  const [showEsquema, setShowEsquema] = useState(false);

  const { data: resident, isLoading } = useQuery({
    queryKey: ["resident", id],
    queryFn: async () => {
      const list = await base44.entities.Resident.filter({ id });
      return list[0];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["resident-logs", id],
    queryFn: () => base44.entities.DailyLog.filter({ resident_id: id }, "-created_date", 20),
    enabled: !!id,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ["resident-meds", id],
    queryFn: () => base44.entities.Medication.filter({ resident_id: id }),
    enabled: !!id,
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["resident-plans", id],
    queryFn: () => base44.entities.SupportPlan.filter({ resident_id: id }),
    enabled: !!id,
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ["resident-incidents", id],
    queryFn: () => base44.entities.Incident.filter({ resident_id: id }, "-created_date", 10),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Persona no encontrada</p>
        <Link to="/residentes"><Button variant="outline" className="mt-4">Volver</Button></Link>
      </div>
    );
  }

  const r = resident;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link to="/residentes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Residentes
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
          {r.preferred_name?.[0] || r.full_name?.[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{r.preferred_name || r.full_name}</h1>
          {r.preferred_name && <p className="text-sm text-muted-foreground">{r.full_name}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {r.dependency_level && (
              <Badge variant="outline" className={depColors[r.dependency_level]}>
                {r.dependency_level.replace("_", " ")}
              </Badge>
            )}
            {r.status && <Badge variant="secondary" className="capitalize">{r.status}</Badge>}
            {r.senadis_registered && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">SENADIS</Badge>}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
          <Pencil className="w-4 h-4 mr-1.5" /> Editar ficha
        </Button>
      </div>

      {/* Formulario de edición inline */}
      {editing && (
        <div className="mb-8">
          <ResidentEditForm resident={r} onClose={() => setEditing(false)} />
        </div>
      )}

      {/* Quick info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {r.room && (
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Habitación</p>
            <p className="text-sm font-semibold mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.room}</p>
          </Card>
        )}
        {r.date_of_birth && (
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Edad</p>
            <p className="text-sm font-semibold mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {Math.floor((Date.now() - new Date(r.date_of_birth)) / 31557600000)} años
            </p>
          </Card>
        )}
        {r.family_contact_name && (
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Familiar</p>
            <p className="text-sm font-semibold mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> {r.family_contact_name}</p>
          </Card>
        )}
        {r.disability_type && (
          <Card className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Discapacidad</p>
            <p className="text-sm font-semibold mt-0.5 capitalize flex items-center gap-1"><Brain className="w-3 h-3" /> {r.disability_type}</p>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="bitacora">Bitácora ({logs.length})</TabsTrigger>
          <TabsTrigger value="medicacion">Medicación ({medications.length})</TabsTrigger>
          <TabsTrigger value="planes">Planes ({plans.length})</TabsTrigger>
          <TabsTrigger value="incidentes">Incidentes ({incidents.length})</TabsTrigger>
          <TabsTrigger value="intervenciones">Intervenciones</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid sm:grid-cols-2 gap-4">
            {r.diagnoses && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Diagnósticos</h3>
                <p className="text-sm">{r.diagnoses}</p>
              </Card>
            )}
            {r.allergies && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Alergias</h3>
                <p className="text-sm">{r.allergies}</p>
              </Card>
            )}
            {(r.weight_kg || r.height_cm || r.nutritional_status) && (
              <Card className="p-4 col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Nutrición y Antropometría</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {r.weight_kg && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Peso</p>
                      <p className="text-lg font-bold text-primary mt-0.5">{r.weight_kg} <span className="text-xs font-normal">kg</span></p>
                    </div>
                  )}
                  {r.height_cm && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Estatura</p>
                      <p className="text-lg font-bold text-primary mt-0.5">{r.height_cm} <span className="text-xs font-normal">cm</span></p>
                    </div>
                  )}
                  {r.weight_kg && r.height_cm && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">IMC</p>
                      <p className="text-lg font-bold text-primary mt-0.5">{(r.weight_kg / Math.pow(r.height_cm / 100, 2)).toFixed(1)}</p>
                    </div>
                  )}
                  {r.nutritional_status && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Estado nutricional</p>
                      <p className="text-sm font-semibold mt-0.5 capitalize">{r.nutritional_status.replace("_", " ")}</p>
                    </div>
                  )}
                </div>
                {r.nutritional_notes && (
                  <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{r.nutritional_notes}</p>
                )}
              </Card>
            )}
            {r.personal_history && (
              <Card className="p-4 col-span-full">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Heart className="w-3 h-3" /> Historia de vida</h3>
                <p className="text-sm whitespace-pre-wrap">{r.personal_history}</p>
              </Card>
            )}
            {r.preferences && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Preferencias</h3>
                <p className="text-sm">{r.preferences}</p>
              </Card>
            )}
            {r.communication_notes && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Comunicación</h3>
                <p className="text-sm">{r.communication_notes}</p>
              </Card>
            )}
            {r.spirituality_notes && (
              <Card className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Espiritualidad</h3>
                <p className="text-sm">{r.spirituality_notes}</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bitacora">
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin registros aún</p>
            ) : logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="secondary" className="text-[10px] capitalize">{log.category}</Badge>
                  {log.mood && <MoodBadge mood={log.mood} />}
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {log.date} {log.time && `· ${log.time}`}
                  </span>
                </div>
                <p className="text-sm">{log.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="medicacion">
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowEsquema(true)}>
              <ListChecks className="w-4 h-4" /> Agregar esquema completo
            </Button>
          </div>
          <div className="space-y-2">
            {medications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin medicamentos registrados</p>
            ) : medications.map((m) => (
              <Card key={m.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-primary" /> {m.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.dosage} · {m.frequency?.replace("_", " ")} · {m.route}</p>
                  </div>
                  <Badge variant={m.status === "activo" ? "default" : "secondary"} className="capitalize text-[10px]">{m.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planes">
          <div className="space-y-2">
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin planes de apoyo</p>
            ) : plans.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5 text-primary" /> {p.title}</p>
                  <Badge variant="secondary" className="capitalize text-[10px]">{p.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground capitalize">{p.area} · {p.progress || 0}% avance</p>
                {p.description && <p className="text-sm mt-1">{p.description}</p>}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidentes">
          <div className="space-y-2">
            {incidents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sin incidentes registrados</p>
            ) : incidents.map((inc) => (
              <Card key={inc.id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-sm font-semibold capitalize">{inc.type}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{inc.severity}</Badge>
                  <span className="text-[11px] text-muted-foreground ml-auto">{inc.date}</span>
                </div>
                <p className="text-sm">{inc.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="intervenciones">
          <ResidentIntervenciones resident={r} />
        </TabsContent>
        <TabsContent value="documentos">
          <ResidentDocuments residentId={id} residentName={r.full_name} />
        </TabsContent>
      </Tabs>

      {resident && (
        <EsquemaCompletoDialog
          open={showEsquema}
          onOpenChange={setShowEsquema}
          resident={resident}
        />
      )}
    </div>
  );
}