import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Datos extraídos del PDF Junio 2026
// La tabla empieza el 27-May (Mie) pero solo cargamos días de Junio: 01 al 30
// Columnas del PDF: 27,28,29,30,31(mayo) | 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30(junio)

const TURNOS_JUNIO = [
  {
    nombre: "Jeniffer",
    // Col: 27may=LIBRE,28may=LIBRE,29may=N2,30may=N2,31may=LIBRE | jun: L,N1,N1,LIBRE,LIBRE,N1,N1,LIBRE,LIBRE,N2,N2,LIBRE,LIBRE,N2,N2,LIBRE,LIBRE,N1,N1,LIBRE,LIBRE,N1,N1,LIBRE,LIBRE,N2,N2,LIBRE,LIBRE,N2
    turnos: {
      "2026-06-01": "LIBRE", "2026-06-02": "N1", "2026-06-03": "N1",
      "2026-06-04": "LIBRE", "2026-06-05": "LIBRE",
      "2026-06-06": "N1", "2026-06-07": "N1",
      "2026-06-08": "LIBRE", "2026-06-09": "LIBRE",
      "2026-06-10": "N2", "2026-06-11": "N2",
      "2026-06-12": "LIBRE", "2026-06-13": "LIBRE",
      "2026-06-14": "N2", "2026-06-15": "N2",
      "2026-06-16": "LIBRE", "2026-06-17": "LIBRE",
      "2026-06-18": "N1", "2026-06-19": "N1",
      "2026-06-20": "LIBRE", "2026-06-21": "LIBRE",
      "2026-06-22": "N1", "2026-06-23": "N1",
      "2026-06-24": "LIBRE", "2026-06-25": "LIBRE",
      "2026-06-26": "N2", "2026-06-27": "N2",
      "2026-06-28": "LIBRE", "2026-06-29": "LIBRE",
      "2026-06-30": "N2",
    }
  },
  {
    nombre: "Francisca A.",
    turnos: {
      "2026-06-01": "LIBRE", "2026-06-02": "N2", "2026-06-03": "N2",
      "2026-06-04": "LIBRE", "2026-06-05": "LIBRE",
      "2026-06-06": "N2", "2026-06-07": "N2",
      "2026-06-08": "LIBRE", "2026-06-09": "LIBRE",
      "2026-06-10": "N1", "2026-06-11": "N1",
      "2026-06-12": "LIBRE", "2026-06-13": "LIBRE",
      "2026-06-14": "N1", "2026-06-15": "N1",
      "2026-06-16": "LIBRE", "2026-06-17": "LIBRE",
      "2026-06-18": "N2", "2026-06-19": "N2",
      "2026-06-20": "LIBRE", "2026-06-21": "LIBRE",
      "2026-06-22": "N2", "2026-06-23": "N2",
      "2026-06-24": "LIBRE", "2026-06-25": "LIBRE",
      "2026-06-26": "N1", "2026-06-27": "N1",
      "2026-06-28": "LIBRE", "2026-06-29": "LIBRE",
      "2026-06-30": "N2",
    }
  },
  {
    nombre: "Andrea",
    turnos: {
      "2026-06-01": "LIBRE", "2026-06-02": "TL1", "2026-06-03": "TL1",
      "2026-06-04": "LIBRE", "2026-06-05": "LIBRE",
      "2026-06-06": "TL1", "2026-06-07": "TL1",
      "2026-06-08": "LIBRE", "2026-06-09": "LIBRE",
      "2026-06-10": "TL1", "2026-06-11": "TL1",
      "2026-06-12": "LIBRE", "2026-06-13": "LIBRE",
      "2026-06-14": "TL1", "2026-06-15": "TL1",
      "2026-06-16": "LIBRE", "2026-06-17": "LIBRE",
      "2026-06-18": "TL1", "2026-06-19": "TL1",
      "2026-06-20": "LIBRE", "2026-06-21": "LIBRE",
      "2026-06-22": "TL1", "2026-06-23": "TL1",
      "2026-06-24": "LIBRE", "2026-06-25": "LIBRE",
      "2026-06-26": "TL1", "2026-06-27": "TL1",
      "2026-06-28": "LIBRE", "2026-06-29": "LIBRE",
      "2026-06-30": "TL1",
    }
  },
  {
    nombre: "Nadia",
    turnos: {
      "2026-06-01": "LIBRE", "2026-06-02": "TL2", "2026-06-03": "TL2",
      "2026-06-04": "LIBRE", "2026-06-05": "LIBRE",
      "2026-06-06": "TL2", "2026-06-07": "TL2",
      "2026-06-08": "LIBRE", "2026-06-09": "LIBRE",
      "2026-06-10": "TL2", "2026-06-11": "TL2",
      "2026-06-12": "LIBRE", "2026-06-13": "LIBRE",
      "2026-06-14": "TL2", "2026-06-15": "TL2",
      "2026-06-16": "LIBRE", "2026-06-17": "LIBRE",
      "2026-06-18": "TL2", "2026-06-19": "TL2",
      "2026-06-20": "LIBRE", "2026-06-21": "LIBRE",
      "2026-06-22": "TL2", "2026-06-23": "TL2",
      "2026-06-24": "LIBRE", "2026-06-25": "LIBRE",
      "2026-06-26": "TL2", "2026-06-27": "TL2",
      "2026-06-28": "LIBRE", "2026-06-29": "LIBRE",
      "2026-06-30": "TL2",
    }
  },
  {
    nombre: "Reemplazo",
    turnos: {
      "2026-06-01": "LIBRE", "2026-06-02": "TL2", "2026-06-03": "TL2",
      "2026-06-04": "LIBRE", "2026-06-05": "LIBRE",
      "2026-06-06": "TL2", "2026-06-07": "TL2",
      "2026-06-08": "LIBRE", "2026-06-09": "LIBRE",
      "2026-06-10": "TL2", "2026-06-11": "TL2",
      "2026-06-12": "LIBRE", "2026-06-13": "LIBRE",
      "2026-06-14": "TL2", "2026-06-15": "TL2",
      "2026-06-16": "LIBRE", "2026-06-17": "LIBRE",
      "2026-06-18": "TL2", "2026-06-19": "TL2",
      "2026-06-20": "LIBRE", "2026-06-21": "LIBRE",
      "2026-06-22": "TL2", "2026-06-23": "TL2",
      "2026-06-24": "LIBRE", "2026-06-25": "LIBRE",
      "2026-06-26": "TL2", "2026-06-27": "TL2",
      "2026-06-28": "LIBRE", "2026-06-29": "LIBRE",
      "2026-06-30": "TL2",
    }
  },
  {
    nombre: "Judith",
    // Judith empieza con TL1,TL1 desde el 27may | jun: LIBRE,TL1,TL1,LIBRE,LIBRE,TL1,...
    turnos: {
      "2026-06-01": "TL1", "2026-06-02": "TL1",
      "2026-06-03": "LIBRE", "2026-06-04": "LIBRE",
      "2026-06-05": "TL1", "2026-06-06": "TL1",
      "2026-06-07": "LIBRE", "2026-06-08": "LIBRE",
      "2026-06-09": "TL1", "2026-06-10": "TL1",
      "2026-06-11": "LIBRE", "2026-06-12": "LIBRE",
      "2026-06-13": "TL1", "2026-06-14": "TL1",
      "2026-06-15": "LIBRE", "2026-06-16": "LIBRE",
      "2026-06-17": "TL1", "2026-06-18": "TL1",
      "2026-06-19": "LIBRE", "2026-06-20": "LIBRE",
      "2026-06-21": "TL1", "2026-06-22": "TL1",
      "2026-06-23": "LIBRE", "2026-06-24": "LIBRE",
      "2026-06-25": "TL1", "2026-06-26": "TL1",
      "2026-06-27": "LIBRE", "2026-06-28": "LIBRE",
      "2026-06-29": "TL1", "2026-06-30": "LIBRE",
    }
  },
  {
    nombre: "Andrés",
    turnos: {
      "2026-06-01": "TL2", "2026-06-02": "TL2",
      "2026-06-03": "LIBRE", "2026-06-04": "LIBRE",
      "2026-06-05": "TL2", "2026-06-06": "TL2",
      "2026-06-07": "LIBRE", "2026-06-08": "LIBRE",
      "2026-06-09": "TL2", "2026-06-10": "TL2",
      "2026-06-11": "LIBRE", "2026-06-12": "LIBRE",
      "2026-06-13": "TL2", "2026-06-14": "TL2",
      "2026-06-15": "LIBRE", "2026-06-16": "LIBRE",
      "2026-06-17": "TL2", "2026-06-18": "TL2",
      "2026-06-19": "LIBRE", "2026-06-20": "LIBRE",
      "2026-06-21": "TL2", "2026-06-22": "TL2",
      "2026-06-23": "LIBRE", "2026-06-24": "LIBRE",
      "2026-06-25": "TL2", "2026-06-26": "TL2",
      "2026-06-27": "LIBRE", "2026-06-28": "LIBRE",
      "2026-06-29": "TL2", "2026-06-30": "LIBRE",
    }
  },
  {
    nombre: "Cristina",
    turnos: {
      "2026-06-01": "TL2", "2026-06-02": "TL2",
      "2026-06-03": "LIBRE", "2026-06-04": "LIBRE",
      "2026-06-05": "TL2", "2026-06-06": "TL2",
      "2026-06-07": "LIBRE", "2026-06-08": "LIBRE",
      "2026-06-09": "TL2", "2026-06-10": "TL2",
      "2026-06-11": "LIBRE", "2026-06-12": "LIBRE",
      "2026-06-13": "TL2", "2026-06-14": "TL2",
      "2026-06-15": "LIBRE", "2026-06-16": "LIBRE",
      "2026-06-17": "TL2", "2026-06-18": "TL2",
      "2026-06-19": "LIBRE", "2026-06-20": "LIBRE",
      "2026-06-21": "TL2", "2026-06-22": "TL2",
      "2026-06-23": "LIBRE", "2026-06-24": "LIBRE",
      "2026-06-25": "TL2", "2026-06-26": "TL2",
      "2026-06-27": "LIBRE", "2026-06-28": "LIBRE",
      "2026-06-29": "TL2", "2026-06-30": "LIBRE",
    }
  },
  {
    nombre: "Monserrat",
    // N1,N1 desde 27may | jun: LIBRE,N2,N2,LIBRE,LIBRE,N2,N2,...
    turnos: {
      "2026-06-01": "LIBRE", "2026-06-02": "N2", "2026-06-03": "N2",
      "2026-06-04": "LIBRE", "2026-06-05": "LIBRE",
      "2026-06-06": "N2", "2026-06-07": "N2",
      "2026-06-08": "LIBRE", "2026-06-09": "LIBRE",
      "2026-06-10": "N1", "2026-06-11": "N1",
      "2026-06-12": "LIBRE", "2026-06-13": "LIBRE",
      "2026-06-14": "N1", "2026-06-15": "N1",
      "2026-06-16": "LIBRE", "2026-06-17": "LIBRE",
      "2026-06-18": "N2", "2026-06-19": "N2",
      "2026-06-20": "LIBRE", "2026-06-21": "LIBRE",
      "2026-06-22": "N2", "2026-06-23": "N2",
      "2026-06-24": "LIBRE", "2026-06-25": "LIBRE",
      "2026-06-26": "N2", "2026-06-27": "N2",
      "2026-06-28": "LIBRE", "2026-06-29": "LIBRE",
      "2026-06-30": "N1",
    }
  },
  {
    nombre: "Valeria",
    // N2,N2 desde 27may | jun: LIBRE,N1,N1,LIBRE,LIBRE,N1,N1,...
    turnos: {
      "2026-06-01": "LIBRE", "2026-06-02": "N1", "2026-06-03": "N1",
      "2026-06-04": "LIBRE", "2026-06-05": "LIBRE",
      "2026-06-06": "N1", "2026-06-07": "N1",
      "2026-06-08": "LIBRE", "2026-06-09": "LIBRE",
      "2026-06-10": "N2", "2026-06-11": "N2",
      "2026-06-12": "LIBRE", "2026-06-13": "LIBRE",
      "2026-06-14": "N2", "2026-06-15": "N2",
      "2026-06-16": "LIBRE", "2026-06-17": "LIBRE",
      "2026-06-18": "N1", "2026-06-19": "N1",
      "2026-06-20": "LIBRE", "2026-06-21": "LIBRE",
      "2026-06-22": "N1", "2026-06-23": "N1",
      "2026-06-24": "LIBRE", "2026-06-25": "LIBRE",
      "2026-06-26": "N1", "2026-06-27": "N1",
      "2026-06-28": "LIBRE", "2026-06-29": "LIBRE",
      "2026-06-30": "N2",
    }
  },
];

const SHIFT_HORAS = {
  TL1:   { hora_inicio: "08:30", hora_fin: "20:00" },
  TL2:   { hora_inicio: "08:00", hora_fin: "19:30" },
  N1:    { hora_inicio: "20:00", hora_fin: "07:30" },
  N2:    { hora_inicio: "20:30", hora_fin: "08:00" },
  N:     { hora_inicio: "20:00", hora_fin: "07:30" },
  TL:    { hora_inicio: "08:00", hora_fin: "20:00" },
  V:     { hora_inicio: "", hora_fin: "" },
  LIBRE: { hora_inicio: "", hora_fin: "" },
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Acceso restringido: solo administradores' }, { status: 403 });
  }

  // Obtener turnos ya existentes de cuidadoras para no duplicar
  const existentes = await base44.asServiceRole.entities.StaffShift.filter({ grupo_turno: "cuidadoras" });
  const existentesSet = new Set(existentes.map(s => `${s.staff_name}|${s.date}`));

  let creados = 0;
  let omitidos = 0;
  let errores = 0;

  for (const persona of TURNOS_JUNIO) {
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

  return Response.json({ creados, omitidos, errores, mensaje: `Se crearon ${creados} turnos nuevos de Junio 2026. ${omitidos} ya existían.` });
});