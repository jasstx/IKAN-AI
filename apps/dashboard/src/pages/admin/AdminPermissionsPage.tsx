import React, { useEffect, useState } from 'react';
import { systemApi } from '../../services/api';

interface Permission {
  role: string;
  nom_affichage: string;
  description: string;
  droits: string[];
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  admin: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
  cx_manager: { bg: '#e0f2fe', text: '#0c4a6e', border: '#0ea5e9' },
  agency_manager: { bg: '#f0fdf4', text: '#14532d', border: '#22c55e' },
};

const ROLE_ICONS: Record<string, string> = {
  admin: '🛡️',
  cx_manager: '📊',
  agency_manager: '🏪',
};

export default function AdminPermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    systemApi.getPermissions().then((r) => {
      setPermissions(r.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Chargement...</div>;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>🔐 Rôles & Permissions</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '6px', fontSize: '0.9rem' }}>
          Matrice complète des droits d'accès accordés à chaque rôle dans la plateforme IKAN AI.
          Les rôles sont fixes et définis dans le cahier des charges du projet.
        </p>
      </div>

      {/* Bandeaux de rôles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {permissions.map((p) => {
          const colors = ROLE_COLORS[p.role] || { bg: '#f8fafc', text: '#475569', border: '#94a3b8' };
          const icon = ROLE_ICONS[p.role] || '👤';
          return (
            <div
              key={p.role}
              style={{
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: colors.text }}>{p.nom_affichage}</div>
                  <div style={{
                    display: 'inline-block', fontSize: '0.7rem', fontWeight: 700,
                    background: colors.border, color: 'white',
                    borderRadius: '4px', padding: '1px 6px', marginTop: '2px',
                  }}>
                    {p.role.toUpperCase()}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: colors.text, opacity: 0.8, marginBottom: '0' }}>
                {p.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Tableau comparatif détaillé */}
      <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>Droits d'accès détaillés par rôle</h2>
        </div>
        {permissions.map((p, idx) => {
          const colors = ROLE_COLORS[p.role] || { bg: '#f8fafc', text: '#475569', border: '#94a3b8' };
          const icon = ROLE_ICONS[p.role] || '👤';
          return (
            <div key={p.role} style={{ borderTop: idx > 0 ? '1px solid #f1f5f9' : undefined }}>
              <div style={{ padding: '14px 20px', background: '#fafafa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{icon}</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{p.nom_affichage}</span>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, background: colors.border,
                  color: 'white', borderRadius: '4px', padding: '1px 6px',
                }}>
                  {p.role.toUpperCase()}
                </span>
              </div>
              <div style={{ padding: '12px 20px 16px' }}>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {p.droits.map((droit, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem', color: '#374151' }}>
                      <span style={{ color: '#22c55e', fontWeight: 700, marginTop: '1px' }}>✓</span>
                      {droit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note d'information */}
      <div style={{
        marginTop: '24px', background: '#fffbeb', border: '1px solid #fbbf24',
        borderRadius: '8px', padding: '14px 18px', display: 'flex', gap: '10px',
      }}>
        <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
        <div style={{ fontSize: '0.85rem', color: '#78350f' }}>
          <strong>Note :</strong> Les rôles sont définis de façon fixe et centralisée dans la plateforme. 
          Pour modifier les droits associés à un rôle ou créer un rôle personnalisé, contactez l'équipe technique IKAN AI.
        </div>
      </div>
    </div>
  );
}
