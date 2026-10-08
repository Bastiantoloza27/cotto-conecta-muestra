import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CARPETAS = {
  programa_prevencion: 'Programa de Prevención', salud_ocupacional: 'Salud Ocupacional', emergencias: 'Emergencias',
  protocolos: 'Protocolos', procedimientos: 'Procedimientos', instructivos: 'Instructivos', registros: 'Registros',
  planes_contingencia: 'Planes de Contingencia',
};

const EVENTOS = {
  en_revision: { estado: 'Pendiente de revisión', color: '#d97706', asunto: 'Nuevo documento para revisión', encabezado: 'Hay un documento esperando tu revisión', mensaje: 'Se envió un documento de prevención para aprobación del Director.' },
  aprobado: { estado: 'Aprobado', color: '#16a34a', asunto: 'Documento aprobado', encabezado: 'El documento fue aprobado', mensaje: 'El Director aprobó el documento y ya está publicado en la Biblioteca.' },
  devuelto: { estado: 'Devuelto con sugerencias', color: '#5b3a96', asunto: 'Documento devuelto con sugerencias', encabezado: 'El documento necesita ajustes', mensaje: 'El Director devolvió el documento con sugerencias. Revisa los comentarios y envía una nueva versión.' },
  rechazado: { estado: 'Rechazado', color: '#dc2626', asunto: 'Documento rechazado', encabezado: 'El documento fue rechazado', mensaje: 'El Director rechazó el documento. Revisa el comentario para más detalles.' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { doc_id } = await req.json();
    const sr = base44.asServiceRole;
    const doc = await sr.entities.DocumentoPrevencion.get(doc_id);
    const ev = EVENTOS[doc.estado];
    if (!ev) return Response.json({ sent: 0 });

    const admins = await sr.entities.User.filter({ role: 'admin' });
    const emails = new Set(admins.map((a) => a.email));
    if (doc.created_by_id) {
      const autor = await sr.entities.User.filter({ id: doc.created_by_id });
      if (autor[0]?.email) emails.add(autor[0].email);
    }

    const variables = {
      ...ev, asunto: `${ev.asunto}: ${doc.titulo}`, titulo: doc.titulo, codigo: doc.codigo || 'Sin código',
      carpeta: CARPETAS[doc.carpeta] || doc.carpeta, version: doc.version || '1', autor: doc.autor_nombre || 'Sin autor',
      comentario: doc.comentario_director || 'Sin comentarios.',
    };
    const results = await Promise.allSettled([...emails].map((to) =>
      sr.integrations.Core.SendEmail({ to, template_name: 'DocumentoPrevencion', from_name: 'Cotto-Conecta', variables })));
    return Response.json({ sent: results.filter((r) => r.status === 'fulfilled').length, total: emails.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});