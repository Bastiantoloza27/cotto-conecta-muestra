import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";

// Bloquea el acceso a cuidadoras (solo director y funcionario pueden pasar)
export default function CuidadorRoute({ children }) {
  const { isCuidador, loading } = useRole();
  if (loading) return null;
  if (isCuidador) return <Navigate to="/" replace />;
  return children;
}