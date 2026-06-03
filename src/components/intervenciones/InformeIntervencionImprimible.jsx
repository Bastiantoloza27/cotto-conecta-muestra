import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PROFESIONES } from "./FormularioIntervencion";

function Campo({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "10px" }}>
      <p style={{ fontWeight: "bold", fontSize: "10px", color: "#4a1a6e", textTransform: "uppercase", marginBottom: "2px" }}>{label}</p>
      <p style={{ fontSize: "11px", color: "#111", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{value}</p>
    </div>
  );
}

function SeccionClinicos({ profesion, datos }) {
  if (!datos || !profesion) return null;
  const pares = [];

  if (profesion === "nutricionista") {
    if (datos.peso) pares.push(["Peso", `${datos.peso} kg`]);
    if (datos.talla) pares.push(["Talla", `${datos.talla} cm`]);
    if (datos.peso && datos.talla) pares.push(["IMC", (datos.peso / Math.pow(datos.talla / 100, 2)).toFixed(1)]);
    if (datos.estado_nutricional) pares.push(["Estado nutricional", datos.estado_nutricional]);
    if (datos.tipo_dieta) pares.push(["Tipo de dieta", datos.tipo_dieta]);
    if (datos.apetito) pares.push(["Apetito", datos.apetito]);
    if (datos.suplementos) pares.push(["Suplementos", datos.suplementos]);
  } else if (profesion === "terapeuta_ocupacional") {
    if (datos.independencia_avd) pares.push(["Independencia AVD", datos.independencia_avd]);
    if (datos.estado_cognitivo) pares.push(["Estado cognitivo", datos.estado_cognitivo]);
    if (datos.barthel) pares.push(["Escala Barthel", datos.barthel]);
    if (datos.motivacion) pares.push(["Motivación", datos.motivacion]);
    if (datos.actividades) pares.push(["Actividades realizadas", datos.actividades]);
    if (datos.productos_apoyo) pares.push(["Productos de apoyo", datos.productos_apoyo]);
  } else if (profesion === "tens") {
    if (datos.pa) pares.push(["Presión Arterial", datos.pa]);
    if (datos.saturacion) pares.push(["Saturación O₂", `${datos.saturacion}%`]);
    if (datos.temperatura) pares.push(["Temperatura", `${datos.temperatura}°C`]);
    if (datos.fc) pares.push(["Frecuencia Cardíaca", `${datos.fc} lpm`]);
    if (datos.dolor_eva) pares.push(["Dolor (EVA)", `${datos.dolor_eva}/10`]);
    if (datos.estado_piel) pares.push(["Estado piel / heridas", datos.estado_piel]);
    if (datos.medicamentos) pares.push(["Medicamentos administrados", datos.medicamentos]);
  } else if (profesion === "kinesiologo") {
    if (datos.estado_respiratorio) pares.push(["Estado respiratorio", datos.estado_respiratorio]);
    if (datos.tono_muscular) pares.push(["Tono muscular", datos.tono_muscular]);
    if (datos.marcha) pares.push(["Marcha / desplazamiento", datos.marcha]);
    if (datos.dolor_eva) pares.push(["Dolor (EVA)", `${datos.dolor_eva}/10`]);
    if (datos.tecnicas) pares.push(["Técnicas aplicadas", datos.tecnicas]);
    if (datos.num_sesion) pares.push(["N° sesión", datos.num_sesion]);
    if (datos.respuesta) pares.push(["Respuesta al tratamiento", datos.respuesta]);
  } else if (profesion === "psicologo") {
    if (datos.estado_emocional) pares.push(["Estado emocional", datos.estado_emocional]);
    if (datos.estado_cognitivo) pares.push(["Estado cognitivo", datos.estado_cognitivo]);
    if (datos.orientacion) pares.push(["Orientación", datos.orientacion]);
    if (datos.conducta_sesion) pares.push(["Conducta en sesión", datos.conducta_sesion]);
    if (datos.test_cognitivo) pares.push(["Test aplicado", datos.test_cognitivo]);
    if (datos.tecnicas) pares.push(["Técnicas / abordaje", datos.tecnicas]);
  }

  if (pares.length === 0) return null;

  return (
    <div style={{ background: "#f8f7fc", border: "1px solid #e0d9f0", borderRadius: "6px", padding: "12px", marginBottom: "14px" }}>
      <p style={{ fontWeight: "bold", fontSize: "10px", color: "#4a1a6e", textTransform: "uppercase", marginBottom: "8px" }}>
        Datos clínicos específicos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
        {pares.map(([lbl, val]) => (
          <div key={lbl}>
            <span style={{ fontSize: "9px", color: "#666", fontWeight: "bold" }}>{lbl}: </span>
            <span style={{ fontSize: "10px" }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InformeIntervencionImprimible({ intervencion, resident }) {
  const prof = PROFESIONES.find(p => p.key === intervencion.profesion);
  const datosClinicos = (() => {
    try { return intervencion.datos_clinicos ? JSON.parse(intervencion.datos_clinicos) : {}; }
    catch { return {}; }
  })();

  const fechaLabel = intervencion.fecha
    ? format(parseISO(intervencion.fecha), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : "—";

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#111", padding: "28px", maxWidth: "760px", margin: "0 auto" }}>
      {/* Encabezado institucional */}
      <div style={{ borderBottom: "3px solid #4a1a6e", paddingBottom: "12px", marginBottom: "18px" }}>
        <p style={{ fontSize: "8px", color: "#777", margin: "0 0 2px 0" }}>Hogar Pequeño Cottolengo Quintero</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "17px", fontWeight: "bold", margin: "0 0 3px 0", color: "#4a1a6e" }}>
              INFORME DE INTERVENCIÓN PROFESIONAL
            </h1>
            <p style={{ fontSize: "12px", margin: 0 }}>
              {prof?.icon} {prof?.label?.toUpperCase() || intervencion.profesion?.toUpperCase()}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "10px", margin: 0 }}><strong>Fecha:</strong> {fechaLabel}</p>
            <p style={{ fontSize: "10px", margin: "2px 0 0 0" }}><strong>N° registro:</strong> {intervencion.id?.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Datos del residente y profesional */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "10px" }}>
          <p style={{ fontSize: "9px", color: "#666", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px" }}>Datos del Residente</p>
          <p style={{ margin: "2px 0" }}><strong>Nombre:</strong> {resident?.full_name || intervencion.resident_name}</p>
          {resident?.room && <p style={{ margin: "2px 0" }}><strong>Habitación:</strong> {resident.room}</p>}
          {resident?.date_of_birth && <p style={{ margin: "2px 0" }}><strong>Edad:</strong> {Math.floor((Date.now() - new Date(resident.date_of_birth)) / 31557600000)} años</p>}
          {resident?.diagnoses && <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#555" }}><strong>Diagnósticos:</strong> {resident.diagnoses}</p>}
        </div>
        <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "10px" }}>
          <p style={{ fontSize: "9px", color: "#666", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px" }}>Datos del Profesional</p>
          <p style={{ margin: "2px 0" }}><strong>Profesional:</strong> {intervencion.profesional_nombre}</p>
          <p style={{ margin: "2px 0" }}><strong>Área:</strong> {prof?.label}</p>
          <p style={{ margin: "2px 0" }}><strong>Tipo intervención:</strong> {intervencion.tipo_intervencion}</p>
          {intervencion.proxima_sesion && (
            <p style={{ margin: "4px 0 0 0" }}>
              <strong>Próxima sesión:</strong> {format(parseISO(intervencion.proxima_sesion), "dd/MM/yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* Datos clínicos específicos */}
      <SeccionClinicos profesion={intervencion.profesion} datos={datosClinicos} />

      {/* Contenido clínico */}
      <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "14px", marginBottom: "14px" }}>
        <Campo label="Evaluación / hallazgos" value={intervencion.evaluacion} />
        <Campo label="Objetivos de la intervención" value={intervencion.objetivos} />
        <Campo label="Acciones realizadas" value={intervencion.acciones} />
        <Campo label="Indicaciones / plan a seguir" value={intervencion.indicaciones} />
        {intervencion.observaciones && <Campo label="Observaciones adicionales" value={intervencion.observaciones} />}
      </div>

      {/* Firma */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
        <div style={{ textAlign: "center", minWidth: "220px" }}>
          <div style={{ borderBottom: "1px solid #555", marginBottom: "6px", paddingBottom: "24px" }}>
            {intervencion.firma && (
              <p style={{ fontSize: "11px", fontWeight: "bold" }}>{intervencion.firma}</p>
            )}
          </div>
          <p style={{ fontSize: "9px", color: "#666" }}>{prof?.label}</p>
          <p style={{ fontSize: "9px", color: "#666" }}>Hogar Pequeño Cottolengo Quintero</p>
        </div>
      </div>

      {/* Pie de página */}
      <div style={{ marginTop: "20px", borderTop: "1px solid #ddd", paddingTop: "8px", textAlign: "center", color: "#aaa", fontSize: "8px" }}>
        <p>Generado el {format(new Date(), "dd/MM/yyyy HH:mm")} · Providentia · Hogar Pequeño Cottolengo Quintero</p>
        <p>Este documento es confidencial y de uso clínico exclusivo.</p>
      </div>
    </div>
  );
}