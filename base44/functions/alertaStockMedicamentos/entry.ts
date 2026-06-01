import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [medications, admins] = await Promise.all([
      base44.asServiceRole.entities.Medication.filter({ status: "activo" }),
      base44.asServiceRole.entities.User.filter({ role: "admin" }),
    ]);

    const criticos = medications.filter(m => m.stock_remaining > 0 && m.stock_remaining < 5);
    const bajos = medications.filter(m => m.stock_remaining >= 5 && m.stock_remaining < 10);
    const sinStock = medications.filter(m => m.stock_remaining === 0);

    if (criticos.length === 0 && bajos.length === 0 && sinStock.length === 0) {
      return Response.json({ ok: true, message: "Stock OK, sin alertas" });
    }

    let cuerpo = "⚠️ Alerta de Stock de Medicamentos\n\n";

    if (sinStock.length > 0) {
      cuerpo += "🔴 SIN STOCK (urgente):\n";
      sinStock.forEach(m => cuerpo += `  • ${m.name} – ${m.resident_name}\n`);
      cuerpo += "\n";
    }

    if (criticos.length > 0) {
      cuerpo += "🟠 STOCK CRÍTICO (menos de 5 unidades):\n";
      criticos.forEach(m => cuerpo += `  • ${m.name} – ${m.resident_name} · Stock: ${m.stock_remaining}\n`);
      cuerpo += "\n";
    }

    if (bajos.length > 0) {
      cuerpo += "🟡 STOCK BAJO (menos de 10 unidades):\n";
      bajos.forEach(m => cuerpo += `  • ${m.name} – ${m.resident_name} · Stock: ${m.stock_remaining}\n`);
      cuerpo += "\n";
    }

    cuerpo += "Ingresa a la plataforma para gestionar el reabastecimiento.\n\nProvidenita – Pequeño Cottolengo Quintero";

    await Promise.all(admins.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `💊 Alerta de Stock – ${sinStock.length + criticos.length} medicamento(s) requieren atención`,
        body: cuerpo,
      })
    ));

    return Response.json({ ok: true, criticos: criticos.length, bajos: bajos.length, sinStock: sinStock.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});