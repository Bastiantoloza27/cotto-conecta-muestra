import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import SplashScreen from '@/components/SplashScreen';
import Dashboard from '@/pages/Dashboard';
import Residents from '@/pages/Residents';
import ResidentProfile from '@/pages/ResidentProfile';
import DailyLogs from '@/pages/DailyLogs';
import SupportPlans from '@/pages/SupportPlans';
import Medications from '@/pages/Medications';
import Incidents from '@/pages/Incidents';
import Activities from '@/pages/Activities';
import Shifts from '@/pages/Shifts';
import Pastoral from '@/pages/Pastoral';
import Inventory from '@/pages/Inventory';
import SenadisReport from '@/pages/SenadisReport';
import Admissions from '@/pages/Admissions';
import CalendarPage from '@/pages/CalendarPage';
import Staff from '@/pages/Staff';
import InformesMedico from '@/pages/InformesMedico';
import ControlGastos from '@/pages/ControlGastos';
import Reuniones from '@/pages/Reuniones';
import AvisosDirector from '@/pages/AvisosDirector';
import MisAvisos from '@/pages/MisAvisos';
import ConfiguracionSlackPage from '@/pages/ConfiguracionSlackPage';
import AdminRoute from '@/components/AdminRoute';
import CuidadorRoute from '@/components/CuidadorRoute';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-3">Cargando Providentia...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/residentes" element={<Residents />} />
        <Route path="/residentes/:id" element={<ResidentProfile />} />
        <Route path="/bitacora" element={<DailyLogs />} />
        <Route path="/planes" element={<CuidadorRoute><SupportPlans /></CuidadorRoute>} />
        <Route path="/medicacion" element={<CuidadorRoute><Medications /></CuidadorRoute>} />
        <Route path="/incidentes" element={<CuidadorRoute><Incidents /></CuidadorRoute>} />
        <Route path="/informes-medico" element={<CuidadorRoute><InformesMedico /></CuidadorRoute>} />
        <Route path="/actividades" element={<Activities />} />
        <Route path="/turnos" element={<CuidadorRoute><Shifts /></CuidadorRoute>} />
        <Route path="/pastoral" element={<Pastoral />} />
        <Route path="/inventario" element={<CuidadorRoute><Inventory /></CuidadorRoute>} />
        <Route path="/senadis" element={<CuidadorRoute><SenadisReport /></CuidadorRoute>} />
        <Route path="/admisiones" element={<CuidadorRoute><Admissions /></CuidadorRoute>} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/personal" element={<CuidadorRoute><Staff /></CuidadorRoute>} />
        <Route path="/avisos" element={<AdminRoute><AvisosDirector /></AdminRoute>} />
        <Route path="/mis-avisos" element={<MisAvisos />} />
        <Route path="/slack-config" element={<AdminRoute><ConfiguracionSlackPage /></AdminRoute>} />
        <Route path="/gastos" element={<CuidadorRoute><ControlGastos /></CuidadorRoute>} />
        <Route path="/reuniones" element={<CuidadorRoute><Reuniones /></CuidadorRoute>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SplashScreen>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </SplashScreen>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App