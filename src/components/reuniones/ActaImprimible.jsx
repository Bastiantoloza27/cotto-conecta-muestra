import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const TIPOS_LABEL = {
  equipo_completo: "Equipo Completo",
  salud: "Equipo de Salud",
  cuidado: "Equipo de Cuidado",
  administracion: "Administración",
  pastoral: "Pastoral",
  directiva: "Reunión Directiva",
  otra: "Otra",
};

function getNumero(id) {
  return id ? id.slice(-6).toUpperCase() : "000000";
}

function parseList(str) {
  try { return JSON.parse(str || "[]"); } catch { return []; }
}

export default function ActaImprimible({ acta, onClose }) {
  useEffect(() => {
    if (acta) setTimeout(() => window.print(), 350);
  }, [acta]);

  if (!acta) return null;

  const participantes = parseList(acta.participantes);
  const ordenDia = parseList(acta.orden_del_dia);
  const colsSignatura = Math.min(participantes.length || 1, 3);

  return (
    <>
      {/* Vista previa en pantalla */}
      <div
        className="fixed inset-0 bg-black/50 z-50 print:hidden flex items-start justify-center overflow-y-auto py-6"
        onClick={onClose}
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center px-5 py-3 border-b">
            <h3 className="font-semibold text-gray-700">Vista previa del Acta</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="p-6">
            <PrintBody acta={acta} participantes={participantes} ordenDia={ordenDia} colsSignatura={colsSignatura} />
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t">
            <button onClick={onClose} className="px-4 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Cerrar</button>
            <button onClick={() => window.print()} className="px-4 py-1.5 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800">
              🖨️ Imprimir Acta
            </button>
          </div>
        </div>
      </div>

      {/* Solo impresión */}
      <div className="hidden print:block">
        <PrintBody acta={acta} participantes={participantes} ordenDia={ordenDia} colsSignatura={colsSignatura} />
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          .print\\:block { display: block !important; }
          @page { margin: 2cm; size: A4; }
        }
      `}</style>
    </>
  );
}

function PrintBody({ acta, participantes, ordenDia, colsSignatura }) {
  const s = { fontFamily: "'Inter', sans-serif", color: "#1a1a2e" };

  return (
    <div style={s}>
      {/* Encabezado */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #6b21a8", paddingBottom: "14px", marginBottom: "18px" }}>
        <img
          src="https://media.base44.com/images/public/6a10daaa13888870642a70ef/2440d15f9_image.png"
          alt="Logo"
          style={{ width: "60px", height: "60px", objectFit: "contain", margin: "0 auto 8px" }}
        />
        <div style={{ fontSize: "15px", fontWeight: "700", color: "#6b21a8" }}>Pequeño Cottolengo Quintero</div>
        <div style={{ fontSize: "11px", color: "#666" }}>Hogar de Acogida Residencial · Quintero, Región de Valparaíso</div>
      </div>

      {/* Título */}
      <div style={{ textAlign: "center", marginBottom: "18px" }}>
        <div style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
          ACTA DE REUNIÓN N° {getNumero(acta.id)}
        </div>
        <div style={{ fontSize: "12px", color: "#555", marginTop: "3px" }}>
          {TIPOS_LABEL[acta.tipo] || acta.tipo}
        </div>
      </div>

      {/* Datos generales */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "14px" }}>
        <tbody>
          <tr>
            <Cell label="Fecha" value={format(new Date(acta.fecha + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: es })} />
            <Cell label="Lugar" value={acta.lugar || "—"} />
          </tr>
          <tr>
            <Cell label="Hora inicio" value={acta.hora_inicio || "—"} />
            <Cell label="Hora término" value={acta.hora_termino || "—"} />
          </tr>
          <tr>
            <Cell label="Convocante" value={acta.convocante || "—"} colSpan={2} />
          </tr>
        </tbody>
      </table>

      {/* Participantes */}
      {participantes.length > 0 && (
        <Section title="Participantes">
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", columns: participantes.length > 4 ? 2 : 1 }}>
            {participantes.map((p, i) => <li key={i} style={{ marginBottom: "2px" }}>{p}</li>)}
          </ul>
        </Section>
      )}

      {/* Orden del día */}
      {ordenDia.length > 0 && (
        <Section title="Orden del Día">
          <ol style={{ margin: 0, paddingLeft: "16px", fontSize: "12px" }}>
            {ordenDia.map((o, i) => <li key={i} style={{ marginBottom: "4px" }}>{o}</li>)}
          </ol>
        </Section>
      )}

      {/* Acuerdos */}
      {acta.acuerdos && (
        <Section title="Acuerdos y Compromisos">
          <p style={{ fontSize: "12px", whiteSpace: "pre-wrap", margin: 0 }}>{acta.acuerdos}</p>
        </Section>
      )}

      {/* Observaciones */}
      {acta.observaciones && (
        <Section title="Observaciones Generales">
          <p style={{ fontSize: "12px", whiteSpace: "pre-wrap", margin: 0 }}>{acta.observaciones}</p>
        </Section>
      )}

      {/* Próxima reunión */}
      {acta.proxima_reunion && (
        <p style={{ fontSize: "12px", marginTop: "10px", fontStyle: "italic", color: "#555" }}>
          📅 Próxima reunión sugerida: {format(new Date(acta.proxima_reunion + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      )}

      {/* Firmas */}
      <div style={{ marginTop: "40px" }}>
        <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "20px", borderBottom: "1px solid #ddd", paddingBottom: "4px" }}>
          FIRMAS DE LOS PARTICIPANTES
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${colsSignatura}, 1fr)`,
          gap: "24px 32px",
        }}>
          {(participantes.length > 0 ? participantes : ["", "", ""]).map((p, i) => (
            <div key={i} style={{ textAlign: "center", paddingTop: "36px" }}>
              <div style={{ borderTop: "1px dashed #888", marginBottom: "5px" }}></div>
              <div style={{ fontSize: "11px", fontWeight: "600" }}>{p || `Participante ${i + 1}`}</div>
            </div>
          ))}
        </div>

        {/* Firma convocante */}
        {acta.convocante && (
          <div style={{ marginTop: "36px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ textAlign: "center", width: "220px" }}>
              <div style={{ borderTop: "1px dashed #666", marginBottom: "5px" }}></div>
              <div style={{ fontSize: "11px", fontWeight: "600" }}>{acta.convocante}</div>
              <div style={{ fontSize: "10px", color: "#888" }}>Convocante / Quien dirige</div>
            </div>
          </div>
        )}
      </div>

      {/* Pie */}
      <div style={{ marginTop: "30px", borderTop: "1px solid #ddd", paddingTop: "8px", textAlign: "center", fontSize: "10px", color: "#999" }}>
        Pequeño Cottolengo Quintero · Providentia Sistema de Gestión · {format(new Date(), "yyyy")}
      </div>
    </div>
  );
}

function Cell({ label, value, colSpan = 1 }) {
  const style = { padding: "5px 8px", border: "1px solid #e2e8f0", fontSize: "12px" };
  return (
    <>
      <td style={{ ...style, fontWeight: "600", backgroundColor: "#f5f3ff", width: "25%" }}>{label}</td>
      <td style={{ ...style }} colSpan={colSpan === 2 ? 3 : 1}>{value}</td>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b21a8", borderBottom: "1px solid #e9d5ff", paddingBottom: "3px", marginBottom: "6px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}