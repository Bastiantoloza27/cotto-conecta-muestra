import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Datos extraídos del PDF Mayo 2026
// Formato: [nombre, {dia: turno, ...}]
// Los días son del 1 al 31 de Mayo 2026

const TURNOS_MAYO = [
  {
    nombre: "Jeniffer",
    // 29 abr=LIBRE, 30abr=LIBRE, luego días 1-31 mayo
    turnos: {
      "2026-05-01": "N", "2026-05-02": "N",
      "2026-05-03": "LIBRE", "2026-05-04": "LIBRE",
      "2026-05-05": "N", "2026-05-06": "N1",
      "2026-05-07": "LIBRE", "2026-05-08": "LIBRE",
      "2026-05-09": "N1", "2026-05-10": "N1",
      "2026-05-11": "LIBRE", "2026-05-12": "LIBRE",
      "2026-05-13": "N2", "2026-05-14": "N2",
      "2026-05-15": "LIBRE", "2026-05-16": "LIBRE",
      "2026-05-17": "N2", "2026-05-18": "N2",
      "2026-05-19": "LIBRE", "2026-05-20": "LIBRE",
      "2026-05-21": "N1", "2026-05-22": "N1",
      "2026-05-23": "LIBRE", "2026-05-24": "LIBRE",
      "2026-05-25": "N1", "2026-05-26": "N1",
      "2026-05-27": "LIBRE", "2026-05-28": "LIBRE",
      "2026-05-29": "N2", "2026-05-30": "N2",
      "2026-05-31": "LIBRE",
    }
  },
  {
    nombre: "Valeria",
    turnos: {
      "2026-05-01": "N", "2026-05-02": "N",
      "2026-05-03": "LIBRE", "2026-05-04": "LIBRE",
      "2026-05-05": "N", "2026-05-06": "N2",
      "2026-05-07": "LIBRE", "2026-05-08": "LIBRE",
      "2026-05-09": "N2", "2026-05-10": "N2",
      "2026-05-11": "LIBRE", "2026-05-12": "LIBRE",
      "2026-05-13": "N1", "2026-05-14": "N1",
      "2026-05-15": "LIBRE",
    }
  },
  {
    nombre: "Francisca A.",
    turnos: {
      "2026-05-15": "N1",
      "2026-05-16": "LIBRE",
      "2026-05-17": "N1", "2026-05-18": "N1",
      "2026-05-19": "LIBRE", "2026-05-20": "LIBRE",
      "2026-05-21": "N2", "2026-05-22": "N2",
      "2026-05-23": "LIBRE", "2026-05-24": "LIBRE",
      "2026-05-25": "N2", "2026-05-26": "N2",
      "2026-05-27": "LIBRE", "2026-05-28": "LIBRE",
      "2026-05-29": "N1", "2026-05-30": "N1",
      "2026-05-31": "LIBRE",
    }
  },
  {
    nombre: "Andrea",
    turnos: {
      "2026-05-01": "TL1", "2026-05-02": "TL1",
      "2026-05-03": "LIBRE", "2026-05-04": "LIBRE",
      "2026-05-05": "TL1", "2026-05-06": "TL1",
      "2026-05-07": "LIBRE", "2026-05-08": "LIBRE",
      "2026-05-09": "TL1", "2026-05-10": "TL1",
      "2026-05-11": "LIBRE", "2026-05-12": "LIBRE",
      "2026-05-13": "TL1", "2026-05-14": "TL1",
      "2026-05-15": "LIBRE", "2026-05-16": "LIBRE",
      "2026-05-17": "TL1", "2026-05-18": "TL1",
      "2026-05-19": "LIBRE", "2026-05-20": "LIBRE",
      "2026-05-21": "TL1", "2026-05-22": "TL1",
      "2026-05-23": "LIBRE", "2026-05-24": "LIBRE",
      "2026-05-25": "TL1", "2026-05-26": "TL1",
      "2026-05-27": "LIBRE", "2026-05-28": "LIBRE",
      "2026-05-29": "TL1", "2026-05-30": "TL1",
      "2026-05-31": "LIBRE",
    }
  },
  {
    nombre: "Nadia",
    turnos: {
      "2026-05-01": "TL", "2026-05-02": "TL",
      "2026-05-03": "LIBRE", "2026-05-04": "LIBRE",
      "2026-05-05": "TL2", "2026-05-06": "TL2",
      "2026-05-07": "LIBRE", "2026-05-08": "LIBRE",
      "2026-05-09": "TL2", "2026-05-10": "TL2",
      "2026-05-11": "LIBRE", "2026-05-12": "LIBRE",
      "2026-05-13": "TL2", "2026-05-14": "TL2",
      "2026-05-15": "LIBRE", "2026-05-16": "LIBRE",
      "2026-05-17": "TL2", "2026-05-18": "TL2",
      "2026-05-19": "LIBRE", "2026-05-20": "LIBRE",
      "2026-05-21": "TL2", "2026-05-22": "TL2",
      "2026-05-23": "LIBRE", "2026-05-24": "LIBRE",
      "2026-05-25": "TL2", "2026-05-26": "TL2",
      "2026-05-27": "LIBRE", "2026-05-28": "LIBRE",
      "2026-05-29": "TL2", "2026-05-30": "TL2",
      "2026-05-31": "LIBRE",
    }
  },
  {
    nombre: "Judith",
    turnos: {
      "2026-05-01": "TL1", "2026-05-02": "TL1",
      "2026-05-03": "LIBRE", "2026-05-04": "LIBRE",
      "2026-05-05": "TL1", "2026-05-06": "TL1",
      "2026-05-07": "LIBRE", "2026-05-08": "LIBRE",
      "2026-05-09": "TL1", "2026-05-10": "TL1",
      "2026-05-11": "LIBRE", "2026-05-12": "LIBRE",
      "2026-05-13": "TL1", "2026-05-14": "TL1",
      "2026-05-15": "LIBRE", "2026-05-16": "LIBRE",
      "2026-05-17": "TL1", "2026-05-18": "TL1",
      "2026-05-19": "LIBRE", "2026-05-20": "LIBRE",
      "2026-05-21": "TL1", "2026-05-22": "TL1",
      "2026-05-23": "LIBRE", "2026-05-24": "LIBRE",
      "2026-05-25": "TL1", "2026-05-26": "TL1",
      "2026-05-27": "LIBRE", "2026-05-28": "LIBRE",
      "2026-05-29": "TL1", "2026-05-30": "TL1",
      "2026-05-31": "TL1",
    }
  },
  {
    nombre: "Andrés",
    turnos: {
      "2026-05-01": "TL", "2026-05-02": "TL",
      "2026-05-03": "LIBRE", "2026-05-04": "LIBRE",
      "2026-05-05": "TL2", "2026-05-06": "TL2",
      "2026-05-07": "LIBRE", "2026-05-08": "LIBRE",
      "2026-05-09": "TL2", "2026-05-10": "TL2",
      "2026-05-11": "LIBRE", "2026-05-12": "LIBRE",
      "2026-05-13": "TL2", "2026-05-14": "TL2",
      "2026-05-15": "LIBRE", "2026-05-16": "LIBRE",
      "2026-05-17": "TL2", "2026-05-18": "TL2",
      "2026-05-19": "LIBRE", "2026-05-20": "LIBRE",
      "2026-05-21": "TL2", "2026-05-22": "TL2",
      "2026-05-23": "LIBRE", "2026-05-24": "LIBRE",
      "2026-05-25": "TL2", "2026-05-26": "TL2",
      "2026-05-27": "LIBRE", "2026-05-28": "LIBRE",
      "2026-05-29": "TL2", "2026-05-30": "TL2",
      "2026-05-31": "TL2",
    }
  },
  {
    nombre: "Monserrat",
    turnos: {
      "2026-05-01": "N", "2026-05-02": "N",
      "2026-05-03": "LIBRE", "2026-05-04": "LIBRE",
      "2026-05-05": "N", "2026-05-06": "N",
      "2026-05-07": "LIBRE", "2026-05-08": "LIBRE",
      "2026-05-09": "N1", "2026-05-10": "N1",
      "2026-05-11": "LIBRE", "2026-05-12": "LIBRE",
      "2026-05-13": "N1", "2026-05-14": "N1",
      "2026-05-15": "LIBRE", "2026-05-16": "LIBRE",
      "2026-05-17": "N2", "2026-05-18": "N2",
      "2026-05-19": "LIBRE", "2026-05-20": "LIBRE",
      "2026-05-21": "N2", "2026-05-22": "N2",
      "2026-05-23": "LIBRE", "2026-05-24": "LIBRE",
      "2026-05-25": "N1", "2026-05-26": "N1",
      "2026-05-27": "LIBRE", "2026-05-28": "LIBRE",
      "2026-05-29": "N1", "2026-05-30": "LIBRE",
      "2026-05-31": "N2",
    }
  },
  {
    nombre: "Marjorie",
    turnos: {
      "2026-05-01": "N", "2026-05-02": "N",
      "2026-05-03": "LIBRE", "2026-05-04": "LIBRE",
      "2026-05-05": "N", "2026-05-06": "N",
      "2026-05-07": "LIBRE", "2026-05-08": "LIBRE",
      "2026-05-09": "N", "2026-05-10": "N",
      "2026-05-11": "LIBRE", "2026-05-12": "LIBRE",
      "2026-05-13": "N2", "2026-05-14": "N2",
      "2026-05-15": "LIBRE", "2026-05-16": "LIBRE",
      "2026-05-17": "V", "2026-05-18": "V",
      "2026-05-19": "LIBRE", "2026-05-20": "LIBRE",
      "2026-05-21": "V", "2026-05-22": "V",
      "2026-05-23": "LIBRE", "2026-05-24": "LIBRE",
      "2026-05-25": "V", "2026-05-26": "V",
      "2026-05-27": "LIBRE", "2026-05-28": "LIBRE",
      "2026-05-29": "V", "2026-05-30": "V",
      "2026-05-31": "V",
    }
  },
];

