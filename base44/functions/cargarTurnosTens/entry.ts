import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Turnos TENS Junio 2026
// Francisca, Fernanda, Ammy: 08:00 - 19:30 (día) todos los días
// Gabriel: 19:30 - 07:30 (noche) todos los días

const TENS_DIA = [
  { staff_name: "Francisca", shift_type: "TL2", hora_inicio: "08:00", hora_fin: "19:30" },
  { staff_name: "Fernanda",  shift_type: "TL2", hora_inicio: "08:00", hora_fin: "19:30" },
  { staff_name: "Ammy",      shift_type: "TL2", hora_inicio: "08:00", hora_fin: "19:30" },
];

const TENS_NOCHE = [
  { staff_name: "Gabriel",   shift_type: "N1",  hora_inicio: "19:30", hora_fin: "07:30" },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generar todos los días de junio 2026
    const dias = [];
    for (let d = 1; d <= 30; d++) {
      const dd = String(d).padStart(2, '0');
      dias.push(`2026-06-${dd}`);
    }

    // Verificar existentes para idempotencia
    const existentes = await base44.asServiceRole.entities.StaffShift.filter(
      { grupo_turno: "tens" }, "date", 500
    );
    const existentesSet = new Set(existentes.map(s => `${s.staff_name}__${s.date}`));

    let creados = 0;
    let omitidos = 0;
    const errores = [];

    for (const fecha of dias) {
      for (const tens of [...TENS_DIA, ...TENS_NOCHE]) {
        const key = `${tens.staff_name}__${fecha}`;
        if (existentesSet.has(key)) { omitidos++; continue; }
        try {
          await base44.asServiceRole.entities.StaffShift.create({
            staff_name: tens.staff_name,
            date: fecha,
            shift_type: tens.shift_type,
            hora_inicio: tens.hora_inicio,
            hora_fin: tens.hora_fin,
            grupo_turno: "tens",
            status: "programado",
          });
          creados++;
        } catch (e) {
          errores.push(`Error ${tens.staff_name} ${fecha}: ${e.message}`);
        }
      }
    }

    return Response.json({
      creados,
      omitidos,
      errores: errores.length,
      detalle_errores: errores,
      mensaje: `Se crearon ${creados} turnos nuevos de TENS Junio 2026. ${omitidos} ya existían.`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});