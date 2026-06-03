import { format } from "date-fns";
import { es } from "date-fns/locale";

const FREQ_LABELS = {
  cada_6h: "Cada 6h", cada_8h: "Cada 8h", cada_12h: "Cada 12h",
  diario: "Diario", semanal: "Semanal", sos: "SOS", otro: "Otro",
};

export default function InformeMedicacionImprimible({ medications, residents, statusFilter }) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });

  // Agrupar por residente
  const grouped = {};
  medications.forEach(m => {
    const key = m.resident_name || "Sin asignar";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  return (
    <html>
      <head>
        <title>Informe Medicación</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; }
          h1 { font-size: 18px; font-weight: bold; color: #4a235a; margin-bottom: 4px; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 4px; }
          .meta { font-size: 10px; color: #888; margin-bottom: 20px; }
          .resident-block { margin-bottom: 20px; page-break-inside: avoid; }
          .resident-header { background: #f3e8ff; padding: 6px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; color: #4a235a; margin-bottom: 6px; border-left: 4px solid #7c3aed; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background: #f5f5f5; padding: 5px 8px; text-align: left; border: 1px solid #ddd; font-weight: 600; }
          td { padding: 5px 8px; border: 1px solid #eee; vertical-align: middle; }
          tr:nth-child(even) td { background: #fafafa; }
          .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
          .activo { background: #d1fae5; color: #065f46; }
          .suspendido { background: #fef3c7; color: #92400e; }
          .completado { background: #e5e7eb; color: #374151; }
          .stock-critical { color: #dc2626; font-weight: bold; }
          .stock-low { color: #d97706; font-weight: bold; }
          .stock-ok { color: #059669; }
          .footer { margin-top: 32px; border-top: 1px solid #ddd; padding-top: 12px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
          @media print { body { padding: 12px; } }
        `}</style>
      </head>
      <body>
        <h1>💊 Informe de Medicación</h1>
        <p className="subtitle">
          {statusFilter === "todos" ? "Todos los estados" : `Estado: ${statusFilter}`} · {Object.keys(grouped).length} residente(s) · {medications.length} medicamento(s)
        </p>
        <p className="meta">Generado el {today} · Pequeño Cottolengo</p>

        {Object.entries(grouped).map(([residentName, meds]) => (
          <div key={residentName} className="resident-block">
            <div className="resident-header">👤 {residentName} ({meds.length} medicamento{meds.length > 1 ? "s" : ""})</div>
            <table>
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosis</th>
                  <th>Frecuencia</th>
                  <th>Horarios</th>
                  <th>Vía</th>
                  <th>Médico</th>
                  <th>Stock</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {meds.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.dosage}</td>
                    <td>{FREQ_LABELS[m.frequency] || m.frequency}</td>
                    <td>{m.schedule_times || "—"}</td>
                    <td className="capitalize">{m.route || "—"}</td>
                    <td>{m.prescribing_doctor ? `Dr/a. ${m.prescribing_doctor}` : "—"}</td>
                    <td>
                      {m.stock_remaining > 0
                        ? <span className={m.stock_remaining < 5 ? "stock-critical" : m.stock_remaining < 10 ? "stock-low" : "stock-ok"}>
                            {m.stock_remaining} un.
                          </span>
                        : "—"}
                    </td>
                    <td><span className={`badge ${m.status}`}>{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="footer">
          <span>Pequeño Cottolengo Quintero — Informe de Medicación</span>
          <span>Generado: {today}</span>
        </div>
      </body>
    </html>
  );
}