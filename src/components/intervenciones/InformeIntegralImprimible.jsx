import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { PROFESIONES } from "./FormularioIntervencion";

const CATEGORY_LABELS = {
  alimentacion: "Alimentación", emocional: "Emocional", sueno: "Sueño",
  comportamiento: "Comportamiento", actividad: "Actividad", salud: "Salud",
  higiene: "Higiene", social: "Social", espiritual: "Espiritual",
  signos_vitales: "Signos vitales", procedimiento: "Procedimiento",
  medicacion: "Medicación", curacion: "Curación", examen_fisico: "Examen físico",
  glucemia: "Glucemia", sondaje: "Sondaje", oxigenoterapia: "Oxigenoterapia",
  otro: "Otro",
};

function Fila({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: "6px" }}>
      <span style={{ fontWeight: "bold", fontSize: "9px", color: "#4a1a6e", textTransform: "uppercase" }}>{label}: </span>
      <span style={{ fontSize: "10px", color: "#111" }}>{value}</span>
    </div>
  );
}

function SeccionTitulo({ children }) {
  return (
    <div style={{ background: "#4a1a6e", color: "#fff", padding: "5px 10px", borderRadius: "4px", marginBottom: "8px", marginTop: "16px" }}>
      <p style={{ margin: 0, fontWeight: "bold", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{children}</p>
    </div>
  );
}

export default function InformeIntegralImprimible({ resident, intervenciones = [], logs = [], medications = [], incidents = [], periodo, desde, hasta }) {
  const edad = resident?.date_of_birth
    ? Math.floor((Date.now() - new Date(resident.date_of_birth)) / 31557600000)
    : null;

  const medicosActivos = medications.filter(m => m.status === "activo");

  const fmtFecha = (str) => {
    try { return format(parseISO(str), "dd/MM/yyyy", { locale: es }); } catch { return str || "—"; }
  };

  const periodoLabel = periodo === "semana"
    ? `Semana del ${fmtFecha(desde)} al ${fmtFecha(hasta)}`
    : `Mes de ${desde ? format(parseISO(desde), "MMMM yyyy", { locale: es }) : ""}`;

  return (
    <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", color: "#111", padding: "28px", maxWidth: "780px", margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{ borderBottom: "3px solid #4a1a6e", paddingBottom: "12px", marginBottom: "16px" }}>
        <p style={{ fontSize: "8px", color: "#888", margin: "0 0 2px 0" }}>Hogar Pequeño Cottolengo Quintero — Documento Confidencial</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 2px 0", color: "#4a1a6e" }}>
              INFORME INTEGRAL DE RESIDENTE
            </h1>
            <p style={{ fontSize: "11px", margin: 0, color: "#555" }}>Para control médico y seguimiento clínico</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "9px", margin: 0 }}><strong>Generado:</strong> {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
            <p style={{ fontSize: "9px", margin: "2px 0 0 0", color: "#4a1a6e", fontWeight: "bold" }}>{periodoLabel}</p>
          </div>
        </div>
      </div>

      {/* Datos del residente */}
      <div style={{ border: "1.5px solid #4a1a6e", borderRadius: "6px", padding: "12px", marginBottom: "4px", background: "#faf8ff" }}>
        <p style={{ fontSize: "9px", color: "#4a1a6e", fontWeight: "bold", textTransform: "uppercase", marginBottom: "8px" }}>Datos del Residente</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 16px" }}>
          <Fila label="Nombre completo" value={resident?.full_name} />
          <Fila label="Nombre preferido" value={resident?.preferred_name} />
          <Fila label="Habitación" value={resident?.room} />
          <Fila label="Edad" value={edad ? `${edad} años` : null} />
          <Fila label="RUT" value={resident?.rut} />
          <Fila label="Dependencia" value={resident?.dependency_level?.replace("_", " ")} />
          <Fila label="Grupo sanguíneo" value={resident?.blood_type} />
          <Fila label="Peso" value={resident?.weight_kg ? `${resident.weight_kg} kg` : null} />
          <Fila label="Talla" value={resident?.height_cm ? `${resident.height_cm} cm` : null} />
        </div>
        {resident?.diagnoses && <Fila label="Diagnósticos principales" value={resident.diagnoses} />}
        {resident?.allergies && <Fila label="Alergias" value={resident.allergies} />}
        {resident?.family_contact_name && (
          <Fila label="Contacto familiar" value={`${resident.family_contact_name}${resident.family_contact_phone ? ` — ${resident.family_contact_phone}` : ""}`} />
        )}
      </div>

      {/* Medicación activa */}
      {medicosActivos.length > 0 && (
        <>
          <SeccionTitulo>💊 Medicación activa ({medicosActivos.length})</SeccionTitulo>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px", marginBottom: "4px" }}>
            <thead>
              <tr style={{ background: "#f3eeff" }}>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Medicamento</th>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Dosis</th>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Frecuencia</th>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Vía</th>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Médico</th>
              </tr>
            </thead>
            <tbody>
              {medicosActivos.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 === 0 ? "#fff" : "#faf8ff" }}>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee", fontWeight: "bold" }}>{m.name}</td>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee" }}>{m.dosage}</td>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee" }}>{m.frequency?.replace(/_/g, " ")}</td>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee" }}>{m.route}</td>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee" }}>{m.prescribing_doctor || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Intervenciones profesionales */}
      {intervenciones.length > 0 && (
        <>
          <SeccionTitulo>🩺 Intervenciones profesionales del período ({intervenciones.length})</SeccionTitulo>
          {intervenciones.map((inv) => {
            const prof = PROFESIONES.find(p => p.key === inv.profesion);
            return (
              <div key={inv.id} style={{ border: "1px solid #ddd", borderRadius: "5px", padding: "10px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div>
                    <span style={{ fontWeight: "bold", fontSize: "10px", color: "#4a1a6e" }}>
                      {prof?.icon} {prof?.label?.toUpperCase() || inv.profesion}
                    </span>
                    {inv.tipo_intervencion && (
                      <span style={{ fontSize: "9px", color: "#555", marginLeft: "8px" }}>— {inv.tipo_intervencion}</span>
                    )}
                  </div>
                  <span style={{ fontSize: "9px", color: "#666" }}>{fmtFecha(inv.fecha)} · {inv.profesional_nombre}</span>
                </div>
                {inv.evaluacion && <Fila label="Evaluación" value={inv.evaluacion} />}
                {inv.acciones && <Fila label="Acciones" value={inv.acciones} />}
                {inv.indicaciones && <Fila label="Indicaciones" value={inv.indicaciones} />}
                {inv.proxima_sesion && <Fila label="Próxima sesión" value={fmtFecha(inv.proxima_sesion)} />}
              </div>
            );
          })}
        </>
      )}

      {/* Bitácora del período */}
      {logs.length > 0 && (
        <>
          <SeccionTitulo>📋 Bitácora del período ({logs.length} registros)</SeccionTitulo>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9.5px" }}>
            <thead>
              <tr style={{ background: "#f3eeff" }}>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Fecha</th>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Turno</th>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Categoría</th>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Descripción</th>
                <th style={{ textAlign: "left", padding: "4px 6px", border: "1px solid #ddd" }}>Registrado por</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} style={{ background: i % 2 === 0 ? "#fff" : "#faf8ff" }}>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee", whiteSpace: "nowrap" }}>{log.date}</td>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee", whiteSpace: "nowrap", textTransform: "capitalize" }}>{log.shift || "—"}</td>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee", whiteSpace: "nowrap" }}>{CATEGORY_LABELS[log.category] || log.category}</td>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee" }}>{log.description}</td>
                  <td style={{ padding: "4px 6px", border: "1px solid #eee", whiteSpace: "nowrap" }}>{log.registered_by || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Incidentes */}
      {incidents.length > 0 && (
        <>
          <SeccionTitulo>⚠️ Incidentes del período ({incidents.length})</SeccionTitulo>
          {incidents.map((inc) => (
            <div key={inc.id} style={{ border: "1px solid #f5c2c2", borderRadius: "5px", padding: "8px 10px", marginBottom: "6px", background: "#fffafa" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: "bold", fontSize: "10px", textTransform: "capitalize", color: "#a00" }}>{inc.type?.replace(/_/g, " ")} — {inc.severity}</span>
                <span style={{ fontSize: "9px", color: "#666" }}>{inc.date} {inc.time && `· ${inc.time}`}</span>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: "10px" }}>{inc.description}</p>
              {inc.actions_taken && <p style={{ margin: "3px 0 0 0", fontSize: "9px", color: "#555" }}><strong>Acciones:</strong> {inc.actions_taken}</p>}
            </div>
          ))}
        </>
      )}

      {/* Observaciones para control médico */}
      <SeccionTitulo>📝 Observaciones para control médico</SeccionTitulo>
      <div style={{ border: "1px dashed #ccc", borderRadius: "5px", padding: "10px", minHeight: "60px", background: "#fafafa" }}>
        <p style={{ fontSize: "9px", color: "#aaa", margin: 0 }}>(Espacio para anotaciones del médico)</p>
      </div>

      {/* Firma */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "28px", gap: "40px" }}>
        {["Médico Tratante", "Encargada / Coordinadora"].map(rol => (
          <div key={rol} style={{ textAlign: "center", minWidth: "200px" }}>
            <div style={{ borderBottom: "1px solid #555", paddingBottom: "28px", marginBottom: "6px" }} />
            <p style={{ fontSize: "9px", color: "#666", margin: 0 }}>{rol}</p>
            <p style={{ fontSize: "8px", color: "#aaa", margin: "2px 0 0 0" }}>Hogar Pequeño Cottolengo Quintero</p>
          </div>
        ))}
      </div>

      {/* Pie */}
      <div style={{ marginTop: "16px", borderTop: "1px solid #ddd", paddingTop: "6px", textAlign: "center", color: "#bbb", fontSize: "8px" }}>
        <p style={{ margin: 0 }}>Providentia · Hogar Pequeño Cottolengo Quintero · Generado el {format(new Date(), "dd/MM/yyyy HH:mm")}</p>
        <p style={{ margin: "2px 0 0 0" }}>Documento confidencial — uso clínico exclusivo</p>
      </div>
    </div>
  );
}