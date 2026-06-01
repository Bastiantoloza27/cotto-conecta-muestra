import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(user => setRole(user?.role || "user"))
      .catch(() => setRole("user"))
      .finally(() => setLoading(false));
  }, []);

  return { role, isAdmin: role === "director", loading };
}