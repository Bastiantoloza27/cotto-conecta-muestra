import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Plus, Church, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

export default function Pastoral() {
  const { data: activities = [] } = useQuery({
    queryKey: ["pastoral-activities"],
    queryFn: () => base44.entities.Activity.filter({ type: "pastoral" }, "-date", 50),
  });

  const { data: spiritualLogs = [] } = useQuery({
    queryKey: ["spiritual-logs"],
    queryFn: () => base44.entities.DailyLog.filter({ category: "espiritual" }, "-created_date", 30),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Pastoral y Acompañamiento Espiritual"
        subtitle="Vida espiritual, sacramentos y acompañamiento comunitario"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pastoral activities */}
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
            <Church className="w-4 h-4 text-primary" /> Actividades pastorales
          </h2>
          {activities.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">No hay actividades pastorales registradas</p>
              <p className="text-xs text-muted-foreground mt-1">Crea actividades de tipo "Pastoral" en el módulo de Actividades</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {activities.map((act) => (
                <Card key={act.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🕊️</span>
                    <div>
                      <p className="text-sm font-semibold">{act.title}</p>
                      {act.description && <p className="text-sm text-muted-foreground mt-0.5">{act.description}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        📅 {act.date} {act.time_start && `· ${act.time_start}`}
                        {act.location && ` · 📍 ${act.location}`}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Spiritual logs */}
        <div>
          <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-primary" /> Registros espirituales
          </h2>
          {spiritualLogs.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">Sin registros espirituales</p>
              <p className="text-xs text-muted-foreground mt-1">Registra notas espirituales en la Bitácora con categoría "Espiritual"</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {spiritualLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{log.resident_name || "Comunidad"}</span>
                    <span className="text-[11px] text-muted-foreground">{log.date || format(new Date(log.created_date), "dd/MM/yyyy")}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.description}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}