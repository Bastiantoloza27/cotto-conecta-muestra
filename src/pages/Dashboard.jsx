import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  Users, Calendar, Pill, BookOpen,
  Heart, ArrowRight, Clock, Activity, ClipboardPlus, Stethoscope, FileText, Megaphone, Sparkles
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/shared/StatCard";
import MoodBadge from "@/components/shared/MoodBadge";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import UVIndexCard from "@/components/dashboard/UVIndexCard";

const today = format(new Date(), "yyyy-MM-dd");

export default function Dashboard() {
  const { data: residents = [] } = useQuery({
    queryKey: ["residents"],
    queryFn: () => base44.entities.Resident.filter({ status: "activo" }),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities-today"],
    queryFn: () => base44.entities.Activity.filter({ date: today }),
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["recent-logs"],
    queryFn: () => base44.entities.DailyLog.list("-created_date", 8),
  });

  const { data: informesMedicos = [] } = useQuery({
    queryKey: ["informes-medico-dashboard"],
    queryFn: () => base44.entities.InformeMedico.list("-fecha_visita", 5),
  });

  const { data: allMedications = [] } = useQuery({
    queryKey: ["meds-alerts"],
    queryFn: () => base44.entities.Medication.filter({ status: "activo" }),
  });

  const { data: waitingAdmissions = [] } = useQuery({
    queryKey: ["admissions-waiting"],
    queryFn: () => base44.entities.Admission.filter({ status: "en_espera" }),
  });

  const { data: ultimasNovedades = [] } = useQuery({
    queryKey: ["novedades-dashboard"],
    queryFn: () => base44.entities.Novedad.filter({ publicado: true }, "-fecha_publicacion", 3),
  });

  const { data: avisosNoLeidos = [] } = useQuery({
    queryKey: ["avisos-no-leidos-dashboard"],
    queryFn: async () => {
      const me = await base44.auth.me();
      if (!me?.email) return [];
      const destinatarios = await base44.entities.AvisoDestinatario.filter({ usuario_email: me.email });
      return destinatarios.filter(d => !d.leido_en);
    },
  });

  const criticalMeds = allMedications.filter(m => m.stock_remaining > 0 && m.stock_remaining < 5);
  const lowMeds = allMedications.filter(m => m.stock_remaining >= 5 && m.stock_remaining < 10);
  const ultimoInforme = informesMedicos[0] || null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with video background */}
      <div className="mb-5 sm:mb-8 relative rounded-xl sm:rounded-2xl overflow-hidden">
        <video
          src="https://media.base44.com/videos/public/6a10daaa13888870642a70ef/f9e9d64a2_VIDEOCENACOTOLENGO2025-22_5_20267_41pm.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/55" />
        {/* Content */}
        <div className="relative z-10 flex items-center justify-between gap-4 p-4 sm:p-8 min-h-[100px] sm:min-h-[auto]">
          <div>
            <p className="text-xs sm:text-sm text-white/70">
              {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight mt-0.5 text-white">
              {greeting()} 👋
            </h1>
            <p className="text-xs sm:text-sm text-white/70 mt-0.5">
              Resumen del día en la comunidad
            </p>
          </div>
          <img
            src="https://media.base44.com/images/public/6a10daaa13888870642a70ef/2440d15f9_image.png"
            alt="Pequeño Cottolengo Quintero"
            className="w-14 h-14 sm:w-20 sm:h-20 object-contain shrink-0"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-5 sm:mb-8">
        <StatCard label="Residentes activos" value={residents.length} icon={Users} />
        <StatCard label="Actividades hoy" value={activities.length} icon={Calendar} />
        <StatCard label="Informes médicos" value={informesMedicos.length} icon={Stethoscope} />
        <StatCard label="En lista de espera" value={waitingAdmissions.length} icon={ClipboardPlus} />
      </div>

      <UVIndexCard />

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
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
          {/* Last medical report */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Último informe médico
              </h2>
              <Link to="/informes-medico">
                <Button variant="ghost" size="sm" className="text-xs">Ver todos</Button>
              </Link>
            </div>
            {!ultimoInforme ? (
              <Card className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Sin informes registrados</p>
              </Card>
            ) : (
              <Card className="p-3 border-primary/20 bg-primary/5">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {format(new Date(ultimoInforme.fecha_visita + "T12:00:00"), "dd 'de' MMMM yyyy", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">👨‍⚕️ {ultimoInforme.medico_nombre}</p>
                    {ultimoInforme.residente_nombres && (
                      <p className="text-xs text-muted-foreground truncate">👤 {ultimoInforme.residente_nombres}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ultimoInforme.descripcion_intervencion}</p>
                    <Link to="/informes-medico">
                      <Button variant="link" size="sm" className="h-auto p-0 text-xs mt-1 gap-1">
                        Ver informe <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Mini Calendar */}
          <MiniCalendar />

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

          {/* Avisos no leídos */}
          {avisosNoLeidos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  Avisos pendientes
                </h2>
                <Link to="/mis-avisos">
                  <Button variant="ghost" size="sm" className="text-xs">Ver todos</Button>
                </Link>
              </div>
              <Link to="/mis-avisos">
                <Card className="p-3 border-orange-200 bg-orange-50 hover:shadow-sm transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Megaphone className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-orange-800">
                        {avisosNoLeidos.length} aviso{avisosNoLeidos.length > 1 ? "s" : ""} sin leer
                      </p>
                      <p className="text-xs text-orange-600">Toca para ver tus avisos</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-orange-400 ml-auto" />
                  </div>
                </Card>
              </Link>
            </div>
          )}

          {/* Novedades */}
          {ultimasNovedades.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  ¿Qué hay de nuevo?
                </h2>
                <Link to="/novedades">
                  <Button variant="ghost" size="sm" className="text-xs">Ver todo</Button>
                </Link>
              </div>
              <div className="space-y-2">
                {ultimasNovedades.map(n => (
                  <Link to="/novedades" key={n.id}>
                    <Card className="p-3 hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="flex items-start gap-2">
                        <span className="text-lg shrink-0">{n.emoji || "✨"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight">{n.titulo}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.descripcion}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
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
              <Link to="/informes-medico">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  🩺 Informe Médico
                </Button>
              </Link>
              <Link to="/medicacion">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  💊 Medicación
                </Button>
              </Link>
              <Link to="/mis-avisos">
                <Button variant="outline" size="sm" className="w-full text-xs h-9">
                  📢 Avisos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}