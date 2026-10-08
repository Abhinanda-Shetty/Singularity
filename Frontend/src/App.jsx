import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage    from './pages/Landing/LandingPage';
import LoginPage      from './pages/Login/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage  from './pages/Dashboard/DashboardPage';
import InventoryPage  from './pages/Inventory/InventoryPage';
import ForecastPage   from './pages/Forecast/ForecastPage';
import RisksPage      from './pages/Risks/RisksPage';
import NetworkPage    from './pages/Network/NetworkPage';
import TransfersPage  from './pages/Transfers/TransfersPage';
import ReportsPage    from './pages/Reports/ReportsPage';
import SettingsPage   from './pages/Settings/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"      element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected dashboard — all child routes require a valid token */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/inventory"  element={<InventoryPage />} />
          <Route path="/forecast"   element={<ForecastPage />} />
          <Route path="/risks"      element={<RisksPage />} />
          <Route path="/network"    element={<NetworkPage />} />
          <Route path="/transfers"  element={<TransfersPage />} />
          <Route path="/reports"    element={<ReportsPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
