import { format } from "date-fns";
import { es } from "date-fns/locale";

const TIPO_LABELS = {
  control_rutina: "Control de Rutina",
  urgencia: "Urgencia",
  seguimiento: "Seguimiento",
  evaluacion_inicial: "Evaluación Inicial",
  alta_medica: "Alta Médica",
  otro: "Otro",
};

function getNumero(id) {
  return id ? id.slice(-6).toUpperCase() : "000000";
}

export default function InformeImprimible({ informe, onClose }) {
  if (!informe) return null;

  return (
    <>
      {/* Vista previa en pantalla */}
      <div
        className="fixed inset-0 bg-black/50 z-50 print:hidden flex items-start justify-center overflow-y-auto py-6"
        onClick={onClose}
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center px-5 py-3 border-b">
            <h3 className="font-semibold text-gray-700">Vista previa del Informe Médico</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="p-6">
            <PrintBody informe={informe} />
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t">
            <button onClick={onClose} className="px-4 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Cerrar</button>
            <button onClick={() => window.print()} className="px-4 py-1.5 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800">
              🖨️ Imprimir / Descargar
            </button>
          </div>
        </div>
      </div>

      {/* Solo impresión */}
      <div id="informe-print-content" className="hidden print:block">
        <PrintBody informe={informe} />
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #informe-print-content, #informe-print-content * { visibility: visible !important; }
          #informe-print-content { position: fixed !important; top: 0; left: 0; width: 100%; }
          @page { margin: 2cm; size: A4; }
        }
      `}</style>
    </>
  );
}

function PrintBody({ informe }) {
  const s = { fontFamily: "'Inter', sans-serif", color: "#1a1a2e" };
  const fecha = format(new Date(informe.fecha_visita + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: es });

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
          INFORME MÉDICO N° {getNumero(informe.id)}
        </div>
        <div style={{ fontSize: "12px", color: "#555", marginTop: "3px" }}>
          {TIPO_LABELS[informe.tipo_intervencion] || "Otro"}
        </div>
      </div>

      {/* Datos generales */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "14px" }}>
        <tbody>
          <tr>
            <Cell label="Fecha de visita" value={fecha} />
            <Cell label="Médico" value={informe.medico_nombre || "—"} />
          </tr>
          {informe.residente_nombres && (
            <tr>
              <Cell label="Residentes atendidos" value={informe.residente_nombres} colSpan={2} />
            </tr>
          )}
        </tbody>
      </table>

      {/* Descripción */}
      <Section title="Descripción de la Intervención">
        <p style={{ fontSize: "12px", whiteSpace: "pre-wrap", margin: 0 }}>{informe.descripcion_intervencion}</p>
      </Section>

      {/* Cambios medicación */}
      {informe.cambios_medicacion && (
        <Section title="💊 Cambios en Medicación">
          <p style={{ fontSize: "12px", whiteSpace: "pre-wrap", margin: 0, backgroundColor: "#fffbeb", padding: "8px", borderRadius: "4px", border: "1px solid #fde68a" }}>
            {informe.cambios_medicacion}
          </p>
        </Section>
      )}

      {/* Observaciones */}
      {informe.observaciones && (
        <Section title="Observaciones Generales">
          <p style={{ fontSize: "12px", whiteSpace: "pre-wrap", margin: 0 }}>{informe.observaciones}</p>
        </Section>
      )}

      {/* Firma */}
      <div style={{ marginTop: "50px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", width: "240px" }}>
          <div style={{ borderTop: "1px dashed #666", marginBottom: "5px" }}></div>
          <div style={{ fontSize: "11px", fontWeight: "600" }}>{informe.firma_medico || informe.medico_nombre}</div>
          <div style={{ fontSize: "10px", color: "#888" }}>Médico tratante</div>
        </div>
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