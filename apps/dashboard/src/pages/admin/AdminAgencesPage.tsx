import React, { useEffect, useState } from 'react';
import { agencesApi, organisationsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Agence } from '../../types';

interface AgenceForm {
  nom: string;
  adresse: string;
  ville: string;
  latitude: string;
  longitude: string;
  seuil_alerte: number;
}

const emptyForm: AgenceForm = { nom: '', adresse: '', ville: '', latitude: '', longitude: '', seuil_alerte: 80 };

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: '6px', fontFamily: 'inherit', fontSize: '0.9rem', boxSizing: 'border-box',
};

const btnPrimary: React.CSSProperties = {
  background: 'var(--color-primary)', color: 'white', border: 'none',
  borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
};

const btnDanger: React.CSSProperties = {
  background: '#fee2e2', color: '#dc2626', border: 'none',
  borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
};

const btnSecondary: React.CSSProperties = {
  background: '#f1f5f9', color: '#475569', border: 'none',
  borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
};

export default function AdminAgencesPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'admin';

  const [agences, setAgences] = useState<Agence[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; nom: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Agence | null>(null);
  const [qrModalTarget, setQrModalTarget] = useState<Agence | null>(null);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [form, setForm] = useState<AgenceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const promises: Promise<any>[] = [agencesApi.list()];
    if (isAdmin) {
      promises.push(organisationsApi.list());
    }

    Promise.all(promises)
      .then(([agR, orgR]) => {
        setAgences(agR.data);
        if (orgR) {
          setOrgs(orgR.data);
          if (orgR.data.length > 0) setSelectedOrg(orgR.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: Agence) => {
    setEditTarget(a);
    setForm({
      nom: a.nom,
      adresse: a.adresse || '',
      ville: a.ville || '',
      latitude: a.latitude?.toString() || '',
      longitude: a.longitude?.toString() || '',
      seuil_alerte: a.seuil_alerte,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) return;
    setSaving(true);
    try {
      const payload = {
        nom: form.nom,
        adresse: form.adresse || null,
        ville: form.ville || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        seuil_alerte: form.seuil_alerte,
      };
      if (editTarget) {
        const r = await agencesApi.update(editTarget.id, payload);
        setAgences((prev) => prev.map((a) => a.id === editTarget.id ? r.data : a));
        showToast('Agence modifiée avec succès');
      } else {
        const r = await agencesApi.create(selectedOrg, payload);
        setAgences((prev) => [...prev, r.data]);
        showToast('Agence créée avec succès (QR Code généré !)');
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (a: Agence) => {
    try {
      const r = await agencesApi.update(a.id, { active: !a.active });
      setAgences((prev) => prev.map((ag) => ag.id === a.id ? r.data : ag));
      showToast(r.data.active ? 'Agence réactivée' : 'Agence désactivée');
    } catch {
      showToast('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (a: Agence) => {
    if (!window.confirm(`Supprimer définitivement l'agence "${a.nom}" ? Cette action est irréversible.`)) return;
    try {
      await agencesApi.delete(a.id);
      setAgences((prev) => prev.filter((ag) => ag.id !== a.id));
      showToast('Agence supprimée');
    } catch {
      showToast('Impossible de supprimer cette agence (feedbacks rattachés)');
    }
  };

  const copyQrUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('✅ Lien du QR Code copié dans le presse-papier !');
  };

  const activeClientUrl = qrModalTarget
    ? (qrModalTarget.qr_code_url || `${window.location.protocol}//${window.location.hostname}:4321/feedback/${qrModalTarget.qr_code_token}`)
    : '';

  if (loading) return <div style={{ color: 'var(--color-text-muted)', padding: '32px' }}>Chargement...</div>;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 1000,
          background: '#1e293b', color: 'white', padding: '12px 20px',
          borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', fontSize: '0.9rem',
        }}>{toast}</div>
      )}

      {/* ── Header Carte Agences ── */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E5E7EB',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#E8F5E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 21H21M3 7L12 3L21 7V21H3V7Z" stroke="#02302D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#02302D', margin: 0 }}>
              {isAdmin ? 'Gestion des Agences' : 'Mes Agences & Bornes QR'} ({agences.length})
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.88rem', marginTop: '2px', margin: 0 }}>
              {isAdmin ? 'Gestion globale de la structure agences de toutes les organisations.' : 'Créez et gérez les agences de votre organisation ainsi que leurs QR codes de bornes.'}
            </p>
          </div>
        </div>

        <button onClick={openCreate} style={{ ...btnPrimary, borderRadius: '10px', padding: '10px 18px' }}>+ Nouvelle Agence</button>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead style={{ background: 'var(--color-bg)' }}>
            <tr>
              {['Agence', 'Ville', 'Seuil alerte', 'QR Code Borne', 'Statut', 'Actions'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agences.map((a) => (
              <tr key={a.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{a.nom}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{a.ville || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontWeight: 600, color: a.seuil_alerte < 70 ? '#dc2626' : 'var(--color-primary)' }}>
                    {a.seuil_alerte}%
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => setQrModalTarget(a)}
                    style={{ ...btnSecondary, background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}
                  >
                    📱 Token & QR Code
                  </button>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
                    background: a.active ? '#dcfce7' : '#f1f5f9',
                    color: a.active ? '#166534' : '#64748b',
                  }}>
                    {a.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEdit(a)} style={btnSecondary}>✏️ Modifier</button>
                    <button onClick={() => handleToggleActive(a)} style={{ ...btnSecondary, color: a.active ? '#d97706' : '#16a34a' }}>
                      {a.active ? '⏸ Désactiver' : '▶ Activer'}
                    </button>
                    <button onClick={() => handleDelete(a)} style={btnDanger}>🗑 Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {agences.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Aucune agence enregistrée.
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      {qrModalTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px', width: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center',
          }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-primary)', marginBottom: '4px' }}>
              📱 QR Code Borne Accueil
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
              <strong>{qrModalTarget.nom}</strong> {qrModalTarget.ville && `(${qrModalTarget.ville})`}
            </p>

            {/* Aperçu QR Code */}
            <div style={{
              background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0',
              display: 'inline-block', marginBottom: '20px',
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeClientUrl)}`}
                alt={`QR Code ${qrModalTarget.nom}`}
                style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto' }}
              />
              <div style={{ marginTop: '12px', fontSize: '0.78rem', fontFamily: 'monospace', color: '#334155', fontWeight: 700 }}>
                {qrModalTarget.qr_code_token || 'QR-GENERATED'}
              </div>
            </div>

            <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', color: '#475569', wordBreak: 'break-all', marginBottom: '20px', textAlign: 'left' }}>
              <strong>Lien Client :</strong> {activeClientUrl}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => copyQrUrl(activeClientUrl)}
                style={{ ...btnPrimary, width: '100%', padding: '10px' }}
              >
                📋 Copier le lien du QR Code
              </button>
              <a
                href={activeClientUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', padding: '9px', background: '#f0fdf4', color: '#166534',
                  border: '1px solid #bbf7d0', borderRadius: '6px', textDecoration: 'none',
                  fontSize: '0.85rem', fontWeight: 600,
                }}
              >
                🔗 Tester le formulaire Client en direct
              </a>
              <button
                onClick={() => setQrModalTarget(null)}
                style={{ ...btnSecondary, width: '100%', padding: '9px', marginTop: '6px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création / Édition */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '28px', width: '480px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '1.1rem' }}>
              {editTarget ? '✏️ Modifier l\'agence' : '+ Nouvelle Agence'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!editTarget && isAdmin && orgs.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Organisation *</label>
                  <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} style={inputStyle}>
                    {orgs.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Nom de l'agence *</label>
                <input style={inputStyle} value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex: Agence Pissy" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Adresse</label>
                <input style={inputStyle} value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Ex: Avenue de la Paix" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Ville</label>
                <input style={inputStyle} value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} placeholder="Ex: Ouagadougou" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Latitude</label>
                  <input style={inputStyle} type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="12.3714" />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Longitude</label>
                  <input style={inputStyle} type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-1.5197" />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>
                  Seuil d'alerte satisfaction (%) — Défaut : 80%
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="range" min={0} max={100} value={form.seuil_alerte}
                    onChange={(e) => setForm({ ...form, seuil_alerte: Number(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontWeight: 700, color: form.seuil_alerte < 70 ? '#dc2626' : 'var(--color-primary)', minWidth: '40px' }}>
                    {form.seuil_alerte}%
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Un QR Code de borne sera automatiquement généré pour cette agence.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} style={{ ...btnSecondary, padding: '8px 16px' }}>Annuler</button>
              <button onClick={handleSave} disabled={saving} style={btnPrimary}>
                {saving ? 'Enregistrement...' : (editTarget ? 'Modifier' : 'Créer l\'agence')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
