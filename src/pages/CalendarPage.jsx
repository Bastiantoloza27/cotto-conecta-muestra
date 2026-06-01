import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Building2, Users, X, Clock, Tag, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/useRole";

const CATEGORY_COLORS = {
  administrativo: "bg-violet-100 text-violet-800 border-violet-200",
  reunion: "bg-blue-100 text-blue-800 border-blue-200",
  capacitacion: "bg-green-100 text-green-800 border-green-200",
  salud: "bg-red-100 text-red-800 border-red-200",
  visita: "bg-amber-100 text-amber-800 border-amber-200",
  actividad: "bg-orange-100 text-orange-800 border-orange-200",
  recordatorio: "bg-pink-100 text-pink-800 border-pink-200",
  otro: "bg-gray-100 text-gray-700 border-gray-200",
};

const CATEGORY_DOT = {
  administrativo: "bg-violet-500",
  reunion: "bg-blue-500",
  capacitacion: "bg-green-500",
  salud: "bg-red-500",
  visita: "bg-amber-500",
  actividad: "bg-orange-500",
  recordatorio: "bg-pink-500",
  otro: "bg-gray-400",
};

const CATEGORY_LABELS = {
  administrativo: "Administrativo",
  reunion: "Reunión",
  capacitacion: "Capacitación",
  salud: "Salud",
  visita: "Visita",
  actividad: "Actividad",
  recordatorio: "Recordatorio",
  otro: "Otro",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  time: "",
  end_time: "",
  category: "administrativo",
  is_all_day: false,
};

