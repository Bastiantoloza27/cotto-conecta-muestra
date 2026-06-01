import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const today = new Date().toISOString().split("T")[0];

    const [shifts, admins, staffMembers] = await Promise.all([
      base44.asServiceRole.entities.StaffShift.filter({ date: today }),
      base44.asServiceRole.entities.User.filter({ role: "admin" }),
      base44.asServiceRole.entities.StaffMember.filter({ status: "activo" }),
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

    // Notificar a los funcionarios de turno directamente
    const staffEmailMap = {};
    staffMembers.forEach(sm => {
      if (sm.email) {
        const firstName = sm.full_name.split(" ")[0].toLowerCase();
        staffEmailMap[firstName] = sm.email;
        staffEmailMap[sm.full_name.toLowerCase()] = sm.email;
      }
    });

    // Email completo para admins
    const emailBody = `Buenos días 👋

Aquí está el resumen de turnos para hoy, ${dateStr}:
${turnosTexto}
Total funcionarios en turno: ${shifts.length}

Ingresa a la plataforma para más detalles.

Providentia – Pequeño Cottolengo Quintero`;

    const emailsNotificados = new Set();

    // Enviar a admins
    const adminEmails = admins.filter(a => a.email).map(admin => {
      emailsNotificados.add(admin.email);
      return base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `📋 Turnos del día – ${dateStr}`,
        body: emailBody,
      });
    });

    // Enviar a cada funcionario de turno su notificación personal
    const turnoEmails = shifts.flatMap(s => {
      const nombreKey = s.staff_name.split(" ")[0].toLowerCase();
      const email = staffEmailMap[nombreKey] || staffEmailMap[s.staff_name.toLowerCase()];
      if (!email || emailsNotificados.has(email)) return [];
      emailsNotificados.add(email);
      const horario = s.hora_inicio ? ` de ${s.hora_inicio}${s.hora_fin ? ` a ${s.hora_fin}` : ""}` : "";
      return [base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `📋 Tu turno de hoy – ${shiftTypeLabels[s.shift_type] || s.shift_type}`,
        body: `Hola ${s.staff_name} 👋

Te recordamos que hoy, ${dateStr}, tienes turno ${shiftTypeLabels[s.shift_type] || s.shift_type}${horario}.

Que tengas un excelente turno.

Providentia – Pequeño Cottolengo Quintero`,
      })];
    });

    await Promise.all([...adminEmails, ...turnoEmails]);

    return Response.json({ ok: true, turnos: shifts.length, notificados: emailsNotificados.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});