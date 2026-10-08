import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Login/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InventoryPage from './pages/Inventory/InventoryPage';
import ForecastPage from './pages/Forecast/ForecastPage';
import RisksPage from './pages/Risks/RisksPage';
import NetworkPage from './pages/Network/NetworkPage';
import TransfersPage from './pages/Transfers/TransfersPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';

export default function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Hospital Portal Authenticated Layout */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/risks" element={<RisksPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
