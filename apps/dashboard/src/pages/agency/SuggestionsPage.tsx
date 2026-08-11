import React, { useEffect, useState, useMemo } from 'react';
import { suggestionsApi } from '../../services/api';
import type { Suggestion, IdeaStatus } from '../../types';

const STATUS_LABELS: Record<IdeaStatus, string> = {
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  traite: 'Traité',
  rejete: 'Rejeté',
};

const STATUS_STYLE: Record<IdeaStatus, { bg: string; text: string; border: string }> = {
  nouveau: { bg: '#e0f2fe', text: '#0369a1', border: '#0ea5e9' },
  en_cours: { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' },
  traite: { bg: '#dcfce7', text: '#15803d', border: '#22c55e' },
  rejete: { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
};

const NEXT_STATUS: Record<IdeaStatus, IdeaStatus | null> = {
  nouveau: 'en_cours',
  en_cours: 'traite',
  traite: null,
  rejete: null,
};

export default function SuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [toast, setToast] = useState('');

  useEffect(() => {
    suggestionsApi.list().then((r) => {
      setSuggestions(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const updateStatut = async (id: string, statut: IdeaStatus) => {
    try {
      await suggestionsApi.updateStatut(id, statut);
      setSuggestions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, statut } : s))
      );
      showToast(`Statut mis à jour : ${STATUS_LABELS[statut]}`);
    } catch {
      showToast('Erreur lors de la mise à jour');
    }
  };

  const filteredSuggestions = useMemo(() => {
    if (filterStatut === 'all') return suggestions;
    return suggestions.filter((s) => s.statut === filterStatut);
  }, [suggestions, filterStatut]);

  if (loading) return <div style={{ color: 'var(--color-text-muted)', padding: '32px' }}>Chargement des suggestions...</div>;

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

      {/* ── Header Carte Suggestions ── */}
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
            background: '#E8F5E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18H15M10 22H14M12 2C8.13 2 5 5.13 5 9C5 11.38 6.19 13.47 8 14.74V17C8 17.55 8.45 18 9 18H15C15.55 18 16 17.55 16 17V14.74C17.81 13.47 19 11.38 19 9C19 5.13 15.87 2 12 2Z" stroke="#02302D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#02302D', margin: 0 }}>
              Suggestions & Idées Clients ({filteredSuggestions.length})
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.88rem', marginTop: '2px', margin: 0 }}>
              Idées d'amélioration proposées directement par vos clients en agence.
            </p>
          </div>
        </div>
      </div>

      {/* Filtre par statut */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {[
          { key: 'all', label: 'Toutes' },
          { key: 'nouveau', label: 'Nouveau' },
          { key: 'en_cours', label: 'En cours' },
          { key: 'traite', label: 'Traité' },
          { key: 'rejete', label: 'Rejeté' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatut(key)}
            style={{
              padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600,
              background: filterStatut === key ? 'var(--color-primary)' : 'white',
              color: filterStatut === key ? 'white' : '#64748b',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Liste des Suggestions */}
      {filteredSuggestions.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Aucune suggestion dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSuggestions.map((s) => {
            const style = STATUS_STYLE[s.statut] || { bg: '#f1f5f9', text: '#475569', border: '#94a3b8' };
            const nextStatut = NEXT_STATUS[s.statut];

            return (
              <div key={s.id} style={{
                background: 'white', borderRadius: '12px', padding: '20px 24px',
                boxShadow: 'var(--shadow)', borderLeft: `5px solid ${style.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.6, marginBottom: '12px' }}>
                      "{s.contenu}"
                    </p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{
                        background: style.bg, color: style.text, border: `1px solid ${style.border}`,
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        {STATUS_LABELS[s.statut]}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        Soumis le {new Date(s.date_soumission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {nextStatut && (
                      <button
                        onClick={() => updateStatut(s.id, nextStatut)}
                        style={{
                          background: 'var(--color-primary)', color: 'white',
                          border: 'none', borderRadius: '6px', padding: '7px 14px',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        → {STATUS_LABELS[nextStatut]}
                      </button>
                    )}
                    {s.statut === 'nouveau' && (
                      <button
                        onClick={() => updateStatut(s.id, 'rejete')}
                        style={{
                          background: '#fee2e2', color: '#dc2626',
                          border: 'none', borderRadius: '6px', padding: '7px 14px',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        ✕ Rejeter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
