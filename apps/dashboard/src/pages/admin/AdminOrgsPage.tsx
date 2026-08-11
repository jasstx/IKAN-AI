import React, { useEffect, useState } from 'react';
import { organisationsApi } from '../../services/api';
import type { Organisation } from '../../types';

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', secteur: '', email: '', telephone: '' });

  useEffect(() => {
    organisationsApi.list().then((r) => {
      setOrgs(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await organisationsApi.create(form);
    const r = await organisationsApi.list();
    setOrgs(r.data);
    setShowForm(false);
    setForm({ nom: '', secteur: '', email: '', telephone: '' });
  };

  const deleteOrg = async (id: string) => {
    if (!confirm('Supprimer cette organisation ?')) return;
    await organisationsApi.delete(id);
    setOrgs((prev) => prev.filter((o) => o.id !== id));
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)' }}>Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Organisations</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
        >
          + Nouvelle organisation
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} style={{ background: 'white', borderRadius: 'var(--radius)', padding: '20px', boxShadow: 'var(--shadow)', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { key: 'nom', label: 'Nom', type: 'text', required: true },
            { key: 'secteur', label: 'Secteur', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'telephone', label: 'Téléphone', type: 'text', required: false },
          ].map(({ key, label, type, required }) => (
            <div key={key}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '4px', fontSize: '0.85rem' }}>{label}</label>
              <input
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={required}
                style={{ width: '100%', padding: '10px', border: '2px solid var(--color-border)', borderRadius: '6px', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 18px', border: '2px solid var(--color-border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
            <button type="submit" style={{ padding: '10px 18px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Créer</button>
          </div>
        </form>
      )}

      <div style={{ background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead style={{ background: 'var(--color-bg)' }}>
            <tr>
              {['Nom', 'Secteur', 'Email', 'Statut', 'Actions'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--color-text-muted)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{o.nom}</td>
                <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>{o.secteur}</td>
                <td style={{ padding: '12px 16px' }}>{o.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span className={`badge ${o.active ? 'badge-success' : 'badge-neutral'}`}>
                    {o.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => deleteOrg(o.id)} style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
