import { useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIAS = {
  insumos: "Insumos", traslado: "Traslado", alimentacion: "Alimentación",
  mantenimiento: "Mantenimiento", capacitacion: "Capacitación", otros: "Otros",
};

function formatMonto(n) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(n);
}

function getNumero(id) {
  return id ? id.slice(-6).toUpperCase() : "000000";
}

export default function DocumentoImprimible({ solicitud, onClose }) {
  useEffect(() => {
    if (solicitud) {
      setTimeout(() => window.print(), 300);
    }
  }, [solicitud]);

  if (!solicitud) return null;

  return (
    <>
      {/* Overlay visible solo en pantalla */}
      <div className="fixed inset-0 bg-black/50 z-50 print:hidden flex items-center justify-center" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl p-4 max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Vista previa del documento</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕ Cerrar</button>
          </div>
          <div id="print-area" className="border rounded-lg p-6 bg-white text-gray-900 font-sans text-sm">
            <PrintContent solicitud={solicitud} />
          </div>
          <div className="flex justify-end mt-3 gap-2">
            <button onClick={onClose} className="px-4 py-1.5 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Cerrar</button>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 text-sm bg-purple-700 text-white rounded-lg hover:bg-purple-800"
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Contenido solo para impresión */}
      <div className="hidden print:block">
        <PrintContent solicitud={solicitud} />
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

function PrintContent({ solicitud }) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a2e", maxWidth: "700px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #6b21a8", paddingBottom: "16px", marginBottom: "20px" }}>
        <img
          src="https://media.base44.com/images/public/6a10daaa13888870642a70ef/2440d15f9_image.png"
          alt="Logo"
          style={{ width: "64px", height: "64px", objectFit: "contain", margin: "0 auto 8px" }}
        />
        <div style={{ fontSize: "16px", fontWeight: "700", color: "#6b21a8" }}>Pequeño Cottolengo Quintero</div>
        <div style={{ fontSize: "12px", color: "#666" }}>Hogar de Acogida Residencial · Quintero, Región de Valparaíso</div>
      </div>

      {/* Título */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "15px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
          Solicitud de Gasto N° {getNumero(solicitud.id)}
        </div>
        <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
          Fecha de emisión: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}
        </div>
      </div>

      {/* Datos */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "13px" }}>
        <tbody>
          {[
            ["Solicitante", solicitud.solicitante_nombre],
            ["Correo electrónico", solicitud.solicitante_email || "—"],
            ["Fecha de solicitud", format(new Date(solicitud.fecha_solicitud + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: es })],
            ["Motivo del gasto", solicitud.motivo],
            ["Categoría", CATEGORIAS[solicitud.categoria] || solicitud.categoria],
            ["Detalle adicional", solicitud.detalle || "—"],
            ["Monto solicitado", formatMonto(solicitud.monto)],
          ].map(([label, value]) => (
            <tr key={label}>
              <td style={{ padding: "6px 10px", fontWeight: "600", width: "40%", backgroundColor: "#f5f3ff", border: "1px solid #e2e8f0" }}>{label}</td>
              <td style={{ padding: "6px 10px", border: "1px solid #e2e8f0" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Resolución */}
      <div style={{ border: "2px solid " + (solicitud.estado === "aprobada" ? "#16a34a" : "#dc2626"), borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", backgroundColor: solicitud.estado === "aprobada" ? "#f0fdf4" : "#fef2f2" }}>
        <div style={{ fontWeight: "700", fontSize: "14px", color: solicitud.estado === "aprobada" ? "#15803d" : "#b91c1c", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
          Resolución del Director: {solicitud.estado === "aprobada" ? "✓ APROBADA" : "✗ RECHAZADA"}
        </div>
        {solicitud.motivo_rechazo && (
          <div style={{ fontSize: "13px", marginBottom: "4px" }}><strong>Motivo de rechazo:</strong> {solicitud.motivo_rechazo}</div>
        )}
        {solicitud.fecha_resolucion && (
          <div style={{ fontSize: "12px", color: "#555" }}>
            Fecha y hora: {format(new Date(solicitud.fecha_resolucion), "dd/MM/yyyy 'a las' HH:mm")}
          </div>
        )}
        {solicitud.director_nombre && (
          <div style={{ fontSize: "12px", color: "#555" }}>Director/a: {solicitud.director_nombre}</div>
        )}
      </div>

      {/* Firma */}
      <div style={{ marginTop: "40px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ textAlign: "center", width: "200px" }}>
          <div style={{ borderTop: "1px dashed #666", marginBottom: "6px" }}></div>
          <div style={{ fontSize: "12px", fontWeight: "600" }}>Firma del/la Director/a</div>
          <div style={{ fontSize: "11px", color: "#888" }}>Pequeño Cottolengo Quintero</div>
        </div>
      </div>
    </div>
  );
}