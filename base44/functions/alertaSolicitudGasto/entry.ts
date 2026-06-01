import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));
    const solicitud = payload.data;

    if (!solicitud) {
      return Response.json({ ok: false, message: "Sin datos" });
    }

    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });

    const categoriaLabels = {
      insumos: "Insumos", traslado: "Traslado", alimentacion: "Alimentación",
      mantenimiento: "Mantenimiento", capacitacion: "Capacitación", otros: "Otros"
    };

    const montoFormateado = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(solicitud.monto || 0);

    const body = `📋 Nueva Solicitud de Gasto Pendiente de Aprobación

Solicitante: ${solicitud.solicitante_nombre}
Categoría: ${categoriaLabels[solicitud.categoria] || solicitud.categoria}
Monto: ${montoFormateado}
Motivo: ${solicitud.motivo}
${solicitud.detalle ? `\nDetalle: ${solicitud.detalle}` : ""}
Fecha: ${solicitud.fecha_solicitud}

Ingresa a la plataforma en Gestión → Control de Gastos para aprobar o rechazar esta solicitud.

Providentia – Pequeño Cottolengo Quintero`;

    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `💰 Nueva solicitud de gasto – ${solicitud.solicitante_nombre} · ${montoFormateado}`,
        body,
      })
    ));

    return Response.json({ ok: true, notificados: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});