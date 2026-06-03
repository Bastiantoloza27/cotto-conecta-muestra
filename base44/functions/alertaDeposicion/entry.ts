import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Calcula cuántos días consecutivos lleva un residente sin deposición
function calcDiasSinDeposicion(residentId, deposiciones, fechaHoy) {
  let dias = 0;
  const base = new Date(fechaHoy);
  while (dias < 10) {
    const dateStr = base.toISOString().split("T")[0];
    const tieneHoy = deposiciones.some(
      d => d.resident_id === residentId && d.date === dateStr && d.tuvo_deposicion === true
    );
    if (tieneHoy) break;
    dias++;
    base.setDate(base.getDate() - 1);
  }
  return dias;
}

const PROTOCOLO = [
  { dias: 3, accion_peg: "30cc lactulosa", accion_sin_peg: "Tacto + enema" },
  { dias: 4, accion_peg: "Tacto + enema", accion_sin_peg: "Extracción manual" },
  { dias: 5, accion_peg: "Extracción manual", accion_sin_peg: "Enema + PEG 20gms" },
  { dias: 6, accion_peg: "⚠️ URGENCIAS", accion_sin_peg: "Enema + PEG 20gms" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const hoy = new Date().toISOString().split("T")[0];

    // Obtener residentes activos y todos los registros de deposición
    const [residents, deposiciones] = await Promise.all([
      base44.asServiceRole.entities.Resident.filter({ status: "activo" }),
      base44.asServiceRole.entities.RegistroDeposicion.list("-date", 500),
    ]);

    const alertas = [];

    for (const r of residents) {
      const dias = calcDiasSinDeposicion(r.id, deposiciones, hoy);
      if (dias >= 3) {
        const protocolo = PROTOCOLO.find(p => p.dias === dias) || PROTOCOLO[PROTOCOLO.length - 1];
        alertas.push({
          nombre: r.preferred_name || r.full_name,
          habitacion: r.room || "—",
          dias,
          protocolo,
          critico: dias >= 6,
        });
      }
    }

    if (alertas.length === 0) {
      return Response.json({ ok: true, message: "Sin alertas de deposición hoy" });
    }

    // Ordenar por días descendente (más críticos primero)
    alertas.sort((a, b) => b.dias - a.dias);

    const admins = await base44.asServiceRole.entities.User.filter({ role: "admin" });

    const filas = alertas.map(a =>
      `• ${a.critico ? "🔴" : "🟡"} ${a.nombre} (Hab. ${a.habitacion}) — ${a.dias} días sin deposición
   Con PEG: ${a.protocolo.accion_peg} | Sin PEG: ${a.protocolo.accion_sin_peg}`
    ).join("\n\n");

    const cuerpo = `🚨 ALERTA DIARIA — CONTROL DE DEPOSICIONES
Fecha: ${hoy}

Los siguientes residentes requieren atención según protocolo:

${filas}

---
Protocolo Cottolengo:
  3 días → Lactulosa / Tacto + enema
  4 días → Tacto + enema / Extracción manual
  5 días → Extracción manual / Enema + PEG
  6+ días → ⚠️ URGENCIAS

Ingresa a Providentia para registrar las intervenciones.

Providentia – Pequeño Cottolengo Quintero`;

    const emailPromises = admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `🚨 Alerta deposición: ${alertas.length} residente(s) requieren atención — ${hoy}`,
        body: cuerpo,
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ ok: true, alertas: alertas.length, notificados: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});