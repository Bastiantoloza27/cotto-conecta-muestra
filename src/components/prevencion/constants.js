import { base44 } from "@/api/base44Client";

export const CARPETAS = {
  programa_prevencion: { label: "Programa de Prevención", emoji: "🛡️", color: "bg-blue-50 border-blue-200 text-blue-800" },
  salud_ocupacional: { label: "Salud Ocupacional", emoji: "🩺", color: "bg-green-50 border-green-200 text-green-800" },
  emergencias: { label: "Emergencias", emoji: "🚨", color: "bg-red-50 border-red-200 text-red-800" },
  protocolos: { label: "Protocolos", emoji: "📋", color: "bg-purple-50 border-purple-200 text-purple-800" },
  procedimientos: { label: "Procedimientos", emoji: "⚙️", color: "bg-slate-50 border-slate-200 text-slate-800" },
  instructivos: { label: "Instructivos", emoji: "📘", color: "bg-sky-50 border-sky-200 text-sky-800" },
  registros: { label: "Registros", emoji: "🗂️", color: "bg-amber-50 border-amber-200 text-amber-800" },
  planes_contingencia: { label: "Planes de Contingencia", emoji: "🧯", color: "bg-orange-50 border-orange-200 text-orange-800" },
};

export const ESTADOS = {
  en_revision: { label: "En revisión", cls: "bg-amber-100 text-amber-800" },
  aprobado: { label: "Aprobado", cls: "bg-green-100 text-green-800" },
  rechazado: { label: "Rechazado", cls: "bg-red-100 text-red-800" },
  devuelto: { label: "Devuelto con sugerencias", cls: "bg-blue-100 text-blue-800" },
};

export const parseHistorial = (doc) => {
  try { return JSON.parse(doc?.historial || "[]"); } catch { return []; }
};

export const addHistorial = (doc, usuario, accion, comentario = "") =>
  JSON.stringify([...parseHistorial(doc), { fecha: new Date().toISOString(), usuario, accion, comentario }]);

export async function abrirArchivo(uri) {
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 600 });
  window.open(signed_url, "_blank");
}