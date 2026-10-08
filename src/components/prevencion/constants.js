import { base44 } from "@/api/base44Client";
import { ShieldCheck, Stethoscope, Siren, ClipboardList, Workflow, BookOpen, FolderArchive, FireExtinguisher } from "lucide-react";

export const CARPETAS = {
  programa_prevencion: { label: "Programa de Prevención", icon: ShieldCheck },
  salud_ocupacional: { label: "Salud Ocupacional", icon: Stethoscope },
  emergencias: { label: "Emergencias", icon: Siren },
  protocolos: { label: "Protocolos", icon: ClipboardList },
  procedimientos: { label: "Procedimientos", icon: Workflow },
  instructivos: { label: "Instructivos", icon: BookOpen },
  registros: { label: "Registros", icon: FolderArchive },
  planes_contingencia: { label: "Planes de Contingencia", icon: FireExtinguisher },
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