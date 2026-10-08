import { motion } from "framer-motion";
import { ShieldCheck, GraduationCap, FileCheck2 } from "lucide-react";

const MASCOTA = "https://media.base44.com/images/public/6a399c6df931c47ca576e02e/8b253a2b7_generated_image.png";

export default function PrevencionHero({ docs }) {
  const aprobados = docs.filter((d) => d.estado === "aprobado").length;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 text-white mb-6 min-h-[260px]">
      <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_22px,rgba(0,0,0,.35)_22px,rgba(0,0,0,.35)_44px)]" />
      <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/20 blur-2xl" />
      <div className="relative grid md:grid-cols-[1fr_auto] items-center gap-4 p-6 sm:p-10">
        <div className="space-y-3 max-w-xl">
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider bg-white/25 rounded-full px-3 py-1"><ShieldCheck className="w-4 h-4" />Zona de seguridad</span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight drop-shadow">Bienvenido al mundo de la Prevención</h1>
          <p className="text-white/90">Hola, soy el Cotto Prevencionista. Aquí encontrarás protocolos, planes de emergencia y tus capacitaciones para cuidar y cuidarnos.</p>
          <div className="flex flex-wrap gap-2 pt-1 text-sm">
            <span className="flex items-center gap-1 bg-white/20 rounded-lg px-3 py-1.5"><FileCheck2 className="w-4 h-4" />{aprobados} documentos vigentes</span>
            <span className="flex items-center gap-1 bg-white/20 rounded-lg px-3 py-1.5"><GraduationCap className="w-4 h-4" />Aula virtual del personal</span>
          </div>
        </div>
        <motion.div className="hidden md:block w-60 h-60 rounded-full bg-white/90 shadow-2xl overflow-hidden"
          animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <img src={MASCOTA} alt="Cotto Prevencionista" className="w-full h-full object-contain mix-blend-multiply" />
        </motion.div>
      </div>
    </div>
  );
}