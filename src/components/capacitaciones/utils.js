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

export const parseRecursos = (cap) => {
  let r = [];
  try { r = JSON.parse(cap?.recursos || "[]"); } catch { r = []; }
  if (cap?.recurso_url) r.push({ titulo: "Material", tipo: "link", url: cap.recurso_url });
  if (cap?.recurso_uri) r.push({ titulo: cap.recurso_nombre || "Archivo", tipo: "archivo", uri: cap.recurso_uri, nombre_archivo: cap.recurso_nombre });
  return r;
};

export const embedUrl = (url = "") => {
  const yt = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  const dr = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (dr) return `https://drive.google.com/file/d/${dr[1]}/preview`;
  return null;
};

export const extension = (s = "") => s.split("?")[0].split(".").pop().toLowerCase();

export const estadoReal = (a, cap) => {
  if (a.estado === "pendiente" && cap?.fecha_caducidad && new Date(cap.fecha_caducidad) < new Date()) return "atrasada";
  return a.estado;
};