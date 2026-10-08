import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { HardHat } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRole } from "@/hooks/useRole";
import BibliotecaTab from "@/components/prevencion/BibliotecaTab";
import GestionTab from "@/components/prevencion/GestionTab";

export default function PrevencionRiesgos() {
  const { isAdmin } = useRole();
  const { data: docs = [], refetch } = useQuery({
    queryKey: ["documentos-prevencion"],
    queryFn: () => base44.entities.DocumentoPrevencion.list("-updated_date", 500),
  });

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center"><HardHat className="w-6 h-6 text-orange-600" /></div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">Prevención de Riesgos</h1>
          <p className="text-sm text-muted-foreground">Documentos, protocolos y aprobaciones</p>
        </div>
      </div>
      <Tabs defaultValue="biblioteca">
        <TabsList className="mb-4">
          <TabsTrigger value="biblioteca">📚 Biblioteca del personal</TabsTrigger>
          <TabsTrigger value="gestion">📝 Gestión y aprobación</TabsTrigger>
        </TabsList>
        <TabsContent value="biblioteca"><BibliotecaTab docs={docs} /></TabsContent>
        <TabsContent value="gestion"><GestionTab docs={docs} isAdmin={isAdmin} refetch={refetch} /></TabsContent>
      </Tabs>
    </div>
  );
}