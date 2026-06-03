import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useRole } from "@/hooks/useRole";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Sparkles, BookOpen, Zap, Bell, Star } from "lucide-react";
import { toast } from "sonner";
import NovedadCard from "@/components/novedades/NovedadCard";
import TutorialViewer from "@/components/novedades/TutorialViewer";
import NovedadFormDialog from "@/components/novedades/NovedadFormDialog";

const TIPO_LABELS = {
  novedad: { label: "Novedad", icon: Sparkles, color: "bg-purple-100 text-purple-700 border-purple-200" },
  tutorial: { label: "Tutorial", icon: BookOpen, color: "bg-blue-100 text-blue-700 border-blue-200" },
  mejora: { label: "Mejora", icon: Zap, color: "bg-green-100 text-green-700 border-green-200" },
  aviso: { label: "Aviso", icon: Bell, color: "bg-orange-100 text-orange-700 border-orange-200" },
};

export default function Novedades() {
  const { isAdmin } = useRole();
  const qc = useQueryClient();
  const [tab, setTab] = useState("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [tutorialActivo, setTutorialActivo] = useState(null);

  const { data: novedades = [], isLoading } = useQuery({
    queryKey: ["novedades"],
    queryFn: () => base44.entities.Novedad.list("-fecha_publicacion", 100),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ data, id }) =>
      id ? base44.entities.Novedad.update(id, data) : base44.entities.Novedad.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["novedades"] });
      toast.success("Novedad guardada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Novedad.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["novedades"] });
      toast.success("Novedad eliminada");
    },
  });

  const publicadas = novedades.filter(n => n.publicado !== false);
  const destacadas = publicadas.filter(n => n.destacado);
  const filtradas = tab === "todas"
    ? publicadas
    : publicadas.filter(n => n.tipo === tab);

  const tutoriales = publicadas.filter(n => n.tipo === "tutorial" && n.pasos);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            ¿Qué hay de nuevo?
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Novedades, mejoras y tutoriales de Providentia
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditando(null); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Nueva publicación
          </Button>
        )}
      </div>

      {/* Destacados */}
      {destacadas.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-500" /> Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {destacadas.map(n => (
              <NovedadCard
                key={n.id}
                novedad={n}
                tipoConfig={TIPO_LABELS[n.tipo]}
                destacada
                isAdmin={isAdmin}
                onEdit={() => { setEditando(n); setFormOpen(true); }}
                onDelete={() => { if (confirm("¿Eliminar?")) deleteMutation.mutate(n.id); }}
                onVerTutorial={n.pasos ? () => setTutorialActivo(n) : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tabs por tipo */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="todas">Todas ({publicadas.length})</TabsTrigger>
          {Object.entries(TIPO_LABELS).map(([key, cfg]) => {
            const count = publicadas.filter(n => n.tipo === key).length;
            if (!count) return null;
            return (
              <TabsTrigger key={key} value={key} className="gap-1.5">
                <cfg.icon className="w-3.5 h-3.5" /> {cfg.label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-muted-foreground">No hay publicaciones aún</p>
              {isAdmin && (
                <Button variant="outline" className="mt-4 gap-2" onClick={() => { setEditando(null); setFormOpen(true); }}>
                  <Plus className="w-4 h-4" /> Crear la primera
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtradas.map(n => (
                <NovedadCard
                  key={n.id}
                  novedad={n}
                  tipoConfig={TIPO_LABELS[n.tipo]}
                  isAdmin={isAdmin}
                  onEdit={() => { setEditando(n); setFormOpen(true); }}
                  onDelete={() => { if (confirm("¿Eliminar?")) deleteMutation.mutate(n.id); }}
                  onVerTutorial={n.pasos ? () => setTutorialActivo(n) : null}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin sin publicar */}
      {isAdmin && novedades.filter(n => !n.publicado).length > 0 && (
        <div className="border border-dashed rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Borradores (solo visible para ti)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {novedades.filter(n => !n.publicado).map(n => (
              <NovedadCard
                key={n.id}
                novedad={n}
                tipoConfig={TIPO_LABELS[n.tipo]}
                isAdmin={isAdmin}
                borrador
                onEdit={() => { setEditando(n); setFormOpen(true); }}
                onDelete={() => { if (confirm("¿Eliminar?")) deleteMutation.mutate(n.id); }}
                onVerTutorial={n.pasos ? () => setTutorialActivo(n) : null}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tutorial viewer modal */}
      {tutorialActivo && (
        <TutorialViewer
          novedad={tutorialActivo}
          onClose={() => setTutorialActivo(null)}
        />
      )}

      {/* Form dialog */}
      {formOpen && (
        <NovedadFormDialog
          open={formOpen}
          novedad={editando}
          onClose={() => { setFormOpen(false); setEditando(null); }}
          onSave={(data, id) => saveMutation.mutateAsync({ data, id })}
        />
      )}
    </div>
  );
}