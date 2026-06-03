import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";

const SHIFT_LABELS = { manana: "Mañana", tarde: "Tarde", noche: "Noche", largo: "Largo" };
const SHIFT_COLORS = { manana: "#fef3c7", tarde: "#dbeafe", noche: "#e0e7ff", largo: "#f3e8ff" };
const STATUS_EMOJIS = { programado: "📋", presente: "✅", ausente: "❌", reemplazo: "🔄", licencia: "🏥" };

export default function InformeTurnosImprimible({ shifts, weekStart, days }) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const semanaLabel = `${format(weekStart, "d 'de' MMMM", { locale: es })} – ${format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: es })}`;

  const totalTurnos = shifts.length;
  const ausentes = shifts.filter(s => s.status === "ausente").length;
  const reemplazos = shifts.filter(s => s.status === "reemplazo").length;

  return (
    <html>
      <head>
        <title>Cuadro de Turnos</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 20px; }
          h1 { font-size: 17px; font-weight: bold; color: #1e1b4b; margin-bottom: 4px; }
          .subtitle { font-size: 11px; color: #666; margin-bottom: 4px; }
          .meta { font-size: 9px; color: #888; margin-bottom: 16px; }
          .stats-row { display: flex; gap: 10px; margin-bottom: 16px; }
          .stat { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 8px; text-align: center; }
          .stat-num { font-size: 20px; font-weight: bold; color: #1e1b4b; }
          .stat-label { font-size: 9px; color: #888; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #1e1b4b; color: white; padding: 7px 6px; text-align: center; font-size: 10px; border: 1px solid #ddd; }
          th.day { font-size: 9px; }
          td { padding: 4px 5px; border: 1px solid #e5e7eb; vertical-align: top; min-height: 50px; }
          td.name-col { font-weight: 600; font-size: 10px; width: 120px; background: #f9f9f9; }
          .shift-cell { border-radius: 4px; padding: 2px 4px; margin-bottom: 2px; font-size: 9px; }
          .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
          @media print { body { padding: 10px; } }
        `}</style>
      </head>
      <body>
        <h1>📋 Cuadro de Turnos Semanal</h1>
        <p className="subtitle">Semana: {semanaLabel}</p>
        <p className="meta">Generado el {today} · Pequeño Cottolengo</p>

        <div className="stats-row">
          <div className="stat"><div className="stat-num">{totalTurnos}</div><div className="stat-label">Total turnos</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#dc2626" }}>{ausentes}</div><div className="stat-label">Ausencias</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#d97706" }}>{reemplazos}</div><div className="stat-label">Reemplazos</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Funcionario</th>
              {days.map(day => (
                <th key={day.toString()} className="day">
                  {format(day, "EEE", { locale: es })}<br />{format(day, "d/M")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Agrupar turnos por persona */}
            {(() => {
              const byName = {};
              shifts.forEach(s => {
                if (!byName[s.staff_name]) byName[s.staff_name] = {};
                byName[s.staff_name][s.date] = s;
              });
              return Object.entries(byName).sort((a, b) => a[0].localeCompare(b[0])).map(([name, byDate]) => (
                <tr key={name}>
                  <td className="name-col">{name}</td>
                  {days.map(day => {
                    const d = format(day, "yyyy-MM-dd");
                    const s = byDate[d];
                    return (
                      <td key={d} style={{ textAlign: "center" }}>
                        {s ? (
                          <div className="shift-cell" style={{ background: SHIFT_COLORS[s.shift_type] || "#f5f5f5" }}>
                            <span>{STATUS_EMOJIS[s.status] || ""}</span>
                            <span style={{ fontWeight: 600 }}>{SHIFT_LABELS[s.shift_type]}</span>
                            {s.hora_inicio && <><br /><span style={{ color: "#666" }}>{s.hora_inicio}{s.hora_fin ? `–${s.hora_fin}` : ""}</span></>}
                          </div>
                        ) : <span style={{ color: "#ddd" }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ));
            })()}
          </tbody>
        </table>

        <div className="footer">
          <span>Pequeño Cottolengo Quintero — Cuadro de Turnos</span>
          <span>Generado: {today}</span>
        </div>
      </body>
    </html>
  );
}