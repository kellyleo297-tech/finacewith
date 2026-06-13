import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ExpenseRecord from './pages/ExpenseRecord';
import Budget from './pages/Budget';
import Statistics from './pages/Statistics';
import AIAssistant from './pages/AIAssistant';
import Onboarding from './pages/Onboarding';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AppProvider>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/record" element={<ExpenseRecord />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/stats" element={<Statistics />} />
            <Route path="/ai" element={<AIAssistant />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
