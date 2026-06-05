import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const COMIDAS = ["desayuno", "almuerzo", "once", "cena"];
const COMIDAS_LABEL = { desayuno: "Desayuno 🌅", almuerzo: "Almuerzo ☀️", once: "Once 🍵", cena: "Cena 🌙" };

const PORCION_LABEL = {
  "0": "Nada",
  "1/4": "¼ plato",
  "1/2": "½ plato",
  "3/4": "¾ plato",
  "completo": "Completo",
};

const PORCION_COLOR = {
  "0": "#ef4444",
  "1/4": "#f97316",
  "1/2": "#eab308",
  "3/4": "#22c55e",
  "completo": "#16a34a",
};

export default function InformeIngestaImprimible({ residents, registros, date }) {
  const getRegistro = (residentId, comida) =>
    registros.find(r => r.resident_id === residentId && r.date === date && r.tipo_comida === comida);

  const alertas = residents.filter(r => {
    const regs = COMIDAS.map(c => getRegistro(r.id, c)).filter(Boolean);
    if (regs.length < 2) return false;
    const bajas = regs.filter(reg => reg.porcion_consumida === "0" || reg.porcion_consumida === "1/4");
    return bajas.length >= 2;
  });

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "24px", maxWidth: "900px", margin: "0 auto", color: "#1e293b" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", borderBottom: "3px solid #7c3aed", paddingBottom: "12px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#7c3aed", margin: 0 }}>
            🍽️ Informe Control de Ingesta
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
            Pequeño Cottolengo Don Orione — {format(parseISO(date), "EEEE dd 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "11px", color: "#94a3b8" }}>
          <p>Generado: {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
          <p>Total residentes: {residents.length}</p>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fb923c", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px" }}>
          <p style={{ fontWeight: "bold", color: "#c2410c", fontSize: "12px", margin: "0 0 4px" }}>
            ⚠️ Residentes con ingesta baja:
          </p>
          <p style={{ fontSize: "12px", color: "#9a3412", margin: 0 }}>
            {alertas.map(r => r.preferred_name || r.full_name).join(", ")}
          </p>
        </div>
      )}

      {/* Tabla */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
        <thead>
          <tr style={{ background: "#7c3aed", color: "white" }}>
            <th style={{ padding: "8px 10px", textAlign: "left", borderRadius: "4px 0 0 4px" }}>Residente</th>
            {COMIDAS.map(c => (
              <th key={c} style={{ padding: "8px 10px", textAlign: "center" }}>{COMIDAS_LABEL[c]}</th>
            ))}
            <th style={{ padding: "8px 10px", textAlign: "center", borderRadius: "0 4px 4px 0" }}>Hidrat.</th>
          </tr>
        </thead>
        <tbody>
          {residents.map((resident, i) => {
            const regs = COMIDAS.map(c => getRegistro(resident.id, c));
            const ingesta_baja = regs.filter(Boolean).filter(r => r.porcion_consumida === "0" || r.porcion_consumida === "1/4").length >= 2;

            return (
              <tr key={resident.id} style={{ background: i % 2 === 0 ? "#f8fafc" : "white", borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: "8px 10px", fontWeight: "600" }}>
                  {resident.preferred_name || resident.full_name}
                  {resident.room && <span style={{ fontWeight: "normal", color: "#94a3b8", fontSize: "10px" }}> — Hab. {resident.room}</span>}
                  {ingesta_baja && <span style={{ display: "block", color: "#f97316", fontSize: "10px", fontWeight: "normal" }}>⚠️ Ingesta baja</span>}
                </td>
                {COMIDAS.map(c => {
                  const reg = getRegistro(resident.id, c);
                  const porcion = reg?.porcion_consumida;
                  return (
                    <td key={c} style={{ padding: "8px 10px", textAlign: "center" }}>
                      {porcion ? (
                        <div>
                          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold", background: PORCION_COLOR[porcion] + "22", color: PORCION_COLOR[porcion], border: `1px solid ${PORCION_COLOR[porcion]}` }}>
                            {PORCION_LABEL[porcion]}
                          </span>
                          {reg.gramos_consumidos && <p style={{ fontSize: "9px", color: "#94a3b8", margin: "2px 0 0" }}>{reg.gramos_consumidos}g</p>}
                          {reg.observaciones && <p style={{ fontSize: "9px", color: "#64748b", fontStyle: "italic", margin: "2px 0 0" }}>{reg.observaciones}</p>}
                        </div>
                      ) : (
                        <span style={{ color: "#cbd5e1", fontSize: "10px" }}>—</span>
                      )}
                    </td>
                  );
                })}
                <td style={{ padding: "8px 10px", textAlign: "center", fontSize: "11px" }}>
                  {(() => {
                    const h = regs.filter(Boolean).map(r => r.hidratacion).filter(Boolean);
                    if (!h.length) return <span style={{ color: "#cbd5e1" }}>—</span>;
                    const ultimo = h[h.length - 1];
                    const icons = { ninguna: "🚫", poca: "💧", adecuada: "💦", buena: "🌊" };
                    return <span>{icons[ultimo] || ""} {ultimo}</span>;
                  })()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pie de página */}
      <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8" }}>
        <span>Pequeño Cottolengo Don Orione — Control de Ingesta {format(parseISO(date), "dd/MM/yyyy")}</span>
        <span>Firma encargada: ________________________</span>
      </div>
    </div>
  );
}