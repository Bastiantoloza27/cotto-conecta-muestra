import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, BookOpen, Filter, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import MoodBadge from "@/components/shared/MoodBadge";
import DailyLogFormDialog from "@/components/dailylogs/DailyLogFormDialog";
import IncidentFormDialog from "@/components/incidents/IncidentFormDialog";

const CATEGORIES_CUIDADORA = [
  { value: "alimentacion", label: "🍽️ Alimentación" },
  { value: "emocional", label: "💛 Emocional" },
  { value: "sueno", label: "🌙 Sueño" },
  { value: "comportamiento", label: "🧠 Comportamiento" },
  { value: "actividad", label: "🎯 Actividad" },
  { value: "higiene", label: "🚿 Higiene" },
  { value: "social", label: "👥 Social" },
  { value: "espiritual", label: "🕊️ Espiritual" },
  { value: "otro", label: "📝 Otro" },
];

const CATEGORIES_TENS = [
  { value: "signos_vitales", label: "❤️ Signos vitales" },
  { value: "procedimiento", label: "🩺 Procedimiento" },
  { value: "medicacion", label: "💊 Medicación" },
  { value: "curacion", label: "🩹 Curación de heridas" },
  { value: "examen_fisico", label: "🔍 Examen físico" },
  { value: "glucemia", label: "🩸 Control de glucemia" },
  { value: "sondaje", label: "🔧 Sondaje" },
  { value: "oxigenoterapia", label: "💨 Oxigenoterapia" },
  { value: "salud", label: "🏥 Salud general" },
  { value: "otro", label: "📝 Otro" },
];

const CATEGORIES_PSICOSOCIAL = [
  { value: "estado_animo", label: "💛 Estado de ánimo" },
  { value: "vinculo_familiar", label: "👨‍👩‍👧 Vínculo familiar" },
  { value: "interaccion_social", label: "👥 Interacción social" },
  { value: "duelo", label: "🕊️ Proceso de duelo" },
  { value: "conducta", label: "🧠 Conducta / Comportamiento" },
  { value: "autonomia_social", label: "🙌 Autonomía social" },
  { value: "proyecto_vida", label: "🌟 Proyecto de vida" },
  { value: "evaluacion_psicologica", label: "📋 Evaluación psicológica" },
  { value: "intervencion_social", label: "🤝 Intervención social" },
  { value: "crisis", label: "⚠️ Crisis" },
  { value: "otro", label: "📝 Otro" },
];

const ALL_CATEGORY_EMOJIS = {
  alimentacion: "🍽️", emocional: "💛", sueno: "🌙", comportamiento: "🧠",
  actividad: "🎯", salud: "🏥", higiene: "🚿", social: "👥", espiritual: "🕊️",
  signos_vitales: "❤️", procedimiento: "🩺", medicacion: "💊", curacion: "🩹",
  examen_fisico: "🔍", glucemia: "🩸", sondaje: "🔧", oxigenoterapia: "💨",
  estado_animo: "💛", vinculo_familiar: "👨‍👩‍👧", interaccion_social: "👥",
  duelo: "🕊️", conducta: "🧠", autonomia_social: "🙌", proyecto_vida: "🌟",
  evaluacion_psicologica: "📋", intervencion_social: "🤝", crisis: "⚠️",
  otro: "📝",
};

const isTensLog = (log) => log.log_type === "tens";
const isCuidadoraLog = (log) => !log.log_type || log.log_type === "cuidadora";
const isPsicosocialLog = (log) => log.log_type === "psicosocial";

