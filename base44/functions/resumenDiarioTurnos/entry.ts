import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().split("T")[0];

    const [shifts, admins] = await Promise.all([
      base44.asServiceRole.entities.StaffShift.filter({ date: today }),
      base44.asServiceRole.entities.User.filter({ role: "admin" }),
    ]);

    const shiftTypeLabels = { manana: "Mañana", tarde: "Tarde", noche: "Noche", largo: "Largo" };
    const statusEmojis = { programado: "📋", presente: "✅", ausente: "❌", reemplazo: "🔄", licencia: "🏥" };

    const byTurno = { manana: [], tarde: [], noche: [], largo: [] };
    shifts.forEach(s => {
      if (byTurno[s.shift_type]) byTurno[s.shift_type].push(s);
      else byTurno.largo.push(s);
    });

    let turnosTexto = "";
    for (const [tipo, lista] of Object.entries(byTurno)) {
      if (lista.length === 0) continue;
      turnosTexto += `\n🕐 Turno ${shiftTypeLabels[tipo]}:\n`;
      lista.forEach(s => {
        const horario = s.hora_inicio ? ` (${s.hora_inicio}${s.hora_fin ? `–${s.hora_fin}` : ""})` : "";
        turnosTexto += `  ${statusEmojis[s.status] || "📋"} ${s.staff_name}${horario}${s.area ? ` · ${s.area}` : ""}\n`;
      });
    }

    if (shifts.length === 0) {
      turnosTexto = "\nNo hay turnos registrados para hoy.\n";
    }

    const dateStr = new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const emailBody = `Buenos días 👋

Aquí está el resumen de turnos para hoy, ${dateStr}:
${turnosTexto}
Total funcionarios en turno: ${shifts.length}

Ingresa a la plataforma para más detalles.

Providentia – Pequeño Cottolengo Quintero`;

    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `📋 Turnos del día – ${dateStr}`,
        body: emailBody,
      })
    ));

    return Response.json({ ok: true, turnos: shifts.length, notificados: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});