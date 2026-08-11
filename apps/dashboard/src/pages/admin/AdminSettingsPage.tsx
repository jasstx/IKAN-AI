import React, { useEffect, useState } from 'react';
import { systemApi } from '../../services/api';

interface Settings {
  id: string;
  nom_application: string;
  seuil_alerte_defaut: number;
  retention_mois: number;
  mode_ia: string;
  notifications_email_actives: boolean;
  date_modification: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0',
  borderRadius: '6px', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem', color: '#374151',
};

const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
  padding: '24px', marginBottom: '20px',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    systemApi.getSettings().then((r) => {
      setSettings(r.data);
      setForm(r.data);
    }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await systemApi.updateSettings({
        nom_application: form.nom_application,
        seuil_alerte_defaut: form.seuil_alerte_defaut,
        retention_mois: form.retention_mois,
        mode_ia: form.mode_ia,
        notifications_email_actives: form.notifications_email_actives,
      });
      setSettings(r.data);
      setForm(r.data);
      showToast('✅ Paramètres enregistrés avec succès');
    } catch {
      showToast('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1000,
          background: '#1e293b', color: 'white', padding: '12px 20px',
          borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontSize: '0.9rem',
        }}>{toast}</div>
      )}

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>⚙️ Paramètres Système</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '6px', fontSize: '0.9rem' }}>
          Configuration générale de la plateforme IKAN AI.
          {settings?.date_modification && (
            <span> Dernière modification le {new Date(settings.date_modification).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.</span>
          )}
        </p>
      </div>

      {/* Section 1 : Identité de la plateforme */}
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '18px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          🏷️ Identité de la plateforme
        </h2>
        <div>
          <label style={labelStyle}>Nom de l'application</label>
          <input
            style={inputStyle}
            value={form.nom_application || ''}
            onChange={(e) => setForm({ ...form, nom_application: e.target.value })}
            placeholder="IKAN AI — Plateforme Feedback Client"
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Ce nom apparaît dans les rapports et les communications automatiques.
          </p>
        </div>
      </div>

      {/* Section 2 : Alertes et données */}
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '18px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          📊 Alertes et Rétention des données
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={labelStyle}>
              Seuil d'alerte par défaut pour les nouvelles agences : <strong>{form.seuil_alerte_defaut}%</strong>
            </label>
            <input
              type="range" min={0} max={100} value={form.seuil_alerte_defaut || 80}
              onChange={(e) => setForm({ ...form, seuil_alerte_defaut: Number(e.target.value) })}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Appliqué automatiquement à chaque nouvelle agence créée. Les agences existantes ne sont pas affectées.
            </p>
          </div>
          <div>
            <label style={labelStyle}>Durée de rétention des feedbacks (mois)</label>
            <input
              type="number" min={1} max={120} style={{ ...inputStyle, width: '120px' }}
              value={form.retention_mois || 24}
              onChange={(e) => setForm({ ...form, retention_mois: Number(e.target.value) })}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Les feedbacks plus anciens que cette durée seront archivés automatiquement.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3 : Moteur IA */}
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '18px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          🤖 Moteur d'Analyse IA
        </h2>
        <div>
          <label style={labelStyle}>Mode du moteur IA</label>
          <select
            style={inputStyle}
            value={form.mode_ia || 'deterministique'}
            onChange={(e) => setForm({ ...form, mode_ia: e.target.value })}
          >
            <option value="deterministique">Déterministe (règles métier, sans LLM)</option>
            <option value="hybride">Hybride (règles + LLM enrichi)</option>
          </select>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Le mode hybride nécessite une clé API LLM configurée par votre équipe technique.
          </p>
        </div>
      </div>

      {/* Section 4 : Notifications */}
      <div style={cardStyle}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '18px', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
          🔔 Notifications
        </h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.notifications_email_actives || false}
            onChange={(e) => setForm({ ...form, notifications_email_actives: e.target.checked })}
            style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Activer les notifications par email</span>
        </label>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '8px', marginLeft: '30px' }}>
          Envoie des alertes par email aux responsables concernés lorsqu'un seuil d'insatisfaction est dépassé.
        </p>
      </div>

      {/* Bouton Enregistrer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? '#94a3b8' : 'var(--color-primary)', color: 'white',
            border: 'none', borderRadius: '8px', padding: '11px 28px',
            cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            fontWeight: 700, fontSize: '0.95rem',
          }}
        >
          {saving ? 'Enregistrement...' : '💾 Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  );
}
