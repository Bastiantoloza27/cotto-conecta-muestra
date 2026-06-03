import { format } from "date-fns";
import { es } from "date-fns/locale";

const SEV_LABELS = { leve: "Leve", moderado: "Moderado", grave: "Grave", critico: "Crítico" };
const TYPE_LABELS = {
  caida: "Caída", agresion: "Agresión", crisis: "Crisis", accidente: "Accidente",
  derivacion: "Derivación", fuga: "Fuga", autolesion: "Autolesión", otro: "Otro",
};
const STATUS_LABELS = { abierto: "Abierto", en_seguimiento: "Seguimiento", cerrado: "Cerrado" };

export default function InformeIncidentesImprimible({ incidents, filtros, desde, hasta }) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });

  const byType = {};
  incidents.forEach(i => { byType[i.type] = (byType[i.type] || 0) + 1; });
  const bySev = {};
  incidents.forEach(i => { bySev[i.severity] = (bySev[i.severity] || 0) + 1; });

  return (
    <html>
      <head>
        <title>Informe de Incidentes</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
          h1 { font-size: 18px; font-weight: bold; color: #b91c1c; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 4px; }
          .meta { font-size: 10px; color: #888; margin-bottom: 16px; }
          .stats-row { display: flex; gap: 12px; margin-bottom: 20px; }
          .stat-card { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; text-align: center; }
          .stat-num { font-size: 22px; font-weight: bold; }
          .stat-label { font-size: 10px; color: #888; }
          .stat-red .stat-num { color: #dc2626; }
          .stat-orange .stat-num { color: #ea580c; }
          .stat-amber .stat-num { color: #d97706; }
          .stat-green .stat-num { color: #059669; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 24px; }
          th { background: #fef2f2; padding: 6px 8px; text-align: left; border: 1px solid #fca5a5; font-weight: 600; }
          td { padding: 5px 8px; border: 1px solid #eee; vertical-align: top; }
          tr:nth-child(even) td { background: #fafafa; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
          .leve { background: #d1fae5; color: #065f46; }
          .moderado { background: #fef3c7; color: #92400e; }
          .grave { background: #ffedd5; color: #9a3412; }
          .critico { background: #fee2e2; color: #991b1b; }
          .abierto { background: #fee2e2; color: #991b1b; }
          .en_seguimiento { background: #fef3c7; color: #92400e; }
          .cerrado { background: #d1fae5; color: #065f46; }
          .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
          .firma-box { margin-top: 40px; display: flex; gap: 40px; }
          .firma-line { flex: 1; border-top: 1px solid #999; padding-top: 6px; text-align: center; font-size: 10px; color: #666; }
          @media print { body { padding: 12px; } }
        `}</style>
      </head>
      <body>
        <h1>⚠️ Informe de Incidentes</h1>
        <p className="subtitle">
          Período: {desde} al {hasta} · Estado: {filtros?.estado === "todos" ? "Todos" : STATUS_LABELS[filtros?.estado] || filtros?.estado}
        </p>
        <p className="meta">Generado el {today} · Pequeño Cottolengo</p>

        {/* Estadísticas */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{incidents.length}</div>
            <div className="stat-label">Total incidentes</div>
          </div>
          <div className="stat-card stat-red">
            <div className="stat-num">{incidents.filter(i => i.status === "abierto").length}</div>
            <div className="stat-label">Abiertos</div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-num">{incidents.filter(i => i.severity === "grave" || i.severity === "critico").length}</div>
            <div className="stat-label">Graves/Críticos</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-num">{incidents.filter(i => i.status === "cerrado").length}</div>
            <div className="stat-label">Cerrados</div>
          </div>
          <div className="stat-card stat-amber">
            <div className="stat-num">{incidents.filter(i => i.notified_family).length}</div>
            <div className="stat-label">Familia notificada</div>
          </div>
        </div>

        {/* Tabla */}
        <table>
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th>Residente</th>
              <th>Tipo</th>
              <th>Severidad</th>
              <th>Descripción</th>
              <th>Acciones tomadas</th>
              <th>Estado</th>
              <th>Familia</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "#888", padding: "16px" }}>Sin incidentes en el período seleccionado</td></tr>
            ) : incidents.map(inc => (
              <tr key={inc.id}>
                <td style={{ whiteSpace: "nowrap" }}>{inc.date}{inc.time && <><br />{inc.time}</>}</td>
                <td><strong>{inc.resident_name || "—"}</strong></td>
                <td>{TYPE_LABELS[inc.type] || inc.type}</td>
                <td><span className={`badge ${inc.severity}`}>{SEV_LABELS[inc.severity]}</span></td>
                <td style={{ maxWidth: "160px" }}>{inc.description}</td>
                <td style={{ maxWidth: "140px" }}>{inc.actions_taken || "—"}</td>
                <td><span className={`badge ${inc.status?.replace(" ", "_")}`}>{STATUS_LABELS[inc.status]}</span></td>
                <td style={{ textAlign: "center" }}>{inc.notified_family ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="firma-box">
          <div className="firma-line">Director/a</div>
          <div className="firma-line">Profesional responsable</div>
        </div>

        <div className="footer">
          <span>Pequeño Cottolengo Quintero — Informe de Incidentes</span>
          <span>Generado: {today}</span>
        </div>
      </body>
    </html>
  );
}