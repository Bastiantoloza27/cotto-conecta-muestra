import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import PrevencionHero from "@/components/prevencion/PrevencionHero";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/hooks/useRole";
import BibliotecaTab from "@/components/prevencion/BibliotecaTab";
import GestionTab from "@/components/prevencion/GestionTab";
import CapacitacionesTab from "@/components/capacitaciones/CapacitacionesTab";

export default function PrevencionRiesgos() {
  const { isAdmin } = useRole();
  const { data: docs = [], refetch } = useQuery({
    queryKey: ["documentos-prevencion"],
    queryFn: () => base44.entities.DocumentoPrevencion.list("-updated_date", 500),
  });

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PrevencionHero docs={docs} />
      <Tabs defaultValue="biblioteca">
        <TabsList className="mb-4">
          <TabsTrigger value="biblioteca">Biblioteca del personal</TabsTrigger>
          <TabsTrigger value="gestion">Gestión y aprobación</TabsTrigger>
          <TabsTrigger value="capacitaciones">Capacitaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="capacitaciones"><CapacitacionesTab isAdmin={isAdmin} /></TabsContent>
        <TabsContent value="biblioteca"><BibliotecaTab docs={docs} /></TabsContent>
        <TabsContent value="gestion"><GestionTab docs={docs} isAdmin={isAdmin} refetch={refetch} /></TabsContent>
      </Tabs>
    </div>
  );
}