function LogTimeline({ logs, onEdit, onDelete }) {
  const grouped = {};
  logs.forEach((log) => {
    const date = log.date || log.created_date?.split("T")[0] || "Sin fecha";
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(log);
  });

  if (logs.length === 0) return null;

  return (
    <div className="space-y-8">
      {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, entries]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold text-muted-foreground">
              {date !== "Sin fecha" ? format(new Date(date + "T12:00:00"), "EEEE d/MM/yyyy") : date}
            </h3>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
            {entries.map((log) => (
              <Card key={log.id} className="p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{ALL_CATEGORY_EMOJIS[log.category] || "📝"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{log.resident_name || "General"}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">{log.category?.replace(/_/g, " ")}</Badge>
                      {log.mood && <MoodBadge mood={log.mood} />}
                      {log.is_important && <Badge className="bg-amber-100 text-amber-800 text-[10px] border-amber-200">⚡ Importante</Badge>}
                    </div>
                    {log.title && <p className="text-sm font-medium mt-1">{log.title}</p>}
                    <p className="text-sm text-muted-foreground mt-1">{log.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      {log.time && <span>🕐 {log.time}</span>}
                      {log.shift && <span>· Turno {log.shift}</span>}
                      {log.registered_by && <span>· 👤 {log.registered_by}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(log)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("¿Eliminar este registro?")) onDelete(log.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DailyLogs() {
  const [activeTab, setActiveTab] = useState("cuidadora");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  if (params.get("nuevo") === "1" && !showForm) {
    setShowForm(true);
    window.history.replaceState({}, "", "/bitacora");
  }

  const { data: logs = [] } = useQuery({
    queryKey: ["daily-logs"],
    queryFn: () => base44.entities.DailyLog.list("-created_date", 100),
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents-active"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const sendAlertIfImportant = async (registro, tipo) => {
    if (!registro.is_important) return;
    base44.functions.invoke("alertaRegistroImportante", { registro, tipo }).catch(() => {});
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DailyLog.create(data),
    onSuccess: (created, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      setShowForm(false);
      sendAlertIfImportant(variables, variables.log_type || activeTab);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DailyLog.update(id, data),
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
      setEditing(null);
      sendAlertIfImportant(variables.data, variables.data.log_type || editing?.log_type);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DailyLog.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["daily-logs"] }),
  });

  const createIncidentMutation = useMutation({
    mutationFn: (data) => base44.entities.Incident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      setShowIncidentForm(false);
    },
  });

  const currentCategories =
    activeTab === "tens" ? CATEGORIES_TENS :
    activeTab === "psicosocial" ? CATEGORIES_PSICOSOCIAL :
    CATEGORIES_CUIDADORA;

  const filterLogs = (tabLogs) =>
    categoryFilter === "todas" ? tabLogs : tabLogs.filter((l) => l.category === categoryFilter);

  const cuidadoraLogs = filterLogs(logs.filter(isCuidadoraLog));
  const tensLogs = filterLogs(logs.filter(isTensLog));
  const psicosocialLogs = filterLogs(logs.filter(isPsicosocialLog));

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCategoryFilter("todas");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Bitácora"
        subtitle="Registro continuo del cuidado en comunidad"
        action={() => setShowForm(true)}
        actionLabel="Nuevo registro"
        actionIcon={Plus}
      />
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setShowIncidentForm(true)}>
          <AlertTriangle className="w-4 h-4 mr-1" /> Reportar incidente
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="cuidadora" className="flex-1 sm:flex-none">🤲 Cuidadoras</TabsTrigger>
          <TabsTrigger value="tens" className="flex-1 sm:flex-none">🩺 TENS</TabsTrigger>
          <TabsTrigger value="psicosocial" className="flex-1 sm:flex-none">🧩 Psicosocial</TabsTrigger>
        </TabsList>

        {/* Shared filter */}
        <div className="flex gap-3 mt-4 items-center">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {currentCategories.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="cuidadora" className="mt-6">
          {cuidadoraLogs.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin registros de cuidadoras"
              description="Registra el cuidado diario de la comunidad"
              actionLabel="Crear registro"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <LogTimeline logs={cuidadoraLogs} onEdit={setEditing} onDelete={(id) => deleteMutation.mutate(id)} />
          )}
        </TabsContent>

        <TabsContent value="tens" className="mt-6">
          {tensLogs.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin registros de TENS"
              description="Registra las intervenciones y controles clínicos"
              actionLabel="Crear registro TENS"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <LogTimeline logs={tensLogs} onEdit={setEditing} onDelete={(id) => deleteMutation.mutate(id)} />
          )}
        </TabsContent>

        <TabsContent value="psicosocial" className="mt-6">
          {psicosocialLogs.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin registros psicosociales"
              description="Psicólogas y trabajadoras sociales pueden dejar sus observaciones aquí"
              actionLabel="Crear registro psicosocial"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <LogTimeline logs={psicosocialLogs} onEdit={setEditing} onDelete={(id) => deleteMutation.mutate(id)} />
          )}
        </TabsContent>
      </Tabs>

      <DailyLogFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate({ ...data, log_type: activeTab })}
        isLoading={createMutation.isPending}
        residents={residents}
        categories={currentCategories}
        logType={activeTab}
      />

      <IncidentFormDialog
        open={showIncidentForm}
        onClose={() => setShowIncidentForm(false)}
        onSubmit={(data) => createIncidentMutation.mutate(data)}
        isLoading={createIncidentMutation.isPending}
        residents={residents}
      />

      {editing && (
        <DailyLogFormDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editing.id, data })}
          isLoading={updateMutation.isPending}
          residents={residents}
          initial={editing}
          categories={isTensLog(editing) ? CATEGORIES_TENS : CATEGORIES_CUIDADORA}
          logType={isTensLog(editing) ? "tens" : "cuidadora"}
        />
      )}
    </div>
  );
}