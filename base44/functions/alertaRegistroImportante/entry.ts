import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const { registro, tipo } = payload;

    if (!registro) {
      return Response.json({ ok: false, message: "Sin datos de registro" });
    }

    // Obtener todo el personal (staff members con email) y admins
    const [staffList, admins] = await Promise.all([
      base44.asServiceRole.entities.StaffMember.filter({ status: "activo" }),
      base44.asServiceRole.entities.User.filter({ role: "admin" }),
    ]);

    // Recopilar emails únicos: admins + staff con email registrado
    const emailSet = new Set();
    admins.forEach(a => { if (a.email) emailSet.add(a.email.toLowerCase()); });
    staffList.forEach(s => { if (s.email) emailSet.add(s.email.toLowerCase()); });

    if (emailSet.size === 0) {
      return Response.json({ ok: false, message: "No hay destinatarios con email" });
    }

    const tipoLabel = {
      cuidadora: "🤲 Cuidadoras",
      tens: "🩺 TENS",
      psicosocial: "🧩 Psicosocial",
    }[tipo] || "Bitácora";

    const residente = registro.resident_name || "Observación general";
    const registradoPor = registro.registered_by || "No indicado";
    const categoria = (registro.category || "otro").replace(/_/g, " ");
    const fecha = registro.date || new Date().toISOString().split("T")[0];
    const hora = registro.time || "";

    const subject = `⚡ Registro importante – ${residente} [${tipoLabel}]`;

    const body = `⚡ REGISTRO MARCADO COMO IMPORTANTE

Bitácora: ${tipoLabel}
Residente: ${residente}
Categoría: ${categoria}
Fecha: ${fecha}${hora ? " · " + hora : ""}
Registrado por: ${registradoPor}

${registro.title ? "Título: " + registro.title + "\n" : ""}Descripción:
${registro.description}

⚡ Ingresa a la plataforma para revisar este registro.

Providentia – Pequeño Cottolengo Quintero`;

    await Promise.all(
      Array.from(emailSet).map(email =>
        base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, body })
      )
    );

    return Response.json({ ok: true, notificados: emailSet.size });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});