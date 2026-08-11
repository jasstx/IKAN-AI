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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '24px' }}>
        Alertes de satisfaction
      </h1>

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
