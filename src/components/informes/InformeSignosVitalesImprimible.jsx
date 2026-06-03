import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function getAlert(sv) {
  const alerts = [];
  if (sv.saturacion && sv.saturacion < 90) alerts.push("SAT↓");
  if (sv.temperatura && sv.temperatura > 38) alerts.push("FIEBRE");
  if (sv.temperatura && sv.temperatura < 35) alerts.push("HIPOT.");
  if (sv.pa_sistolica && sv.pa_sistolica > 160) alerts.push("PA↑");
  if (sv.pa_sistolica && sv.pa_sistolica < 90) alerts.push("PA↓");
  return alerts;
}

export default function InformeSignosVitalesImprimible({ residents, signosVitales, date }) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const dateLabel = format(parseISO(date), "EEEE dd 'de' MMMM 'de' yyyy", { locale: es });

  const withData = residents.filter(r => signosVitales.some(s => s.resident_id === r.id && s.date === date));
  const withAlert = withData.filter(r => {
    const sv = signosVitales.find(s => s.resident_id === r.id && s.date === date);
    return sv && getAlert(sv).length > 0;
  });

  return (
    <html>
      <head>
        <title>Signos Vitales {date}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
          h1 { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 4px; }
          .meta { font-size: 10px; color: #888; margin-bottom: 16px; }
          .stats-row { display: flex; gap: 12px; margin-bottom: 16px; }
          .stat { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 8px; text-align: center; }
          .stat-num { font-size: 20px; font-weight: bold; color: #1e40af; }
          .stat-label { font-size: 9px; color: #888; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background: #dbeafe; padding: 6px 8px; text-align: center; border: 1px solid #bfdbfe; font-weight: 600; }
          th.left { text-align: left; }
          td { padding: 5px 8px; border: 1px solid #e5e7eb; text-align: center; vertical-align: middle; }
          td.left { text-align: left; }
          tr:nth-child(even) td { background: #f8faff; }
          .ok { color: #059669; font-weight: 600; }
          .warn { color: #d97706; font-weight: 700; }
          .alert { color: #dc2626; font-weight: 700; }
          .alert-tag { background: #fee2e2; color: #991b1b; font-size: 8px; padding: 1px 4px; border-radius: 3px; font-weight: 700; margin-left: 2px; }
          .no-data { color: #ccc; }
          .footer { margin-top: 28px; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
          @media print { body { padding: 12px; } }
        `}</style>
      </head>
      <body>
        <h1>🫀 Registro de Signos Vitales</h1>
        <p className="subtitle" style={{ textTransform: "capitalize" }}>{dateLabel}</p>
        <p className="meta">Generado el {today} · Pequeño Cottolengo</p>

        <div className="stats-row">
          <div className="stat"><div className="stat-num">{residents.length}</div><div className="stat-label">Total residentes</div></div>
          <div className="stat"><div className="stat-num">{withData.length}</div><div className="stat-label">Con registro</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#dc2626" }}>{withAlert.length}</div><div className="stat-label">Con alerta</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#888" }}>{residents.length - withData.length}</div><div className="stat-label">Sin registro</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th className="left">Residente</th>
              <th>PA (mmHg)</th>
              <th>Saturación O₂</th>
              <th>Temperatura</th>
              <th>Frec. Cardíaca</th>
              <th>Alertas</th>
              <th className="left">Encargada</th>
              <th className="left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {residents.map(r => {
              const sv = signosVitales.find(s => s.resident_id === r.id && s.date === date);
              const alerts = sv ? getAlert(sv) : [];
              return (
                <tr key={r.id}>
                  <td className="left"><strong>{r.preferred_name || r.full_name}</strong>{r.room && <span style={{ color: "#888" }}> · Hab. {r.room}</span>}</td>
                  {sv ? (
                    <>
                      <td className={sv.pa_sistolica > 160 || sv.pa_sistolica < 90 ? "alert" : "ok"}>
                        {sv.pa_sistolica && sv.pa_diastolica ? `${sv.pa_sistolica}/${sv.pa_diastolica}` : "—"}
                      </td>
                      <td className={sv.saturacion < 90 ? "alert" : sv.saturacion < 95 ? "warn" : "ok"}>
                        {sv.saturacion ? `${sv.saturacion}%` : "—"}
                      </td>
                      <td className={sv.temperatura > 38 || sv.temperatura < 35 ? "alert" : "ok"}>
                        {sv.temperatura ? `${sv.temperatura}°C` : "—"}
                      </td>
                      <td className="ok">{sv.frecuencia_cardiaca ? `${sv.frecuencia_cardiaca} lpm` : "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        {alerts.length > 0
                          ? alerts.map(a => <span key={a} className="alert-tag">{a}</span>)
                          : <span className="ok">✓ Normal</span>}
                      </td>
                      <td className="left">{sv.encargada || "—"}</td>
                      <td className="left">{sv.observaciones || "—"}</td>
                    </>
                  ) : (
                    <td colSpan={7} className="no-data" style={{ textAlign: "center", fontStyle: "italic" }}>Sin registro del día</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: "12px", fontSize: "9px", color: "#888", background: "#f0f9ff", padding: "8px", borderRadius: "4px", border: "1px solid #bfdbfe" }}>
          <strong>Valores de referencia:</strong> PA: 90-140/60-90 mmHg · Saturación: ≥95% · Temperatura: 35-37.5°C · Frecuencia cardíaca: 60-100 lpm
        </div>

        <div className="footer">
          <span>Pequeño Cottolengo Quintero — Signos Vitales</span>
          <span>Generado: {today}</span>
        </div>
      </body>
    </html>
  );
}