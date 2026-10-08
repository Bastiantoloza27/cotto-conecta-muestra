import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MisCapacitaciones from "./MisCapacitaciones";
import CumplimientoCapacitaciones from "./CumplimientoCapacitaciones";

export default function CapacitacionesTab({ isAdmin }) {
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  const { data: caps = [], refetch: r1 } = useQuery({ queryKey: ["capacitaciones"], queryFn: () => base44.entities.Capacitacion.list("-created_date", 200) });
  const { data: asig = [], refetch: r2 } = useQuery({ queryKey: ["asignaciones-cap"], queryFn: () => base44.entities.AsignacionCapacitacion.list("-created_date", 1000) });
  const refetch = () => { r1(); r2(); };
  const mias = asig.filter((a) => a.usuario_email === me?.email);

  if (!isAdmin) return <MisCapacitaciones asignaciones={mias} caps={caps} onSaved={refetch} />;
  return (
    <Tabs defaultValue="mias">
      <TabsList className="mb-4">
        <TabsTrigger value="mias">Mis capacitaciones</TabsTrigger>
        <TabsTrigger value="cumplimiento">Crear y cumplimiento</TabsTrigger>
      </TabsList>
      <TabsContent value="mias"><MisCapacitaciones asignaciones={mias} caps={caps} onSaved={refetch} /></TabsContent>
      <TabsContent value="cumplimiento"><CumplimientoCapacitaciones caps={caps} asignaciones={asig} onSaved={refetch} /></TabsContent>
    </Tabs>
  );
}