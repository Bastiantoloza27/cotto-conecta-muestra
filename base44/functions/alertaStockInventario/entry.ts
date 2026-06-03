import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Solo administradores pueden ejecutar esta alerta' }, { status: 403 });
    }

    const items = await base44.asServiceRole.entities.InventoryItem.list("name", 500);
    const farmacos = items.filter(i => i.category === "farmacos");

    const criticos = farmacos.filter(i => {
      const stock = i.current_stock ?? 0;
      const minimo = i.minimum_stock ?? 0;
      return minimo > 0 && stock <= minimo;
    });

    const moderados = farmacos.filter(i => {
      const stock = i.current_stock ?? 0;
      const minimo = i.minimum_stock ?? 0;
      const warning = i.warning_stock ?? 0;
      if (minimo > 0 && stock <= minimo) return false; // ya es crítico
      return warning > 0 && stock <= warning;
    });

    if (criticos.length === 0 && moderados.length === 0) {
      return Response.json({ message: "Todos los fármacos tienen stock suficiente", alertas: 0 });
    }

    // Buscar webhooks de Slack configurados
    const configuraciones = await base44.asServiceRole.entities.ConfiguracionSlack.filter({ activo: true });

    let mensajeSlack = "🏥 *Alerta de Inventario — Fármacos* (Hogar Pequeño Cottolengo)\n\n";

    if (criticos.length > 0) {
      mensajeSlack += `🔴 *Stock CRÍTICO (${criticos.length} ítem${criticos.length > 1 ? "s" : ""}):*\n`;
      criticos.forEach(i => {
        mensajeSlack += `  • ${i.name}: *${i.current_stock ?? 0}* ${i.unit || "unid."} (mínimo: ${i.minimum_stock})\n`;
      });
      mensajeSlack += "\n";
    }

    if (moderados.length > 0) {
      mensajeSlack += `🟡 *Stock MODERADO (${moderados.length} ítem${moderados.length > 1 ? "s" : ""}):*\n`;
      moderados.forEach(i => {
        mensajeSlack += `  • ${i.name}: *${i.current_stock ?? 0}* ${i.unit || "unid."} (advertencia: ${i.warning_stock})\n`;
      });
    }

    mensajeSlack += "\n_Por favor gestionar reposición a la brevedad._";

    const resultados = [];
    for (const config of configuraciones) {
      if (config.solo_urgentes && criticos.length === 0) continue;
      try {
        const res = await fetch(config.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: mensajeSlack }),
        });
        resultados.push({ canal: config.nombre_canal, ok: res.ok });
      } catch (e) {
        resultados.push({ canal: config.nombre_canal, ok: false, error: e.message });
      }
    }

    return Response.json({
      message: "Alerta de stock de fármacos procesada",
      criticos: criticos.length,
      moderados: moderados.length,
      slack: resultados,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});