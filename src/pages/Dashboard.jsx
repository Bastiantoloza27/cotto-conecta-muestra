import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  Users, AlertTriangle, Calendar, Pill, BookOpen,
  Heart, ArrowRight, Clock, Activity, ClipboardPlus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/shared/StatCard";
import MoodBadge from "@/components/shared/MoodBadge";

const today = format(new Date(), "yyyy-MM-dd");

export default function Dashboard() {
  const { data: residents = [] } = useQuery({
    queryKey: ["residents"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ["incidents-today"],
    queryFn: () => base44.entities.Incident.filter({ date: today }),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities-today"],
    queryFn: () => base44.entities.Activity.filter({ date: today }),
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["recent-logs"],
    queryFn: () => base44.entities.DailyLog.list("-created_date", 8),
  });

  const { data: openIncidents = [] } = useQuery({
    queryKey: ["open-incidents"],
    queryFn: () => base44.entities.Incident.filter({ status: "abierto" }),
  });

  const { data: allMedications = [] } = useQuery({
    queryKey: ["meds-alerts"],
    queryFn: () => base44.entities.Medication.filter({ status: "activo" }),
  });

  const { data: waitingAdmissions = [] } = useQuery({
    queryKey: ["admissions-waiting"],
    queryFn: () => base44.entities.Admission.filter({ status: "en_espera" }),
  });

  const criticalMeds = allMedications.filter(m => m.stock_remaining > 0 && m.stock_remaining < 5);
  const lowMeds = allMedications.filter(m => m.stock_remaining >= 5 && m.stock_remaining < 10);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">
          {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
          {greeting()} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen del día en la comunidad
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Residentes activos" value={residents.length} icon={Users} />
        <StatCard label="Actividades hoy" value={activities.length} icon={Calendar} />
        <StatCard label="Alertas abiertas" value={openIncidents.length} icon={Activity} />
        <StatCard label="En lista de espera" value={waitingAdmissions.length} icon={ClipboardPlus} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent logs - Main column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Últimos registros
            </h2>
            <Link to="/bitacora">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                Ver todo <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">No hay registros aún hoy</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentLogs.map((log) => (
                <Card key={log.id} className="p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{log.resident_name || "Residente"}</span>
                        <Badge variant="secondary" className="text-[10px] capitalize">{log.category}</Badge>
                        {log.mood && <MoodBadge mood={log.mood} />}
                        {log.is_important && <Badge className="bg-amber-100 text-amber-800 text-[10px]">⚡ Importante</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{log.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        {log.shift && `Turno ${log.shift}`} · {log.time || format(new Date(log.created_date), "HH:mm")}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Incidents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Incidentes abiertos
              </h2>
              <Link to="/incidentes">
                <Button variant="ghost" size="sm" className="text-xs">Ver</Button>
              </Link>
            </div>
            {openIncidents.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Sin incidentes abiertos ✓</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {openIncidents.slice(0, 4).map((inc) => (
                  <Card key={inc.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inc.resident_name || "—"}</p>
                        <p className="text-xs text-muted-foreground capitalize">{inc.type} · {inc.severity}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Today's activities */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Actividades hoy
              </h2>
              <Link to="/actividades">
                <Button variant="ghost" size="sm" className="text-xs">Ver</Button>
              </Link>
            </div>
            {activities.length === 0 ? (
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground">No hay actividades programadas</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 4).map((act) => (
                  <Card key={act.id} className="p-3">
                    <p className="text-sm font-medium">{act.title}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {act.time_start && `${act.time_start} · `}{act.type}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Medication alerts */}
          {(criticalMeds.length > 0 || lowMeds.length > 0) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" />
                  Alertas medicación
                </h2>
                <Link to="/medicacion">
                  <Button variant="ghost" size="sm" className="text-xs">Ver</Button>
                </Link>
              </div>
              <div className="space-y-1.5">
                {criticalMeds.map(m => (
                  <Card key={m.id} className="p-2.5 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-red-800 truncate">{m.name}</p>
                        <p className="text-[11px] text-red-600">{m.resident_name} · Stock: {m.stock_remaining}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {lowMeds.map(m => (
                  <Card key={m.id} className="p-2.5 border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-amber-800 truncate">{m.name}</p>
                        <p className="text-[11px] text-amber-600">{m.resident_name} · Stock: {m.stock_remaining}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              Acceso rápido
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/bitacora?nuevo=1">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  📝 Nuevo registro
                </Button>
              </Link>
              <Link to="/incidentes?nuevo=1">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  ⚠️ Incidente
                </Button>
              </Link>
              <Link to="/medicacion">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  💊 Medicación
                </Button>
              </Link>
              <Link to="/admisiones">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  📋 Admisiones
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}