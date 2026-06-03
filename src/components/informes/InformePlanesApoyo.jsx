import { format } from "date-fns";
import { es } from "date-fns/locale";

const AREA_LABELS = {
  autonomia: "Autonomía", salud: "Salud", social: "Social", emocional: "Emocional",
  espiritual: "Espiritual", comunicacion: "Comunicación", movilidad: "Movilidad",
  cognitivo: "Cognitivo", otro: "Otro",
};
const STATUS_LABELS = {
  activo: "Activo", en_pausa: "En pausa", logrado: "Logrado",
  reformulado: "Reformulado", cerrado: "Cerrado",
};

export default function InformePlanesApoyo({ plans, statusFilter }) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const logrados = plans.filter(p => p.status === "logrado");
  const activos = plans.filter(p => p.status === "activo");
  const avgProgress = activos.length > 0
    ? Math.round(activos.reduce((s, p) => s + (p.progress || 0), 0) / activos.length)
    : 0;

  // Agrupar por residente
  const byResident = {};
  plans.forEach(p => {
    const k = p.resident_name || "Sin asignar";
    if (!byResident[k]) byResident[k] = [];
    byResident[k].push(p);
  });

  return (
    <html>
      <head>
        <title>Planes de Apoyo</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 20px; }
          h1 { font-size: 17px; font-weight: bold; color: #1d4ed8; margin-bottom: 4px; }
          .subtitle { font-size: 11px; color: #666; margin-bottom: 4px; }
          .meta { font-size: 9px; color: #888; margin-bottom: 16px; }
          .stats-row { display: flex; gap: 10px; margin-bottom: 16px; }
          .stat { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 8px; text-align: center; }
          .stat-num { font-size: 20px; font-weight: bold; color: #1d4ed8; }
          .stat-label { font-size: 9px; color: #888; }
          .resident-block { margin-bottom: 18px; page-break-inside: avoid; }
          .resident-header { background: #dbeafe; padding: 5px 10px; border-radius: 5px; font-weight: bold; font-size: 11px; color: #1e40af; margin-bottom: 5px; border-left: 4px solid #2563eb; }
          table { width: 100%; border-collapse: collapse; font-size: 9px; }
          th { background: #f0f9ff; padding: 4px 6px; text-align: left; border: 1px solid #bae6fd; font-weight: 600; }
          td { padding: 4px 6px; border: 1px solid #e5e7eb; vertical-align: top; }
          tr:nth-child(even) td { background: #f9fafb; }
          .progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; margin-top: 2px; }
          .progress-fill { height: 100%; background: #2563eb; border-radius: 3px; }
          .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 8px; font-weight: 600; }
          .activo { background: #dbeafe; color: #1e40af; }
          .en_pausa { background: #fef3c7; color: #92400e; }
          .logrado { background: #d1fae5; color: #065f46; }
          .reformulado { background: #f3e8ff; color: #6b21a8; }
          .cerrado { background: #f3f4f6; color: #6b7280; }
          .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
          @media print { body { padding: 10px; } }
        `}</style>
      </head>
      <body>
        <h1>🎯 Informe de Planes de Apoyo</h1>
        <p className="subtitle">
          {statusFilter === "todos" ? "Todos los estados" : `Estado: ${STATUS_LABELS[statusFilter] || statusFilter}`} · {Object.keys(byResident).length} residente(s) · {plans.length} plan(es)
        </p>
        <p className="meta">Generado el {today} · Pequeño Cottolengo</p>

        <div className="stats-row">
          <div className="stat"><div className="stat-num">{plans.length}</div><div className="stat-label">Total planes</div></div>
          <div className="stat"><div className="stat-num">{activos.length}</div><div className="stat-label">Activos</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#059669" }}>{logrados.length}</div><div className="stat-label">Logrados</div></div>
          <div className="stat"><div className="stat-num">{avgProgress}%</div><div className="stat-label">Avance promedio</div></div>
        </div>

        {Object.entries(byResident).map(([residentName, rPlans]) => (
          <div key={residentName} className="resident-block">
            <div className="resident-header">👤 {residentName} — {rPlans.length} plan(es)</div>
            <table>
              <thead>
                <tr>
                  <th>Objetivo</th>
                  <th>Área</th>
                  <th>Estado</th>
                  <th>Avance</th>
                  <th>Inicio</th>
                  <th>Meta</th>
                  <th>Responsable</th>
                  <th>Apoyos necesarios</th>
                </tr>
              </thead>
              <tbody>
                {rPlans.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.title}</strong>{p.description && <><br /><span style={{ color: "#666" }}>{p.description.slice(0, 80)}{p.description.length > 80 ? "..." : ""}</span></>}</td>
                    <td>{AREA_LABELS[p.area] || p.area}</td>
                    <td><span className={`badge ${p.status}`}>{STATUS_LABELS[p.status]}</span></td>
                    <td style={{ width: "60px" }}>
                      <span>{p.progress || 0}%</span>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${p.progress || 0}%` }} /></div>
                    </td>
                    <td>{p.start_date || "—"}</td>
                    <td>{p.target_date || "—"}</td>
                    <td>{p.responsible || "—"}</td>
                    <td>{p.supports || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="footer">
          <span>Pequeño Cottolengo Quintero — Planes de Apoyo</span>
          <span>Generado: {today}</span>
        </div>
      </body>
    </html>
  );
}