const SHIFT_HORAS = {
  TL1: { hora_inicio: "08:30", hora_fin: "20:00" },
  TL2: { hora_inicio: "08:00", hora_fin: "19:30" },
  N1:  { hora_inicio: "20:00", hora_fin: "07:30" },
  N2:  { hora_inicio: "20:30", hora_fin: "20:30" },
  N:   { hora_inicio: "20:00", hora_fin: "07:30" },
  TL:  { hora_inicio: "08:00", hora_fin: "20:00" },
  V:   { hora_inicio: "", hora_fin: "" },
  LIBRE: { hora_inicio: "", hora_fin: "" },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Acceso restringido: solo administradores' }, { status: 403 });
  }

  // Obtener turnos ya existentes para Mayo 2026
  const existentes = await base44.asServiceRole.entities.StaffShift.filter({ grupo_turno: "cuidadoras" });
  const existentesSet = new Set(existentes.map(s => `${s.staff_name}|${s.date}`));

  let creados = 0;
  let omitidos = 0;
  let errores = 0;

  for (const persona of TURNOS_MAYO) {
    for (const [fecha, turno] of Object.entries(persona.turnos)) {
      const key = `${persona.nombre}|${fecha}`;
      if (existentesSet.has(key)) { omitidos++; continue; }
      try {
        const horas = SHIFT_HORAS[turno] || { hora_inicio: "", hora_fin: "" };
        await base44.asServiceRole.entities.StaffShift.create({
          staff_name: persona.nombre,
          date: fecha,
          shift_type: turno,
          grupo_turno: "cuidadoras",
          hora_inicio: horas.hora_inicio,
          hora_fin: horas.hora_fin,
          status: "programado",
        });
        creados++;
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        errores++;
        console.error(`Error ${persona.nombre} ${fecha}: ${e.message}`);
      }
    }
  }

  return Response.json({ creados, omitidos, errores, mensaje: `Se crearon ${creados} turnos nuevos. ${omitidos} ya existían.` });
});