import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { BRISTOL } from "./BristolScale";

const TURNOS = ["manana", "tarde", "noche"];
const TURNO_LABEL = { manana: "Mañana", tarde: "Tarde", noche: "Noche" };

const PROTOCOLO = [
  { dias: 3, accion_peg: "30cc lactulosa", accion_sin_peg: "Tacto + enema" },
  { dias: 4, accion_peg: "Tacto + enema", accion_sin_peg: "Extracción manual" },
  { dias: 5, accion_peg: "Extracción manual", accion_sin_peg: "Enema + PEG 20gms" },
  { dias: 6, accion_peg: "⚠️ URGENCIAS", accion_sin_peg: "Enema + PEG 20gms" },
];

export default function InformeDeposicionImprimible({ residents, deposiciones, date, diasSinPorResidente }) {
  const fechaLabel = format(parseISO(date), "EEEE dd 'de' MMMM 'de' yyyy", { locale: es });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#111", padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #4a1a6e", paddingBottom: "10px", marginBottom: "16px" }}>
        <p style={{ fontSize: "8px", color: "#666", marginBottom: "2px" }}>Hogar Pequeño Cottolengo Quintero</p>
        <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 4px 0", color: "#4a1a6e" }}>
          REGISTRO DE DEPOSICIONES
        </h1>
        <p style={{ fontSize: "12px", margin: 0, textTransform: "capitalize" }}>{fechaLabel}</p>
      </div>

      {/* Tabla principal */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
        <thead>
          <tr style={{ backgroundColor: "#4a1a6e", color: "white" }}>
            <th style={{ padding: "6px 8px", textAlign: "left", width: "18%" }}>Residente</th>
            <th style={{ padding: "6px 8px", textAlign: "left", width: "6%" }}>Hab.</th>
            {TURNOS.map(t => (
              <th key={t} colSpan={3} style={{ padding: "6px 4px", textAlign: "center", borderLeft: "1px solid #6a3a8e" }}>
                {TURNO_LABEL[t]}
              </th>
            ))}
            <th style={{ padding: "6px 8px", textAlign: "center", width: "10%", borderLeft: "1px solid #6a3a8e" }}>
              Días sin dep.
            </th>
          </tr>
          <tr style={{ backgroundColor: "#ede9f7", fontSize: "9px", color: "#4a1a6e" }}>
            <th style={{ padding: "4px 8px" }}></th>
            <th></th>
            {TURNOS.map(t => (
              <>
                <th key={t + "-dep"} style={{ padding: "4px 3px", textAlign: "center", borderLeft: "1px solid #ccc" }}>Dep.</th>
                <th key={t + "-cant"} style={{ padding: "4px 3px", textAlign: "center" }}>Cant.</th>
                <th key={t + "-bris"} style={{ padding: "4px 3px", textAlign: "center" }}>Bristol</th>
              </>
            ))}
            <th style={{ padding: "4px 8px", borderLeft: "1px solid #ccc" }}></th>
          </tr>
        </thead>
        <tbody>
          {residents.map((r, idx) => {
            const diasSin = diasSinPorResidente[r.id] || 0;
            const rowBg = idx % 2 === 0 ? "#fff" : "#f8f7fc";
            const alertaBg = diasSin >= 6 ? "#fef2f2" : diasSin >= 5 ? "#fff7ed" : diasSin >= 3 ? "#fffbeb" : rowBg;

            return (
              <tr key={r.id} style={{ backgroundColor: alertaBg }}>
                <td style={{ padding: "5px 8px", fontWeight: "600", borderBottom: "1px solid #e5e7eb" }}>
                  {r.preferred_name || r.full_name}
                </td>
                <td style={{ padding: "5px 8px", color: "#666", borderBottom: "1px solid #e5e7eb" }}>
                  {r.room || "—"}
                </td>

                {TURNOS.map(turno => {
                  const reg = deposiciones.find(
                    d => d.resident_id === r.id && d.date === date && d.turno === turno
                  );
                  const tuvo = reg?.tuvo_deposicion;
                  const bristolInfo = reg?.tipo_bristol ? BRISTOL.find(b => b.tipo === reg.tipo_bristol) : null;

                  return (
                    <>
                      <td key={turno + "-dep"} style={{ padding: "5px 3px", textAlign: "center", borderLeft: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
                        {reg === undefined ? <span style={{ color: "#bbb" }}>—</span> : tuvo ? "✓" : "✗"}
                      </td>
                      <td key={turno + "-cant"} style={{ padding: "5px 3px", textAlign: "center", borderBottom: "1px solid #e5e7eb", fontSize: "9px" }}>
                        {tuvo && reg?.cantidad ? reg.cantidad.charAt(0).toUpperCase() + reg.cantidad.slice(1) : ""}
                      </td>
                      <td key={turno + "-bris"} style={{ padding: "5px 3px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>
                        {tuvo && bristolInfo ? `T${bristolInfo.tipo}` : ""}
                      </td>
                    </>
                  );
                })}

                <td style={{ padding: "5px 8px", textAlign: "center", borderLeft: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                  {diasSin >= 3 ? (
                    <span style={{ color: diasSin >= 6 ? "#dc2626" : diasSin >= 5 ? "#ea580c" : "#d97706" }}>
                      {diasSin}d ⚠
                    </span>
                  ) : diasSin > 0 ? `${diasSin}d` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Protocolo de actuación */}
      <div style={{ marginTop: "20px", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "12px" }}>
        <p style={{ fontWeight: "bold", marginBottom: "8px", color: "#4a1a6e", fontSize: "11px" }}>
          PROTOCOLO DE ACTUACIÓN — CONSTIPACIÓN
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f3f4f6" }}>
              <th style={{ padding: "4px 8px", textAlign: "left", border: "1px solid #e5e7eb" }}>Días sin deposición</th>
              <th style={{ padding: "4px 8px", textAlign: "left", border: "1px solid #e5e7eb" }}>Con PEG</th>
              <th style={{ padding: "4px 8px", textAlign: "left", border: "1px solid #e5e7eb" }}>Sin PEG</th>
            </tr>
          </thead>
          <tbody>
            {PROTOCOLO.map(p => (
              <tr key={p.dias}>
                <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb", fontWeight: "600" }}>{p.dias} días</td>
                <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb" }}>{p.accion_peg}</td>
                <td style={{ padding: "4px 8px", border: "1px solid #e5e7eb" }}>{p.accion_sin_peg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observaciones y firma */}
      <div style={{ marginTop: "16px", display: "flex", gap: "20px" }}>
        <div style={{ flex: 2, border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px", minHeight: "60px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "4px", color: "#4a1a6e" }}>Observaciones generales:</p>
          <div style={{ minHeight: "40px" }}></div>
        </div>
        <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px", minHeight: "60px", textAlign: "center" }}>
          <p style={{ fontWeight: "bold", marginBottom: "4px", color: "#4a1a6e" }}>Firma encargada:</p>
          <div style={{ borderBottom: "1px solid #999", marginTop: "30px" }}></div>
        </div>
      </div>

      {/* Pie de página */}
      <div style={{ marginTop: "12px", textAlign: "center", color: "#999", fontSize: "8px" }}>
        <p>Generado el {format(new Date(), "dd/MM/yyyy HH:mm")} — Providentia · Hogar Pequeño Cottolengo Quintero</p>
      </div>
    </div>
  );
}