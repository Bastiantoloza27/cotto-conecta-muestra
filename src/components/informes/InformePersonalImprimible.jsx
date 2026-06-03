import { format } from "date-fns";
import { es } from "date-fns/locale";

const POSITION_LABELS = {
  director: "Director/a", enfermero: "Enfermero/a", tecnico_enfermeria: "Téc. Enfermería",
  kinesiologo: "Kinesiólogo/a", terapeuta_ocupacional: "Terapeuta Ocup.", psicologo: "Psicólogo/a",
  trabajador_social: "Trabajador/a Social", nutricionista: "Nutricionista", medico: "Médico/a",
  auxiliar_cuidado: "Auxiliar de Cuidado", auxiliar_aseo: "Auxiliar de Aseo",
  administrativo: "Administrativo/a", capellan: "Capellán", voluntario: "Voluntario/a", otro: "Otro",
};
const AREA_LABELS = {
  salud: "Salud", cuidado: "Cuidado", administracion: "Administración",
  pastoral: "Pastoral", servicios_generales: "Serv. Generales", otro: "Otro",
};
const CONTRACT_LABELS = { planta: "Planta", contrata: "Contrata", honorarios: "Honorarios", voluntario: "Voluntario" };

export default function InformePersonalImprimible({ staff, filterArea }) {
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const activos = staff.filter(s => s.status === "activo");
  const licencia = staff.filter(s => s.status === "licencia");
  const vacaciones = staff.filter(s => s.status === "vacaciones");

  const byArea = {};
  staff.forEach(s => { byArea[s.area || "otro"] = (byArea[s.area || "otro"] || 0) + 1; });

  return (
    <html>
      <head>
        <title>Nómina de Personal</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 20px; }
          h1 { font-size: 17px; font-weight: bold; color: #312e81; margin-bottom: 4px; }
          .subtitle { font-size: 11px; color: #666; margin-bottom: 4px; }
          .meta { font-size: 9px; color: #888; margin-bottom: 16px; }
          .stats-row { display: flex; gap: 10px; margin-bottom: 16px; }
          .stat { flex: 1; border: 1px solid #ddd; border-radius: 6px; padding: 8px; text-align: center; }
          .stat-num { font-size: 20px; font-weight: bold; color: #312e81; }
          .stat-label { font-size: 9px; color: #888; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { background: #e0e7ff; padding: 5px 7px; text-align: left; border: 1px solid #c7d2fe; font-weight: 600; }
          td { padding: 5px 7px; border: 1px solid #e5e7eb; vertical-align: middle; }
          tr:nth-child(even) td { background: #f9fafb; }
          .badge { display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 8px; font-weight: 600; }
          .activo { background: #d1fae5; color: #065f46; }
          .licencia { background: #ffedd5; color: #9a3412; }
          .vacaciones { background: #e0f2fe; color: #075985; }
          .inactivo { background: #f3f4f6; color: #6b7280; }
          .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; display: flex; justify-content: space-between; font-size: 9px; color: #999; }
          @media print { body { padding: 10px; } }
        `}</style>
      </head>
      <body>
        <h1>👥 Nómina de Personal</h1>
        <p className="subtitle">{filterArea !== "todos" ? `Área: ${AREA_LABELS[filterArea] || filterArea}` : "Todas las áreas"} · {staff.length} funcionario(s)</p>
        <p className="meta">Generado el {today} · Pequeño Cottolengo</p>

        <div className="stats-row">
          <div className="stat"><div className="stat-num">{activos.length}</div><div className="stat-label">Activos</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#ea580c" }}>{licencia.length}</div><div className="stat-label">Con licencia</div></div>
          <div className="stat"><div className="stat-num" style={{ color: "#0284c7" }}>{vacaciones.length}</div><div className="stat-label">Vacaciones</div></div>
          <div className="stat"><div className="stat-num">{staff.length}</div><div className="stat-label">Total</div></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>RUT</th>
              <th>Cargo</th>
              <th>Área</th>
              <th>Turno</th>
              <th>Contrato</th>
              <th>Ingreso</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: "center", color: "#888", padding: "16px" }}>Sin funcionarios</td></tr>
            ) : staff.map(s => (
              <tr key={s.id}>
                <td><strong>{s.full_name}</strong></td>
                <td>{s.rut || "—"}</td>
                <td>{POSITION_LABELS[s.position] || s.position}</td>
                <td>{AREA_LABELS[s.area] || "—"}</td>
                <td className="capitalize">{s.shift_type || "—"}</td>
                <td>{CONTRACT_LABELS[s.contract_type] || "—"}</td>
                <td>{s.admission_date || "—"}</td>
                <td>{s.phone || "—"}</td>
                <td>{s.email || "—"}</td>
                <td><span className={`badge ${s.status}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer">
          <span>Pequeño Cottolengo Quintero — Nómina de Personal</span>
          <span>Generado: {today}</span>
        </div>
      </body>
    </html>
  );
}