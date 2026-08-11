import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardSiegePage from './pages/cx/DashboardSiegePage';
import DashboardAgencePage from './pages/agency/DashboardAgencePage';
import FeedbacksPage from './pages/agency/FeedbacksPage';
import SuggestionsPage from './pages/agency/SuggestionsPage';
import AlertesPage from './pages/agency/AlertesPage';
import AdminOrgsPage from './pages/admin/AdminOrgsPage';
import AdminAgencesPage from './pages/admin/AdminAgencesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminPermissionsPage from './pages/admin/AdminPermissionsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function IndexRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'agency_manager') return <Navigate to="/agence" replace />;
  return <Navigate to="/siege" replace />;
}

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<IndexRedirect />} />
        
        {/* CX Manager — Vue siège */}
        <Route path="siege" element={<DashboardSiegePage />} />

        {/* Agency Manager & CX Manager */}
        <Route path="agence" element={<DashboardAgencePage />} />
        <Route path="feedbacks" element={<FeedbacksPage />} />
        <Route path="suggestions" element={<SuggestionsPage />} />
        <Route path="alertes" element={<AlertesPage />} />

        {/* Admin */}
        <Route path="admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="admin/organisations" element={<AdminOrgsPage />} />
        <Route path="admin/agences" element={<AdminAgencesPage />} />
        <Route path="admin/utilisateurs" element={<AdminUsersPage />} />
        <Route path="admin/permissions" element={<AdminPermissionsPage />} />
        <Route path="admin/settings" element={<AdminSettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
