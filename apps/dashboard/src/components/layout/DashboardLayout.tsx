import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types';

const NAV_ITEMS: Record<UserRole, { path: string; label: string; icon: string }[]> = {
  admin: [
    { path: '/admin/dashboard', label: 'Vue Structurelle', icon: '🏛️' },
    { path: '/admin/organisations', label: 'Organisations', icon: '🏢' },
    { path: '/admin/utilisateurs', label: 'Utilisateurs & CX', icon: '👥' },
    { path: '/admin/settings', label: 'Paramètres Système', icon: '⚙️' },
  ],
  cx_manager: [
    { path: '/siege', label: 'Vue Siège & Stats', icon: '📊' },
    { path: '/feedbacks', label: 'Feedbacks Org', icon: '💬' },
    { path: '/admin/agences', label: 'Gestion Agences & QR', icon: '🏪' },
    { path: '/admin/utilisateurs', label: 'Agency Managers', icon: '👥' },
    { path: '/alertes', label: 'Alertes', icon: '🔔' },
    { path: '/suggestions', label: 'Suggestions', icon: '💡' },
  ],
  agency_manager: [
    { path: '/agence', label: 'Dashboard Agence', icon: '📈' },
    { path: '/feedbacks', label: 'Feedbacks Agence', icon: '💬' },
    { path: '/suggestions', label: 'Suggestions', icon: '💡' },
    { path: '/alertes', label: 'Alertes', icon: '🔔' },
  ],
};

import IkanLogo from '../common/IkanLogo';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = user ? NAV_ITEMS[user.role] : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'var(--color-dark)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 10,
        boxShadow: '4px 0 20px rgba(2, 48, 45, 0.15)',
      }}>
        {/* Logo Officiel */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <IkanLogo variant="light" size={34} />
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '6px', fontWeight: 600 }}>
            {user?.role === 'admin' && '🏛️ Administrateur'}
            {user?.role === 'cx_manager' && '📊 CX Manager (Siège)'}
            {user?.role === 'agency_manager' && '🏪 Agency Manager'}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                background: isActive ? 'var(--color-primary)' : 'transparent',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                borderLeft: isActive ? '4px solid var(--color-lime)' : '4px solid transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              })}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div style={{
          padding: '18px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(0, 0, 0, 0.15)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', marginBottom: '10px' }}>
            <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{user?.prenom} {user?.nom}</div>
            <div style={{ opacity: 0.7, fontSize: '0.75rem', marginTop: '1px' }}>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'background 0.2s',
            }}
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        padding: '32px',
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
