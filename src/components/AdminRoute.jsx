import { useRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const { isAdmin, loading } = useRole();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}