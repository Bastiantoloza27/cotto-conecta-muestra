import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));
    const sv = payload.data;

    if (!sv) {
      return Response.json({ ok: false, message: "Sin datos de signos vitales" });
    }

    // Evaluar qué valores están fuera de rango
    const alertas = [];

    if (sv.saturacion && sv.saturacion < 90) {
      alertas.push(`💨 Saturación O₂ MUY BAJA: ${sv.saturacion}% (normal ≥ 95%)`);
    }
    if (sv.temperatura && sv.temperatura > 38) {
      alertas.push(`🌡️ Fiebre: ${sv.temperatura}°C (normal < 38°C)`);
    }
    if (sv.temperatura && sv.temperatura < 35) {
      alertas.push(`🌡️ Hipotermia: ${sv.temperatura}°C (normal > 35°C)`);
    }
    if (sv.pa_sistolica && sv.pa_sistolica > 160) {
      alertas.push(`🫀 Presión arterial ALTA: ${sv.pa_sistolica}/${sv.pa_diastolica || "?"} mmHg (normal ≤ 140)`);
    }
    if (sv.pa_sistolica && sv.pa_sistolica < 90) {
      alertas.push(`🫀 Presión arterial BAJA: ${sv.pa_sistolica}/${sv.pa_diastolica || "?"} mmHg (normal ≥ 90)`);
    }
    if (sv.frecuencia_cardiaca && sv.frecuencia_cardiaca > 100) {
      alertas.push(`❤️ Taquicardia: ${sv.frecuencia_cardiaca} lpm (normal 60–100)`);
    }
    if (sv.frecuencia_cardiaca && sv.frecuencia_cardiaca < 50) {
      alertas.push(`❤️ Bradicardia: ${sv.frecuencia_cardiaca} lpm (normal 60–100)`);
    }

    if (alertas.length === 0) {
      return Response.json({ ok: true, message: "Valores dentro de rango normal" });
    }

    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });

    const cuerpo = `🚨 ALERTA — SIGNOS VITALES CRÍTICOS

Residente: ${sv.resident_name || "Sin nombre"}
Fecha: ${sv.date || "No registrada"}
Registrado por: ${sv.encargada || "No indicado"}

Valores fuera de rango:
${alertas.map(a => `  • ${a}`).join("\n")}

${sv.observaciones ? `Observaciones: ${sv.observaciones}` : ""}

⚡ Verificar estado del residente y contactar al equipo de salud de inmediato.

Providentia – Pequeño Cottolengo Quintero`;

    const emailPromises = admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `🚨 Signos vitales críticos — ${sv.resident_name || "Residente"}`,
        body: cuerpo,
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ ok: true, alertas: alertas.length, notificados: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});