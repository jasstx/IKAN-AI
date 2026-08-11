import React, { useEffect, useState } from 'react';
import { organisationsApi, agencesApi, utilisateursApi } from '../../services/api';

export default function AdminDashboardPage() {
  const [nbOrgs, setNbOrgs] = useState(0);
  const [nbAgences, setNbAgences] = useState(0);
  const [nbUsers, setNbUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      organisationsApi.list(),
      agencesApi.list(),
      utilisateursApi.list(),
    ])
      .then(([oRes, aRes, uRes]) => {
        setNbOrgs(oRes.data.length);
        setNbAgences(aRes.data.length);
        setNbUsers(uRes.data.length);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '32px', color: 'var(--color-text-muted)' }}>Chargement des données structurelles...</div>;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
          🏛️ Dashboard Administrateur — Vue Structurelle
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
          Supervision globale du parc d'organisations clientes et de la structure des comptes utilisateurs.
        </p>
      </div>

      {/* Cartes KPIs Structurelles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow)', borderLeft: '5px solid var(--color-primary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏢</div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Organisations Clientes</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>{nbOrgs}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>Sociétés enregistrées sur IKAN AI</div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow)', borderLeft: '5px solid #0ea5e9' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏪</div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Agences Actives</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0ea5e9', marginTop: '4px' }}>{nbAgences}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>Points de vente / bornes QR</div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: 'var(--shadow)', borderLeft: '5px solid #6366f1' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Comptes Utilisateurs</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#6366f1', marginTop: '4px' }}>{nbUsers}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>Admins, CX Managers & Agency Managers</div>
        </div>
      </div>

      {/* Note de Sécurité et Confidentialité */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
        padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: '14px',
      }}>
        <div style={{ fontSize: '1.4rem' }}>🔒</div>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
            Respect de la confidentialité et Matrice des Droits (RBAC)
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Conformément à la politique d'isolation d'IKAN AI, le compte <strong>Administrateur</strong> gère uniquement les entités de structure (Organisations, attribution des CX Managers et Paramètres). La consultation des <strong>feedbacks clients</strong> et des <strong>statistiques de satisfaction</strong> est strictement réservée aux <strong>CX Managers</strong> et <strong>Agency Managers</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
