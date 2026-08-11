import React, { useEffect, useState } from 'react';
import { alertesApi } from '../../services/api';
import type { Alerte } from '../../types';

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alertesApi.list().then((r) => {
      setAlertes(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Chargement...</div>;

  return (
    <div>
      {/* ── Header Carte Alertes ── */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E5E7EB',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21S18 15 18 8Z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21A2 2 0 0 1 10.27 21" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#02302D', margin: 0 }}>
              Alertes de satisfaction ({alertes.length})
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.88rem', marginTop: '2px', margin: 0 }}>
              Agences nécessitant une intervention suite au franchissement des seuils d'alerte.
            </p>
          </div>
        </div>
      </div>

      {alertes.length === 0 ? (
        <div style={{
          background: '#d4edda',
          border: '1px solid #c3e6cb',
          borderRadius: 'var(--radius)',
          padding: '20px',
          color: '#155724',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <p>Aucune alerte active. Toutes les agences sont au-dessus des seuils configurés.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alertes.map((a, i) => (
            <div key={i} style={{
              background: 'white',
              border: '2px solid #ffc107',
              borderLeft: '5px solid #e67e22',
              borderRadius: 'var(--radius)',
              padding: '18px 20px',
              boxShadow: 'var(--shadow)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--color-text)' }}>⚠️ {a.agence_nom}</h3>
                <span style={{
                  background: '#fff3cd',
                  color: '#856404',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}>
                  {a.taux_actuel}% / seuil {a.seuil}%
                </span>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{a.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
