import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));
    const med = payload.data;
    const oldData = payload.old_data;
    const eventType = payload.event?.type || "create";

    if (!med) {
      return Response.json({ ok: false, message: "Sin datos de medicamento" });
    }

    // Obtener profesionales de salud y admins
    const [staffMembers, admins] = await Promise.all([
      base44.asServiceRole.entities.StaffMember.filter({ area: "salud", status: "activo" }),
      base44.asServiceRole.entities.User.filter({ role: "admin" }),
    ]);

    const frecuenciaLabels = {
      cada_6h: "Cada 6 horas", cada_8h: "Cada 8 horas", cada_12h: "Cada 12 horas",
      diario: "Diario", semanal: "Semanal", sos: "SOS (según necesidad)", otro: "Otro"
    };
    const rutaLabels = {
      oral: "Oral", sublingual: "Sublingual", topica: "Tópica",
      inyectable: "Inyectable", inhalatoria: "Inhalatoria", rectal: "Rectal", otra: "Otra"
    };

    const isNew = eventType === "create";
    const accion = isNew ? "NUEVO MEDICAMENTO REGISTRADO" : "ACTUALIZACIÓN DE MEDICAMENTO";
    const emoji = isNew ? "💊" : "🔄";

    let cambios = "";
    if (!isNew && oldData) {
      const campos = ["name", "dosage", "frequency", "schedule_times", "route", "status", "prescribing_doctor", "notes"];
      const diff = campos.filter(c => oldData[c] !== med[c]);
      if (diff.length > 0) {
        cambios = "\n📝 Cambios realizados:\n";
        diff.forEach(c => {
          const labels = { name: "Medicamento", dosage: "Dosis", frequency: "Frecuencia",
            schedule_times: "Horarios", route: "Vía", status: "Estado",
            prescribing_doctor: "Médico prescriptor", notes: "Notas" };
          cambios += `  • ${labels[c] || c}: "${oldData[c] || "—"}" → "${med[c] || "—"}"\n`;
        });
      }
    }

    const body = `${emoji} ${accion}

Residente: ${med.resident_name || "Sin nombre"}
Medicamento: ${med.name}
Dosis: ${med.dosage}
Frecuencia: ${frecuenciaLabels[med.frequency] || med.frequency || "—"}
Horarios: ${med.schedule_times || "—"}
Vía de administración: ${rutaLabels[med.route] || med.route || "—"}
Estado: ${med.status}
Médico prescriptor: ${med.prescribing_doctor || "No registrado"}
${med.notes ? `\nNotas: ${med.notes}` : ""}${cambios}
Ingresa a la plataforma para más detalles.

Providentia – Pequeño Cottolengo Quintero`;

    const subject = `${emoji} ${accion} – ${med.resident_name}: ${med.name}`;

    // Recopilar destinatarios únicos: admins + profesionales de salud con email
    const emailsEnviados = new Set();
    const envios = [];

    admins.filter(a => a.email).forEach(a => {
      if (!emailsEnviados.has(a.email)) {
        emailsEnviados.add(a.email);
        envios.push(base44.asServiceRole.integrations.Core.SendEmail({ to: a.email, subject, body }));
      }
    });

    staffMembers.filter(s => s.email).forEach(s => {
      if (!emailsEnviados.has(s.email)) {
        emailsEnviados.add(s.email);
        envios.push(base44.asServiceRole.integrations.Core.SendEmail({ to: s.email, subject, body }));
      }
    });

    await Promise.all(envios);

    return Response.json({ ok: true, notificados: emailsEnviados.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});