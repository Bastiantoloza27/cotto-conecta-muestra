import { format } from "date-fns";
import { es } from "date-fns/locale";

const TYPE_LABELS = {
  taller: "Taller", voluntariado: "Voluntariado", celebracion: "Celebración",
  salida: "Salida", pastoral: "Pastoral", visita: "Visita",
  recreacion: "Recreación", terapia: "Terapia", otro: "Otro",
};
const TYPE_EMOJIS = {
  taller: "🎨", voluntariado: "🤝", celebracion: "🎉", salida: "🚌",
  pastoral: "🕊️", visita: "👋", recreacion: "🎮", terapia: "💆", otro: "📋",
};

export default function InformeActividadesImprimible({ activities, desde, hasta }) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const completadas = activities.filter(a => a.status === "completada");
  const canceladas = activities.filter(a => a.status === "cancelada");
  const totalParticipantes = completadas.reduce((s, a) => s + (a.participants_count || 0), 0);

  const byType = {};
  completadas.forEach(a => { byType[a.type] = (byType[a.type] || 0) + 1; });

  return (
    <html>
      <head>
        <title>Informe de Actividades</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
          h1 { font-size: 18px; font-weight: bold; color: #065f46; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 4px; }
          .meta { font-size: 10px; color: #888; margin-bottom: 16px; }
          .stats-row { display: flex; gap: 12px; margin-bottom: 20px; }
          .stat { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; }
          .stat-num { font-size: 22px; font-weight: bold; color: #065f46; }
          .stat-label { font-size: 10px; color: #888; }
          .section-title { font-size: 12px; font-weight: bold; color: #065f46; margin: 16px 0 6px; border-bottom: 1px solid #d1fae5; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 16px; }
          th { background: #d1fae5; padding: 5px 8px; text-align: left; border: 1px solid #a7f3d0; font-weight: 600; }
          td { padding: 5px 8px; border: 1px solid #eee; vertical-align: top; }
          tr:nth-child(even) td { background: #f9fafb; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
          .completada { background: #d1fae5; color: #065f46; }
          .programada { background: #dbeafe; color: #1e40af; }
          .cancelada { background: #fee2e2; color: #991b1b; }
          .en_curso { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
          @media print { body { padding: 12px; } }
        `}</style>
      </head>
      <body>
        <h1>🎯 Informe de Actividades y Comunidad</h1>
        <p className="subtitle">Período: {desde} al {hasta}</p>
        <p className="meta">Generado el {today} · Pequeño Cottolengo</p>

        <div className="stats-row">
          <div className="stat"><div className="stat-num">{activities.length}</div><div className="stat-label">Total actividades</div></div>
          <div className="stat"><div className="stat-num">{completadas.length}</div><div className="stat-label">Completadas</div></div>
          <div className="stat"><div className="stat-num">{totalParticipantes}</div><div className="stat-label">Participaciones</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#dc2626" }}>{canceladas.length}</div><div className="stat-label">Canceladas</div></div>
        </div>

        {/* Resumen por tipo */}
        {Object.keys(byType).length > 0 && (
          <>
            <div className="section-title">Actividades completadas por tipo</div>
            <table>
              <thead><tr><th>Tipo</th><th>Cantidad</th></tr></thead>
              <tbody>
                {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                  <tr key={type}>
                    <td>{TYPE_EMOJIS[type]} {TYPE_LABELS[type] || type}</td>
                    <td><strong>{count}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Detalle */}
        <div className="section-title">Detalle de actividades</div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Actividad</th>
              <th>Tipo</th>
              <th>Horario</th>
              <th>Lugar</th>
              <th>Responsable</th>
              <th>Participantes</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "#888", padding: "16px" }}>Sin actividades en el período</td></tr>
            ) : activities.map(a => (
              <tr key={a.id}>
                <td style={{ whiteSpace: "nowrap" }}>{a.date}</td>
                <td><strong>{a.title}</strong>{a.description && <><br /><span style={{ color: "#666", fontStyle: "italic" }}>{a.description.slice(0, 60)}{a.description.length > 60 ? "..." : ""}</span></>}</td>
                <td>{TYPE_EMOJIS[a.type]} {TYPE_LABELS[a.type] || a.type}</td>
                <td style={{ whiteSpace: "nowrap" }}>{a.time_start || "—"}{a.time_end ? `–${a.time_end}` : ""}</td>
                <td>{a.location || "—"}</td>
                <td>{a.responsible || "—"}</td>
                <td style={{ textAlign: "center" }}>{a.participants_count || "—"}</td>
                <td><span className={`badge ${a.status}`}>{a.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer">
          <span>Pequeño Cottolengo Quintero — Informe de Actividades</span>
          <span>Generado: {today}</span>
        </div>
      </body>
    </html>
  );
}