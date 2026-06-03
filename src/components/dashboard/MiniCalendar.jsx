import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, addMonths, subMonths, parseISO
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  title: "", description: "", date: "", time: "", end_time: "",
  category: "administrativo", author_name: "",
};

const WEEK_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function MiniCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ["calendar-events-dashboard", "general"],
    queryFn: () => base44.entities.CalendarEvent.filter({ calendar_type: "general" }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CalendarEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const paddingDays = (getDay(startOfMonth(currentMonth)) + 6) % 7;

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedEvents = eventsByDate[selectedDateStr] || [];

  const openNewForm = (date) => {
    setForm({ ...EMPTY_FORM, date: format(date, "yyyy-MM-dd") });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createMutation.mutateAsync({ ...form, calendar_type: "general" });
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Calendario
          </h2>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openNewForm(selectedDate)}>
              <Plus className="w-3 h-3" /> Nuevo evento
            </Button>
            <Link to="/calendario">
              <Button variant="ghost" size="sm" className="text-xs h-7">Ver todo</Button>
            </Link>
          </div>
        </div>

        <Card className="p-3">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 rounded hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 rounded hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-0.5">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`pad-${i}`} className="bg-background h-9" />
            ))}
            {days.map((day) => {
              const ds = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[ds] || [];
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "bg-background h-9 flex flex-col items-center justify-start pt-1 hover:bg-muted/60 transition-colors relative",
                    isSelected && "bg-primary/5 ring-1 ring-inset ring-primary/30"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 text-[11px] font-medium rounded-full flex items-center justify-center",
                    isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                  )}>
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <div key={idx} className={cn("w-1 h-1 rounded-full", CATEGORY_DOT[ev.category] || "bg-gray-400")} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Selected day events */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold capitalize">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </p>
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2" onClick={() => openNewForm(selectedDate)}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin eventos para este día.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedEvents.map((ev) => (
                <div key={ev.id} className={cn("flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs", CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.otro)}>
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", CATEGORY_DOT[ev.category] || "bg-gray-400")} />
                  <span className="font-medium truncate">{ev.title}</span>
                  {ev.time && <span className="ml-auto shrink-0 opacity-70">{ev.time}</span>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* New event dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título del evento" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha *</Label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
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
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalles opcionales" />
            </div>
            <div className="space-y-1.5">
              <Label>Registrado por</Label>
              <Input value={form.author_name} onChange={e => setForm({ ...form, author_name: e.target.value })} placeholder="Tu nombre" />
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
    </>
  );
}