export default function CalendarPage() {
  const { isAdmin } = useRole();
  const [calendarType, setCalendarType] = useState("general");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["calendar-events", calendarType],
    queryFn: () => base44.entities.CalendarEvent.filter({ calendar_type: calendarType }),
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff-members"],
    queryFn: () => base44.entities.StaffMember.filter({ status: "activo" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", calendarType] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CalendarEvent.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", calendarType] });
      setSelectedEvent(null);
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events", calendarType] });
      setEditingEvent(null);
    },
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const startPadding = getDay(startOfMonth(currentMonth)); // 0=sun
  // Convert sunday=0 to monday-first: shift so Mon=0
  const paddingDays = (startPadding + 6) % 7;

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedEvents = selectedDateStr ? (eventsByDate[selectedDateStr] || []) : [];

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setSelectedEvent(null);
  };

  const openNewForm = (date) => {
    setForm({ ...EMPTY_FORM, date: format(date || selectedDate || new Date(), "yyyy-MM-dd") });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({ ...form, calendar_type: calendarType });

    // Solo notificar al personal si es calendario general
    if (calendarType === "general") {
      const fecha = form.date ? format(parseISO(form.date), "d 'de' MMMM 'de' yyyy", { locale: es }) : form.date;
      const horario = form.time ? ` a las ${form.time}${form.end_time ? ` – ${form.end_time}` : ""}` : "";
      let mensaje = `📅 Se ha registrado un nuevo evento en el calendario:\n\n*${form.title}*\nFecha: ${fecha}${horario}`;
      if (form.description) mensaje += `\n\n${form.description}`;
      if (form.author_name) mensaje += `\n\nRegistrado por: ${form.author_name}`;

      const aviso = await base44.entities.AvisoDirector.create({
        titulo: `Nuevo evento: ${form.title}`,
        mensaje,
        prioridad: "informativo",
        areas_destino: "todos",
        requiere_confirmacion: false,
        autor: form.author_name || "Sistema",
        estado: "enviado",
      });

      // Crear destinatarios para todos los funcionarios activos con email
      const staffConEmail = staffMembers.filter(s => s.email);
      await Promise.allSettled(
        staffConEmail.map(s =>
          base44.entities.AvisoDestinatario.create({
            aviso_id: aviso.id,
            aviso_titulo: aviso.titulo,
            usuario_email: s.email,
            area: s.area || "",
          })
        )
      );
    }
  };

  const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Registro de actividades y fechas importantes</p>
        </div>
        <Button onClick={() => openNewForm(selectedDate || new Date())} className="gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Nuevo evento
        </Button>
      </div>

      {/* Calendar type tabs — tab Dirección solo para admin */}
      {isAdmin && (
        <Tabs value={calendarType} onValueChange={setCalendarType} className="mb-6">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="general" className="gap-2 flex-1 sm:flex-none">
              <Users className="w-4 h-4" /> Calendario General
            </TabsTrigger>
            <TabsTrigger value="direccion" className="gap-2 flex-1 sm:flex-none">
              <Building2 className="w-4 h-4" /> Dirección
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Week day headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEK_DAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} className="bg-background min-h-[64px]" />
              ))}
              {days.map((day) => {
                const ds = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate[ds] || [];
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                return (
                  <button
                    key={ds}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      "bg-background min-h-[64px] p-1.5 text-left hover:bg-muted/50 transition-colors flex flex-col",
                      isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30"
                    )}
                  >
                    <span className={cn(
                      "w-6 h-6 text-xs font-medium rounded-full flex items-center justify-center mb-1",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className={cn("text-[10px] leading-tight px-1 py-0.5 rounded truncate border", CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.otro)}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} más</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={cn("w-2 h-2 rounded-full", CATEGORY_DOT[key])} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {selectedDate
                  ? format(selectedDate, "EEEE d 'de' MMMM", { locale: es })
                  : "Selecciona un día"}
              </h3>
              {selectedDate && (
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openNewForm(selectedDate)}>
                  <Plus className="w-3 h-3" /> Agregar
                </Button>
              )}
            </div>

            {!selectedDate && (
              <p className="text-xs text-muted-foreground">Haz clic en un día del calendario para ver sus eventos.</p>
            )}

            {selectedDate && selectedEvents.length === 0 && (
              <p className="text-xs text-muted-foreground">No hay eventos para este día.</p>
            )}

            <div className="space-y-2">
              {selectedEvents.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="w-full text-left"
                >
                  <Card className={cn("p-3 border hover:shadow-sm transition-shadow", CATEGORY_COLORS[ev.category] || "")}>
                    <div className="flex items-start gap-2">
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", CATEGORY_DOT[ev.category] || "bg-gray-400")} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{ev.title}</p>
                        {ev.time && (
                          <p className="text-xs opacity-70 mt-0.5">
                            {ev.time}{ev.end_time ? ` – ${ev.end_time}` : ""}
                          </p>
                        )}
                        <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                          {CATEGORY_LABELS[ev.category] || ev.category}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </Card>

          {/* Upcoming events */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Próximos eventos</h3>
            {(() => {
              const todayStr = format(new Date(), "yyyy-MM-dd");
              const upcoming = events
                .filter(e => e.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
                .slice(0, 5);
              if (upcoming.length === 0) return <p className="text-xs text-muted-foreground">Sin próximos eventos.</p>;
              return (
                <div className="space-y-2">
                  {upcoming.map(ev => (
                    <div key={ev.id} className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", CATEGORY_DOT[ev.category] || "bg-gray-400")} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{ev.title}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">
                          {format(parseISO(ev.date), "d MMM", { locale: es })}{ev.time ? ` · ${ev.time}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Card>
        </div>
      </div>

      {/* Event detail dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedEvent.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Tag className="w-4 h-4" />
                <Badge className={cn("capitalize", CATEGORY_COLORS[selectedEvent.category] || "")}>{CATEGORY_LABELS[selectedEvent.category]}</Badge>
              </div>
              {(selectedEvent.time || selectedEvent.end_time) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{selectedEvent.time}{selectedEvent.end_time ? ` – ${selectedEvent.end_time}` : ""}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <AlignLeft className="w-4 h-4 mt-0.5 shrink-0" />
                  <p>{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.author_name && (
                <p className="text-xs text-muted-foreground">Registrado por: {selectedEvent.author_name}</p>
              )}
            </div>
            <div className="flex justify-between pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteMutation.mutate(selectedEvent.id)}
                disabled={deleteMutation.isPending}
              >
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditingEvent({ ...selectedEvent }); setSelectedEvent(null); }}>Editar</Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>Cerrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit event dialog */}
      {editingEvent && (
        <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar evento</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); updateEventMutation.mutate({ id: editingEvent.id, data: editingEvent }); }} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input value={editingEvent.title} onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Fecha *</Label>
                  <Input type="date" value={editingEvent.date} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select value={editingEvent.category} onValueChange={v => setEditingEvent({ ...editingEvent, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Hora inicio</Label>
                  <Input type="time" value={editingEvent.time || ""} onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Hora término</Label>
                  <Input type="time" value={editingEvent.end_time || ""} onChange={e => setEditingEvent({ ...editingEvent, end_time: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Input value={editingEvent.description || ""} onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} placeholder="Detalles opcionales" />
              </div>
              <div className="space-y-1.5">
                <Label>Registrado por</Label>
                <Input value={editingEvent.author_name || ""} onChange={e => setEditingEvent({ ...editingEvent, author_name: e.target.value })} placeholder="Tu nombre" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setEditingEvent(null)}>Cancelar</Button>
                <Button type="submit" disabled={updateEventMutation.isPending}>
                  {updateEventMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* New event form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo evento · {calendarType === "general" ? "Calendario General" : "Dirección"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Título del evento"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hora inicio</Label>
                <Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora término</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Detalles opcionales"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Registrado por</Label>
              <Input
                value={form.author_name}
                onChange={e => setForm({ ...form, author_name: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Guardar evento"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}