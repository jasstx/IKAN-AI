import React, { useEffect, useState } from 'react';
import { utilisateursApi, agencesApi, organisationsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

type UserRow = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  active: boolean;
  organisation_id?: string;
  agence_id?: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  cx_manager: 'CX Manager (Siège)',
  agency_manager: 'Chef d\'Agence (Agency Manager)',
};

const ROLE_BADGES: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#fef3c7', text: '#92400e' },
  cx_manager: { bg: '#e0f2fe', text: '#0369a1' },
  agency_manager: { bg: '#dcfce7', text: '#15803d' },
};

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isCXManager = currentUser?.role === 'cx_manager';

  const [users, setUsers] = useState<UserRow[]>([]);
  const [agences, setAgences] = useState<{ id: string; nom: string }[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; nom: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: isCXManager ? 'agency_manager' : 'agency_manager',
    organisation_id: '',
    agence_id: '',
  });

  useEffect(() => {
    Promise.all([
      utilisateursApi.list(),
      agencesApi.list(),
      currentUser?.role === 'admin' ? organisationsApi.list() : Promise.resolve({ data: [] }),
    ])
      .then(([u, a, o]) => {
        setUsers(u.data);
        setAgences(a.data);
        setOrgs(o.data);
        if (o.data.length > 0) {
          setForm((prev) => ({ ...prev, organisation_id: o.data[0].id }));
        }
      })
      .finally(() => setLoading(false));
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email || !form.password) return;
    setSaving(true);
    try {
      const payload: any = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        password: form.password,
        role: isCXManager ? 'agency_manager' : form.role,
        agence_id: form.agence_id || null,
      };
      if (currentUser?.role === 'admin' && form.organisation_id) {
        payload.organisation_id = form.organisation_id;
      }
      await utilisateursApi.create(payload);
      const r = await utilisateursApi.list();
      setUsers(r.data);
      setShowForm(false);
      setForm({ nom: '', prenom: '', email: '', password: '', role: 'agency_manager', organisation_id: orgs[0]?.id || '', agence_id: '' });
      showToast('✅ Utilisateur créé avec succès');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserActive = async (user: UserRow) => {
    try {
      await utilisateursApi.update(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, active: !u.active } : u));
      showToast(user.active ? 'Utilisateur désactivé' : 'Utilisateur réactivé');
    } catch {
      showToast('Erreur lors de la modification');
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)', padding: '32px' }}>Chargement des utilisateurs...</div>;

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

      {/* ── Header Carte Utilisateurs ── */}
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
              <path d="M17 21V19A4 4 0 0 0 13 15H5A4 4 0 0 0 1 19V21M9 11A4 4 0 1 0 9 3A4 4 0 0 0 9 11ZM23 21V19A4 4 0 0 0 19.12 15.16M16 3.13A4 4 0 0 1 16 11" stroke="#02302D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#02302D', margin: 0 }}>
              {isCXManager ? 'Chefs d\'Agence (Agency Managers)' : 'Gestion des Utilisateurs'} ({users.length})
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.88rem', marginTop: '2px', margin: 0 }}>
              {isCXManager ? 'Créez et attribuez les responsables pour les agences de votre organisation.' : 'Gestion complète des comptes et des attributions de rôles.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.9rem' }}
        >
          {showForm ? 'Fermer' : '+ Nouvel Utilisateur'}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <form onSubmit={create} style={{
          background: 'white', borderRadius: '12px', padding: '24px',
          boxShadow: 'var(--shadow)', marginBottom: '24px', display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: '14px', border: '1px solid #e2e8f0',
        }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Prénom *</label>
            <input type="text" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} required style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Sami" />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Nom *</label>
            <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="Ben Ali" />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Adresse Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="manager@organisation.com" />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Mot de passe initial *</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', boxSizing: 'border-box' }} placeholder="••••••••" />
          </div>

          {/* Rôle */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Rôle à attribuer *</label>
            {isCXManager ? (
              <input type="text" value="Agency Manager (Chef d'Agence)" disabled style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '6px', fontFamily: 'inherit', color: '#64748b', boxSizing: 'border-box' }} />
            ) : (
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="agency_manager">Agency Manager (Chef d'Agence)</option>
                <option value="cx_manager">CX Manager (Siège)</option>
                <option value="admin">Administrateur</option>
              </select>
            )}
          </div>

          {/* Agence (pour Agency Manager) */}
          {(form.role === 'agency_manager' || isCXManager) && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Agence à attribuer</label>
              <select value={form.agence_id} onChange={(e) => setForm({ ...form, agence_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                <option value="">— Sélectionner une agence —</option>
                {agences.map((a) => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
            </div>
          )}

          {/* Organisation (si Admin) */}
          {currentUser?.role === 'admin' && orgs.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>Organisation rattachée *</label>
              <select value={form.organisation_id} onChange={(e) => setForm({ ...form, organisation_id: e.target.value })} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontFamily: 'inherit', boxSizing: 'border-box' }}>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.nom}</option>)}
              </select>
            </div>
          )}

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>Annuler</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              {saving ? 'Création...' : 'Créer l\'utilisateur'}
            </button>
          </div>
        </form>
      )}

      {/* Tableau des utilisateurs */}
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead style={{ background: 'var(--color-bg)' }}>
            <tr>
              {['Utilisateur', 'Email', 'Rôle', 'Agence rattachée', 'Statut', 'Actions'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const badgeStyle = ROLE_BADGES[u.role] || { bg: '#f1f5f9', text: '#475569' };
              const agenceNom = agences.find((a) => a.id === u.agence_id)?.nom || '—';

              return (
                <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.prenom} {u.nom}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: badgeStyle.bg, color: badgeStyle.text, padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#334155' }}>{agenceNom}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600,
                      background: u.active ? '#dcfce7' : '#f1f5f9', color: u.active ? '#166534' : '#64748b',
                    }}>
                      {u.active ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => toggleUserActive(u)}
                      style={{
                        background: u.active ? '#fff7ed' : '#f0fdf4',
                        color: u.active ? '#c2410c' : '#15803d',
                        border: 'none', borderRadius: '6px', padding: '6px 12px',
                        cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600,
                      }}
                    >
                      {u.active ? '⏸ Désactiver' : '▶ Réactiver'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Aucun utilisateur trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
