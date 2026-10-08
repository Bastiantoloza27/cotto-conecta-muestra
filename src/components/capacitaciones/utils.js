export const TIPOS_CAP = {
  induccion: "Inducción", seguridad: "Seguridad", salud: "Salud ocupacional",
  emergencias: "Emergencias", cuidado: "Cuidado de residentes", otra: "Otra",
};

export const ESTADOS_CAP = {
  pendiente: { label: "Pendiente", cls: "bg-slate-100 text-slate-700" },
  atrasada: { label: "Atrasada", cls: "bg-red-100 text-red-700" },
  aprobada: { label: "Aprobada", cls: "bg-green-100 text-green-700" },
  reprobada: { label: "Reprobada", cls: "bg-orange-100 text-orange-700" },
};

export const parsePreguntas = (cap) => {
  try { return JSON.parse(cap?.preguntas || "[]"); } catch { return []; }
};

export const estadoReal = (a, cap) => {
  if (a.estado === "pendiente" && cap?.fecha_caducidad && new Date(cap.fecha_caducidad) < new Date()) return "atrasada";
  return a.estado;
};