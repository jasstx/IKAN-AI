import React, { useEffect, useState } from 'react';
import { organisationsApi } from '../../services/api';
import type { Organisation } from '../../types';

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organisation | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    nom: '',
    logo: '',
    secteur_activite: '',
    pays_region: '',
    email_pro: '',
  });

  const loadOrgs = () => {
    organisationsApi.list().then((r) => {
      setOrgs(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const openCreate = () => {
    setEditingOrg(null);
    setForm({ nom: '', logo: '', secteur_activite: '', pays_region: '', email_pro: '' });
    setErrorMsg('');
    setShowForm(true);
  };

  const openEdit = (org: Organisation) => {
    setEditingOrg(org);
    setForm({
      nom: org.nom || '',
      logo: org.logo || '',
      secteur_activite: org.secteur_activite || org.secteur || '',
      pays_region: org.pays_region || '',
      email_pro: org.email_pro || org.email || '',
    });
    setErrorMsg('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        nom: form.nom,
        logo: form.logo.trim() || null,
        secteur_activite: form.secteur_activite,
        pays_region: form.pays_region,
        email_pro: form.email_pro,
      };

      if (editingOrg) {
        await organisationsApi.update(editingOrg.id, payload);
      } else {
        await organisationsApi.create(payload);
      }

      loadOrgs();
      setShowForm(false);
      setEditingOrg(null);
      setForm({ nom: '', logo: '', secteur_activite: '', pays_region: '', email_pro: '' });
    } catch (err: any) {
      console.error("Erreur API organisation:", err?.response?.data);
      let detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        detail = detail.map((d: any) => `${d.loc ? d.loc.join('.') : ''}: ${d.msg}`).join(', ');
      } else if (typeof detail === 'object') {
        detail = JSON.stringify(detail);
      }
      setErrorMsg(detail || err?.message || "Erreur lors de l'enregistrement de l'organisation.");
    }
  };

  const deleteOrg = async (id: string) => {
    if (!confirm('Supprimer cette organisation ?')) return;
    try {
      await organisationsApi.delete(id);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Impossible de supprimer cette organisation.");
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)', padding: '32px' }}>Chargement...</div>;

  return (
    <div>
      {/* ── Header Carte Organisations ── */}
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
              <path d="M19 21V5A2 2 0 0 0 17 3H7A2 2 0 0 0 5 5V21M3 21H21M9 7H10M9 11H10M9 15H10M14 7H15M14 11H15M14 15H15" stroke="#02302D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#02302D', margin: 0 }}>
              Organisations ({orgs.length})
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.88rem', marginTop: '2px', margin: 0 }}>
              Gestion des entreprises et groupes clients inscrits sur IKAN AI.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditingOrg(null);
            } else {
              openCreate();
            }
          }}
          style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem' }}
        >
          {showForm ? 'Fermer' : '+ Nouvelle organisation'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.05rem', fontWeight: 700, color: '#02302D' }}>
            {editingOrg ? `✏️ Modifier l'organisation : ${editingOrg.nom}` : "➕ Créer une organisation"}
          </h3>

          {errorMsg && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '16px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Nom de l'entreprise *</label>
              <input
                type="text"
                placeholder="ex: Orange Tunisie"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Email professionnel *</label>
              <input
                type="email"
                placeholder="ex: contact@orange.tn"
                value={form.email_pro}
                onChange={(e) => setForm({ ...form, email_pro: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Secteur d'activité *</label>
              <input
                type="text"
                placeholder="ex: Télécommunications, Banque, Hôtellerie..."
                value={form.secteur_activite}
                onChange={(e) => setForm({ ...form, secteur_activite: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Pays / Région *</label>
              <input
                type="text"
                placeholder="ex: Tunisie / Afrique du Nord"
                value={form.pays_region}
                onChange={(e) => setForm({ ...form, pays_region: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '0.85rem' }}>
                Logo de l'organisation (Import d'image ou URL)
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Collez une URL d'image ou importez un fichier ->"
                  value={form.logo}
                  onChange={(e) => setForm({ ...form, logo: e.target.value })}
                  style={{ flex: 1, padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
                
                <label style={{
                  background: '#f1f5f9',
                  border: '1.5px solid #cbd5e1',
                  color: '#334155',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                }}>
                  📁 Importer une image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (uploadEvent) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_SIZE = 250;
                            let width = img.width;
                            let height = img.height;
                            if (width > height) {
                              if (width > MAX_SIZE) {
                                height = Math.round((height * MAX_SIZE) / width);
                                width = MAX_SIZE;
                              }
                            } else {
                              if (height > MAX_SIZE) {
                                width = Math.round((width * MAX_SIZE) / height);
                                height = MAX_SIZE;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);
                            const resizedBase64 = canvas.toDataURL('image/png', 0.9);
                            setForm((prev) => ({ ...prev, logo: resizedBase64 }));
                          };
                          img.src = uploadEvent.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* Aperçu du logo en direct */}
              {form.logo && (
                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Aperçu du logo :</span>
                  <img src={form.logo} alt="Aperçu" style={{ height: '36px', maxHeight: '36px', borderRadius: '6px', objectFit: 'contain' }} />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo: '' })}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', marginLeft: 'auto' }}
                  >
                    ✕ Retirer
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button type="button" onClick={() => { setShowForm(false); setEditingOrg(null); }} style={{ padding: '10px 18px', border: '1.5px solid #e2e8f0', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
            <button type="submit" style={{ padding: '10px 22px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {editingOrg ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              {['Organisation', 'Secteur d\'activité', 'Pays / Région', 'Email Pro', 'Statut', 'Actions'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {o.logo ? (
                      <img src={o.logo} alt={o.nom} style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                        {o.nom.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span>{o.nom}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{o.secteur_activite || o.secteur || '—'}</td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>{o.pays_region || '—'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500 }}>{o.email_pro || o.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`badge ${o.active ? 'badge-success' : 'badge-neutral'}`}>
                    {o.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => openEdit(o)}
                      style={{ background: '#f1f5f9', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => deleteOrg(o.id)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
