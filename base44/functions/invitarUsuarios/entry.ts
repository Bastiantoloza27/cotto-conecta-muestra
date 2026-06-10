import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const USUARIOS = [
  { email: "andrea.ulloa.saavedra@gmail.com", role: "user" },
  { email: "versepulra8798@gmail.com", role: "user" },
  { email: "erichrosasalvarez@gmail.com", role: "user" },
  { email: "benjaminignaciomunozoyarzo@gmail.com", role: "user" },
];

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  if (user?.role !== 'admin') {
    return Response.json({ error: 'Acceso restringido: solo administradores' }, { status: 403 });
  }

  const resultados = [];

  for (const u of USUARIOS) {
    try {
      await base44.users.inviteUser(u.email.toLowerCase().trim(), u.role);
      resultados.push({ email: u.email, status: "invitado" });
    } catch (error) {
      resultados.push({ email: u.email, status: "error", detalle: error.message });
    }
    // Pequeña pausa para evitar rate limit
    await new Promise(r => setTimeout(r, 1500));
  }

  return Response.json({ resultados });
});