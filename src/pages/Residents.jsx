import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Search, Users, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ResidentFormDialog from "@/components/residents/ResidentFormDialog";

const depColors = {
  leve: "bg-green-50 text-green-700 border-green-200",
  moderada: "bg-amber-50 text-amber-700 border-amber-200",
  severa: "bg-orange-50 text-orange-700 border-orange-200",
  gran_dependencia: "bg-red-50 text-red-700 border-red-200",
};

export default function Residents() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("activo");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: residents = [], isLoading } = useQuery({
    queryKey: ["residents-all"],
    queryFn: () => base44.entities.Resident.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Resident.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residents-all"] });
      setShowForm(false);
    },
  });

  const filtered = residents.filter((r) => {
    const matchSearch = r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.preferred_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "todos" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Personas Residentes"
        subtitle={`${residents.filter(r => r.status === 'activo').length} residentes activos en la comunidad`}
        action={() => setShowForm(true)}
        actionLabel="Nueva persona"
        actionIcon={Plus}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="hospitalizado">Hospitalizados</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin residentes"
          description="Agrega la primera persona residente para comenzar"
          actionLabel="Agregar residente"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <Link key={r.id} to={`/residentes/${r.id}`}>
              <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {r.preferred_name?.[0] || r.full_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {r.preferred_name || r.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.room && `Hab. ${r.room}`} {r.disability_type && `· ${r.disability_type}`}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {r.dependency_level && (
                        <Badge variant="outline" className={`text-[10px] ${depColors[r.dependency_level] || ""}`}>
                          {r.dependency_level.replace("_", " ")}
                        </Badge>
                      )}
                      {r.senadis_registered && (
                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">SENADIS</Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ResidentFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}