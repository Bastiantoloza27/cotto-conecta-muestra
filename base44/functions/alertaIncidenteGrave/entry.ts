import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));
    const incident = payload.data;

    if (!incident) {
      return Response.json({ ok: false, message: "Sin datos de incidente" });
    }

    // Solo procesar si es grave o crítico
    if (!["grave", "critico"].includes(incident.severity)) {
      return Response.json({ ok: false, message: "Severidad no requiere alerta" });
    }

    // Obtener admin/directores
    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });

    const severityLabel = incident.severity === "critico" ? "🔴 CRÍTICO" : "🟠 GRAVE";
    const typeLabels = {
      caida: "Caída", agresion: "Agresión", crisis: "Crisis",
      accidente: "Accidente", derivacion: "Derivación", fuga: "Fuga",
      autolesion: "Autolesión", otro: "Otro"
    };

    const emailBody = `⚠️ ALERTA DE INCIDENTE ${severityLabel}

Residente: ${incident.resident_name || "Sin nombre"}
Tipo: ${typeLabels[incident.type] || incident.type}
Severidad: ${severityLabel}
Fecha: ${incident.date || "No registrada"}
Hora: ${incident.time || "No registrada"}

Descripción:
${incident.description}

Acciones tomadas:
${incident.actions_taken || "No registradas aún"}

⚡ Ingresa a la plataforma para dar seguimiento a este incidente.

Providentia – Pequeño Cottolengo Quintero`;

    const emailPromises = admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `⚠️ Incidente ${severityLabel} – ${incident.resident_name || "Residente"}`,
        body: emailBody,
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ ok: true, notificados: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});