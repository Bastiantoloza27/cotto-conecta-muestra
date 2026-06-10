import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const { solicitud, accion } = payload; // accion: "aprobada" | "rechazada"

    if (!solicitud || !solicitud.solicitante_email) {
      return Response.json({ ok: false, message: "Faltan datos de la solicitud o email del solicitante" });
    }

    const montoFormateado = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(solicitud.monto || 0);

    const categoriaLabels = {
      insumos: "Insumos", traslado: "Traslado", alimentacion: "Alimentación",
      mantenimiento: "Mantenimiento", capacitacion: "Capacitación", otros: "Otros"
    };

    const esAprobada = accion === "aprobada";

    const subject = esAprobada
      ? `✅ Tu solicitud de gasto fue aprobada – ${montoFormateado}`
      : `❌ Tu solicitud de gasto fue rechazada`;

    const body = esAprobada
      ? `Hola ${solicitud.solicitante_nombre},

Tu solicitud de gasto ha sido APROBADA.

Detalle de la solicitud:
• Motivo: ${solicitud.motivo}
• Categoría: ${categoriaLabels[solicitud.categoria] || solicitud.categoria}
• Monto aprobado: ${montoFormateado}
• Fecha solicitud: ${solicitud.fecha_solicitud}

Puedes revisar el estado de tus solicitudes ingresando a Providentia → Control de Gastos.

Providentia – Pequeño Cottolengo Quintero`
      : `Hola ${solicitud.solicitante_nombre},

Lamentamos informarte que tu solicitud de gasto ha sido RECHAZADA.

Detalle de la solicitud:
• Motivo: ${solicitud.motivo}
• Categoría: ${categoriaLabels[solicitud.categoria] || solicitud.categoria}
• Monto solicitado: ${montoFormateado}
• Fecha solicitud: ${solicitud.fecha_solicitud}

${solicitud.motivo_rechazo ? `Motivo del rechazo: ${solicitud.motivo_rechazo}\n` : ""}
Si tienes dudas, contacta a la dirección del establecimiento.

Providentia – Pequeño Cottolengo Quintero`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: solicitud.solicitante_email,
      subject,
      body,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});