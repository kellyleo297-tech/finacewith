import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ExpenseRecord from './pages/ExpenseRecord';
import Budget from './pages/Budget';
import Statistics from './pages/Statistics';
import AIAssistant from './pages/AIAssistant';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-dvh flex items-center justify-center"><div className="animate-spin text-3xl">💰</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<Layout />}>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/record" element={<ProtectedRoute><ExpenseRecord /></ProtectedRoute>} />
              <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
              <Route path="/stats" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            </Route>
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
