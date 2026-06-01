import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [incidents, admins] = await Promise.all([
      base44.asServiceRole.entities.Incident.filter({ status: "abierto" }),
      base44.asServiceRole.entities.User.filter({ role: "admin" }),
    ]);

    // Filtrar incidentes con más de 3 días sin cerrar
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const viejos = incidents.filter(i => {
      if (!i.date) return false;
      return new Date(i.date) < threeDaysAgo;
    });

    if (viejos.length === 0) {
      return Response.json({ ok: true, message: "Sin incidentes pendientes antiguos" });
    }

    const severityLabels = { leve: "🟢 Leve", moderado: "🟡 Moderado", grave: "🟠 Grave", critico: "🔴 Crítico" };
    const typeLabels = {
      caida: "Caída", agresion: "Agresión", crisis: "Crisis",
      accidente: "Accidente", derivacion: "Derivación", fuga: "Fuga",
      autolesion: "Autolesión", otro: "Otro"
    };

    let lista = "";
    viejos.forEach(i => {
      const diasAbierto = Math.floor((new Date() - new Date(i.date)) / (1000 * 60 * 60 * 24));
      lista += `  • ${i.resident_name} – ${typeLabels[i.type] || i.type} ${severityLabels[i.severity] || ""} (${diasAbierto} días abierto, desde ${i.date})\n`;
    });

    const body = `⚠️ Incidentes Pendientes sin Cerrar

Los siguientes incidentes llevan más de 3 días abiertos y requieren seguimiento:

${lista}
Por favor ingresa a la plataforma y actualiza el estado de estos incidentes.

Providentia – Pequeño Cottolengo Quintero`;

    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `🔔 ${viejos.length} incidente(s) pendiente(s) sin cerrar`,
        body,
      })
    ));

    return Response.json({ ok: true, incidentes: viejos.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});