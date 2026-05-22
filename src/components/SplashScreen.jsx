import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const SPLASH_KEY = "providentia_splash_seen";

export default function SplashScreen({ children }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem(SPLASH_KEY);
    if (!seen) setShow(true);
  }, []);

  const enter = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setShow(false);
  };

  if (!show) return children;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(268,40%,14%)] via-[hsl(268,38%,20%)] to-[hsl(268,30%,12%)]">
      {/* Decorative circles */}
      <div className="absolute top-16 right-16 w-48 h-48 rounded-full bg-[hsl(10,65%,60%)] opacity-10 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-[hsl(268,45%,55%)] opacity-15 blur-3xl" />

      <div className="relative flex flex-col items-center gap-8 px-8 text-center">
        {/* Logo */}
        <div className="w-36 h-36 rounded-2xl bg-white shadow-2xl flex items-center justify-center p-3">
          <img
            src="https://media.base44.com/images/public/6a10daaa13888870642a70ef/2440d15f9_image.png"
            alt="Pequeño Cottolengo Quintero"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Pequeño Cottolengo
          </h1>
          <p className="text-lg text-white/60 font-light">Quintero</p>
          <div className="h-px w-16 bg-white/20 mx-auto my-3" />
          <p className="text-sm text-white/50 max-w-xs">
            Plataforma de gestión residencial · Cuidado con dignidad
          </p>
        </div>

        {/* Enter button */}
        <Button
          onClick={enter}
          size="lg"
          className="mt-2 bg-white text-[hsl(268,45%,42%)] hover:bg-white/90 font-semibold px-10 rounded-full shadow-lg text-base"
        >
          Ingresar a la plataforma
        </Button>
      </div>
    </div>
  );
}