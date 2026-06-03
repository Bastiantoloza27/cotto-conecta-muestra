import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIAS = {
  insumos: "Insumos", traslado: "Traslado", alimentacion: "Alimentación",
  mantenimiento: "Mantenimiento", capacitacion: "Capacitación", otros: "Otros",
};

function formatMonto(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

export default function InformeGastosResumen({ solicitudes, desde, hasta, user }) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const aprobadas = solicitudes.filter(s => s.estado === "aprobada");
  const pendientes = solicitudes.filter(s => s.estado === "pendiente");
  const rechazadas = solicitudes.filter(s => s.estado === "rechazada");
  const totalAprobado = aprobadas.reduce((acc, s) => acc + (s.monto || 0), 0);
  const totalPendiente = pendientes.reduce((acc, s) => acc + (s.monto || 0), 0);

  // Por categoría
  const byCategoria = {};
  aprobadas.forEach(s => {
    byCategoria[s.categoria] = (byCategoria[s.categoria] || 0) + s.monto;
  });

  // Por solicitante
  const bySolicitante = {};
  solicitudes.forEach(s => {
    if (!bySolicitante[s.solicitante_nombre]) bySolicitante[s.solicitante_nombre] = { total: 0, count: 0, aprobadas: 0 };
    bySolicitante[s.solicitante_nombre].count++;
    if (s.estado === "aprobada") {
      bySolicitante[s.solicitante_nombre].aprobadas++;
      bySolicitante[s.solicitante_nombre].total += s.monto;
    }
  });

  return (
    <html>
      <head>
        <title>Resumen de Gastos</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 20px; }
          h1 { font-size: 17px; font-weight: bold; color: #166534; margin-bottom: 4px; }
          .subtitle { font-size: 11px; color: #666; margin-bottom: 4px; }
          .meta { font-size: 9px; color: #888; margin-bottom: 16px; }
          .highlight { font-size: 22px; font-weight: bold; color: #166534; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
          .stat { border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; }
          .stat-num { font-size: 16px; font-weight: bold; }
          .stat-label { font-size: 9px; color: #888; margin-top: 2px; }
          .section-title { font-size: 11px; font-weight: bold; color: #166534; margin: 14px 0 6px; border-bottom: 1px solid #d1fae5; padding-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px; }
          th { background: #d1fae5; padding: 5px 8px; text-align: left; border: 1px solid #a7f3d0; font-weight: 600; }
          th.right { text-align: right; }
          td { padding: 5px 8px; border: 1px solid #eee; vertical-align: middle; }
          td.right { text-align: right; }
          tr:nth-child(even) td { background: #f9fafb; }
          .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 8px; font-weight: 600; }
          .pendiente { background: #fef3c7; color: #92400e; }
          .aprobada { background: #d1fae5; color: #065f46; }
          .rechazada { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 28px; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
          .firma-box { margin-top: 32px; display: flex; gap: 40px; }
          .firma-line { flex: 1; border-top: 1px solid #999; padding-top: 6px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { padding: 10px; } }
        `}</style>
      </head>
      <body>
        <h1>💵 Resumen de Control de Gastos</h1>
        <p className="subtitle">Período: {desde} al {hasta} · {solicitudes.length} solicitudes</p>
        <p className="meta">Generado el {today} por {user?.full_name || user?.email || "Director"} · Pequeño Cottolengo</p>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#166534" }}>Total monto aprobado en el período</div>
          <div className="highlight">{formatMonto(totalAprobado)}</div>
        </div>

        <div className="stats-grid">
          <div className="stat"><div className="stat-num">{solicitudes.length}</div><div className="stat-label">Total solicitudes</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#059669" }}>{aprobadas.length}</div><div className="stat-label">Aprobadas</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#d97706" }}>{pendientes.length}</div><div className="stat-label">Pendientes ({formatMonto(totalPendiente)})</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#dc2626" }}>{rechazadas.length}</div><div className="stat-label">Rechazadas</div></div>
        </div>

        {/* Por categoría */}
        {Object.keys(byCategoria).length > 0 && (
          <>
            <div className="section-title">Gasto aprobado por categoría</div>
            <table>
              <thead><tr><th>Categoría</th><th className="right">Monto aprobado</th><th className="right">% del total</th></tr></thead>
              <tbody>
                {Object.entries(byCategoria).sort((a, b) => b[1] - a[1]).map(([cat, monto]) => (
                  <tr key={cat}>
                    <td>{CATEGORIAS[cat] || cat}</td>
                    <td className="right"><strong>{formatMonto(monto)}</strong></td>
                    <td className="right">{totalAprobado > 0 ? ((monto / totalAprobado) * 100).toFixed(1) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Por solicitante */}
        <div className="section-title">Resumen por solicitante</div>
        <table>
          <thead>
            <tr><th>Solicitante</th><th className="right">Solicitudes</th><th className="right">Aprobadas</th><th className="right">Monto aprobado</th></tr>
          </thead>
          <tbody>
            {Object.entries(bySolicitante).sort((a, b) => b[1].total - a[1].total).map(([nombre, data]) => (
              <tr key={nombre}>
                <td>{nombre}</td>
                <td className="right">{data.count}</td>
                <td className="right">{data.aprobadas}</td>
                <td className="right"><strong>{formatMonto(data.total)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Detalle */}
        <div className="section-title">Detalle de solicitudes</div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Solicitante</th>
              <th>Motivo</th>
              <th>Categoría</th>
              <th className="right">Monto</th>
              <th>Estado</th>
              <th>Resolución</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map(s => (
              <tr key={s.id}>
                <td style={{ whiteSpace: "nowrap" }}>{s.fecha_solicitud}</td>
                <td>{s.solicitante_nombre}</td>
                <td style={{ maxWidth: "140px" }}>{s.motivo}</td>
                <td>{CATEGORIAS[s.categoria]}</td>
                <td className="right"><strong>{formatMonto(s.monto)}</strong></td>
                <td><span className={`badge ${s.estado}`}>{s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}</span></td>
                <td style={{ fontSize: "9px", color: "#666" }}>
                  {s.director_nombre && s.fecha_resolucion
                    ? `${s.director_nombre} · ${format(parseISO(s.fecha_resolucion), "dd/MM HH:mm")}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="firma-box">
          <div className="firma-line">Director/a — {user?.full_name || ""}</div>
          <div className="firma-line">Contabilidad / Administración</div>
        </div>

        <div className="footer">
          <span>Pequeño Cottolengo Quintero — Control de Gastos</span>
          <span>Generado: {today}</span>
        </div>
      </body>
    </html>
  );
}