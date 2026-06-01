import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));
    const residente = payload.data;
    const oldData = payload.old_data;

    if (!residente || !oldData) {
      return Response.json({ ok: false, message: "Sin datos suficientes" });
    }

    // Solo alertar si cambió el estado a hospitalizado o fallecido
    if (residente.status === oldData.status) {
      return Response.json({ ok: false, message: "Estado sin cambios" });
    }

    const estadosAlerta = ["hospitalizado", "fallecido"];
    if (!estadosAlerta.includes(residente.status)) {
      return Response.json({ ok: false, message: "Estado no requiere alerta" });
    }

    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });

    const statusLabels = {
      hospitalizado: "🏥 Hospitalizado",
      fallecido: "🕊️ Fallecido",
      alta: "✅ Alta",
      traslado: "🚐 Traslado"
    };

    const emoji = residente.status === "fallecido" ? "🕊️" : "🏥";
    const urgencia = residente.status === "fallecido" ? "URGENTE – " : "";

    const body = `${emoji} ${urgencia}Cambio de Estado de Residente

Residente: ${residente.full_name}
${residente.preferred_name ? `Nombre preferido: ${residente.preferred_name}` : ""}
Estado anterior: ${statusLabels[oldData.status] || oldData.status}
Nuevo estado: ${statusLabels[residente.status]}
Habitación: ${residente.room || "No registrada"}

${residente.status === "fallecido" ? "Se requiere atención inmediata para los trámites y comunicación familiar." : "Por favor coordina el seguimiento necesario."}

Providentia – Pequeño Cottolengo Quintero`;

    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `${emoji} ${urgencia}${residente.full_name} – ${statusLabels[residente.status]}`,
        body,
      })
    ));

    return Response.json({ ok: true, notificados: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});