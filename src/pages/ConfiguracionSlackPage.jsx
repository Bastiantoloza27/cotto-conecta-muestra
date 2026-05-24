import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, CheckCircle2, XCircle, Slack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/shared/EmptyState";

const EMPTY_FORM = { nombre_canal: "", webhook_url: "", descripcion: "", activo: true };

export default function ConfiguracionSlackPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [testResult, setTestResult] = useState({});
  const [testing, setTesting] = useState(null);
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["slack-configs-all"],
    queryFn: () => base44.entities.ConfiguracionSlack.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConfiguracionSlack.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-configs-all"] });
      queryClient.invalidateQueries({ queryKey: ["slack-configs"] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ConfiguracionSlack.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-configs-all"] });
      queryClient.invalidateQueries({ queryKey: ["slack-configs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ConfiguracionSlack.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slack-configs-all"] });
      queryClient.invalidateQueries({ queryKey: ["slack-configs"] });
    },
  });

  const handleTest = async (config) => {
    setTesting(config.id);
    try {
      const res = await fetch(config.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "✅ Prueba de conexión desde Providentia" }),
      });
      setTestResult(prev => ({ ...prev, [config.id]: res.ok ? "ok" : "error" }));
    } catch {
      setTestResult(prev => ({ ...prev, [config.id]: "error" }));
    }
    setTesting(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Slack className="w-6 h-6 text-primary" /> Configuración Slack
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestiona los webhooks para notificaciones</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Agregar webhook
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Cargando...</div>
      ) : configs.length === 0 ? (
        <EmptyState
          icon={Slack}
          title="Sin webhooks configurados"
          description="Agrega un Incoming Webhook de Slack para recibir notificaciones"
        />
      ) : (
        <div className="space-y-3">
          {configs.map(config => (
            <Card key={config.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">#{config.nombre_canal}</span>
                    <Badge variant="outline" className={config.activo ? "bg-green-50 text-green-700 border-green-200 text-[10px]" : "bg-gray-100 text-gray-500 text-[10px]"}>
                      {config.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    {testResult[config.id] === "ok" && (
                      <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" /> OK</span>
                    )}
                    {testResult[config.id] === "error" && (
                      <span className="flex items-center gap-1 text-xs text-red-600"><XCircle className="w-3 h-3" /> Error</span>
                    )}
                  </div>
                  {config.descripcion && (
                    <p className="text-xs text-muted-foreground mb-1">{config.descripcion}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground truncate">{config.webhook_url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={config.activo}
                    onCheckedChange={v => updateMutation.mutate({ id: config.id, data: { activo: v } })}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    disabled={testing === config.id}
                    onClick={() => handleTest(config)}
                  >
                    {testing === config.id ? "Probando..." : "Probar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate(config.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar webhook de Slack</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs mb-1 block">Nombre del canal *</Label>
              <Input
                value={form.nombre_canal}
                onChange={e => setForm(f => ({ ...f, nombre_canal: e.target.value }))}
                placeholder="ej: avisos-providentia"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">URL del Webhook *</Label>
              <Input
                value={form.webhook_url}
                onChange={e => setForm(f => ({ ...f, webhook_url: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={2}
                placeholder="Para qué se usa este canal..."
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.activo}
                onCheckedChange={v => setForm(f => ({ ...f, activo: v }))}
              />
              <Label className="text-sm">Activo</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.nombre_canal || !form.webhook_url || createMutation.isPending}
              >
                {createMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}