import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PaywallsPage } from './pages/PaywallsPage';
import { PaywallEditorPage } from './pages/PaywallEditorPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ExperimentDetailPage } from './pages/ExperimentDetailPage';
import { AudiencePage } from './pages/AudiencePage';
import { SettingsPage } from './pages/SettingsPage';
import { QuickstartPage } from './pages/QuickstartPage';

export function App() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/quickstart" element={<QuickstartPage />} />
        <Route path="/paywalls" element={<PaywallsPage />} />
        <Route path="/paywalls/new" element={<PaywallEditorPage />} />
        <Route path="/paywalls/:id" element={<PaywallEditorPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/experiments" element={<ExperimentsPage />} />
        <Route path="/experiments/:id" element={<ExperimentDetailPage />} />
        <Route path="/audience" element={<AudiencePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
