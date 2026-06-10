import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-card/80 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="mr-3"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <img
            src="https://media.base44.com/images/public/6a10daaa13888870642a70ef/2440d15f9_image.png"
            alt="Pequeño Cottolengo"
            className="h-7 w-7 object-contain rounded"
          />
          <span className="text-sm font-semibold ml-2">Pequeño Cottolengo</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}