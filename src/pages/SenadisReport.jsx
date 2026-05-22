import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BarChart3, Users, AlertTriangle, ClipboardList, Calendar, Pill, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(152, 35%, 45%)", "hsl(28, 55%, 55%)", "hsl(200, 30%, 50%)", "hsl(340, 40%, 55%)", "hsl(45, 60%, 55%)"];

export default function SenadisReport() {
  const { data: residents = [] } = useQuery({
    queryKey: ["residents-all"],
    queryFn: () => base44.entities.Resident.list("-created_date", 200),
  });
  const { data: incidents = [] } = useQuery({
    queryKey: ["all-incidents"],
    queryFn: () => base44.entities.Incident.list("-created_date", 500),
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["all-plans"],
    queryFn: () => base44.entities.SupportPlan.list("-created_date", 500),
  });
  const { data: activities = [] } = useQuery({
    queryKey: ["all-activities"],
    queryFn: () => base44.entities.Activity.list("-created_date", 500),
  });
  const { data: dailyLogs = [] } = useQuery({
    queryKey: ["all-logs"],
    queryFn: () => base44.entities.DailyLog.list("-created_date", 500),
  });

  const active = residents.filter((r) => r.status === "activo");
  const senadisCount = active.filter((r) => r.senadis_registered).length;
  const activePlans = plans.filter((p) => p.status === "activo").length;
  const achievedPlans = plans.filter((p) => p.status === "logrado").length;

  // Dependency distribution
  const depData = ["leve", "moderada", "severa", "gran_dependencia"].map((level) => ({
    name: level.replace("_", " "),
    value: active.filter((r) => r.dependency_level === level).length,
  })).filter(d => d.value > 0);

  // Disability distribution
  const disData = ["fisica", "intelectual", "sensorial", "psiquica", "multiple", "otra"].map((type) => ({
    name: type,
    value: active.filter((r) => r.disability_type === type).length,
  })).filter(d => d.value > 0);

  // Incident types
  const incTypes = {};
  incidents.forEach((i) => { incTypes[i.type] = (incTypes[i.type] || 0) + 1; });
  const incData = Object.entries(incTypes).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Evidencia SENADIS"
        subtitle="Indicadores, estadísticas y trazabilidad institucional"
      />

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Residentes activos" value={active.length} icon={Users} />
        <StatCard label="Registrados SENADIS" value={`${senadisCount}/${active.length}`} icon={BarChart3} />
        <StatCard label="Planes activos" value={activePlans} icon={ClipboardList} />
        <StatCard label="Objetivos logrados" value={achievedPlans} icon={TrendingUp} />
      </div>

      {/* Coverage indicators */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3">Cobertura SENADIS</h3>
          <Progress value={active.length > 0 ? (senadisCount / active.length) * 100 : 0} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            {active.length > 0 ? Math.round((senadisCount / active.length) * 100) : 0}% de residentes registrados
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-3">Planes de apoyo</h3>
          <Progress value={active.length > 0 ? (activePlans / active.length) * 100 : 0} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            {activePlans} planes activos para {active.length} residentes
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Nivel de Dependencia</h3>
          {depData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={depData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {depData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">Incidentes por tipo</h3>
          {incData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 15%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(152, 35%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">Sin datos</p>
          )}
        </Card>
      </div>

      {/* Summary stats */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Resumen de Trazabilidad</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold">{dailyLogs.length}</p>
            <p className="text-xs text-muted-foreground">Registros en bitácora</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{incidents.length}</p>
            <p className="text-xs text-muted-foreground">Incidentes totales</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{activities.length}</p>
            <p className="text-xs text-muted-foreground">Actividades realizadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{plans.length}</p>
            <p className="text-xs text-muted-foreground">Planes de apoyo creados</p>
          </div>
        </div>
      </Card>
    </div>
  );
}