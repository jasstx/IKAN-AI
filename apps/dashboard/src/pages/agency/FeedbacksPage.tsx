import React, { useEffect, useState, useMemo } from 'react';
import { feedbacksApi, agencesApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { Feedback, Agence } from '../../types';

const STAR_MAP = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];
const NOTE_COLOR: Record<number, string> = { 1: '#dc2626', 2: '#ea580c', 3: '#d97706', 4: '#16a34a', 5: '#15803d' };

const SENTIMENT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  positif: { bg: '#dcfce7', text: '#15803d', label: '😊 Positif' },
  neutre: { bg: '#fef3c7', text: '#b45309', label: '😐 Neutre' },
  negatif: { bg: '#fee2e2', text: '#b91c1c', label: '🙁 Négatif' },
};

const CRITICITE_STYLE: Record<string, { bg: string; text: string }> = {
  faible: { bg: '#f1f5f9', text: '#475569' },
  moyenne: { bg: '#e0f2fe', text: '#0369a1' },
  elevee: { bg: '#ffedd5', text: '#c2410c' },
  critique: { bg: '#fecdd3', text: '#be123c' },
};

const THEME_LABELS: Record<string, string> = {
  accueil: '🤝 Accueil',
  attente: '⏱ Attente',
  digital: '📱 Digital',
  infrastructure: '🏗 Infrastructure',
  communication: '💬 Communication',
  autre: '📌 Autre',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  background: 'white',
  fontFamily: 'inherit',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export default function FeedbacksPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isCXOrAdmin = currentUser?.role === 'cx_manager' || currentUser?.role === 'admin';

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState('');

  // Filtres
  const [selectedAgenceId, setSelectedAgenceId] = useState<string>('all');
  const [filterNote, setFilterNote] = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterTheme, setFilterTheme] = useState<string>('all');
  const [filterSpecial, setFilterSpecial] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setFetchError(null);
      try {
        const fRes = await feedbacksApi.list({ limit: 200 });
        if (!cancelled) {
          setFeedbacks(fRes?.data || []);
        }

        if (isCXOrAdmin) {
          try {
            const aRes = await agencesApi.list();
            if (!cancelled && aRes?.data) {
              setAgences(aRes.data);
            }
          } catch (aErr) {
            console.warn('Erreur chargement des agences:', aErr);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Erreur chargement des feedbacks:', err);
          setFetchError('Impossible de charger les feedbacks. Veuillez vérifier la connexion API.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [isCXOrAdmin, refreshTrigger]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleTraiterContact = async (contactId: string) => {
    if (!contactId) return;
    try {
      await feedbacksApi.traiterDemandeContact(contactId);
      setFeedbacks((prev) =>
        prev.map((f) => {
          if (f.demande_contact && f.demande_contact.id === contactId) {
            return {
              ...f,
              demande_contact: { ...f.demande_contact, traitee: true },
            };
          }
          return f;
        })
      );
      showToast('✅ Client marqué comme recontacté');
    } catch {
      showToast('❌ Erreur lors du traitement');
    }
  };

  // Filtrage combiné
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      if (filterNote !== 'all' && f.note !== Number(filterNote)) return false;
      if (filterSentiment !== 'all' && f.analyse_ia?.sentiment !== filterSentiment) return false;
      if (filterTheme !== 'all' && f.analyse_ia?.theme_principal !== filterTheme) return false;
      if (filterSpecial === 'discordance' && !f.analyse_ia?.discordance_detectee) return false;
      if (filterSpecial === 'contact' && (!f.demande_contact || f.demande_contact.traitee)) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const text = (f.commentaire || '').toLowerCase();
        const contactName = (f.demande_contact?.nom || '').toLowerCase();
        if (!text.includes(query) && !contactName.includes(query)) return false;
      }
      return true;
    });
  }, [feedbacks, filterNote, filterSentiment, filterTheme, filterSpecial, search]);

  // Statistiques rapides
  const stats = useMemo(() => {
    const total = feedbacks.length;
    const positifs = feedbacks.filter((f) => f.analyse_ia?.sentiment === 'positif').length;
    const negatifs = feedbacks.filter((f) => f.analyse_ia?.sentiment === 'negatif').length;
    const contactsEnAttente = feedbacks.filter((f) => f.demande_contact && !f.demande_contact.traitee).length;
    return { total, positifs, negatifs, contactsEnAttente };
  }, [feedbacks]);

  const handleAgenceFilterChange = async (agenceId: string) => {
    setLoading(true);
    try {
      const params = agenceId !== 'all' ? { agence_id: agenceId, limit: 200 } : { limit: 200 };
      const r = await feedbacksApi.list(params);
      setFeedbacks(r.data || []);
      setSelectedAgenceId(agenceId);
    } catch (err) {
      console.error('Erreur filtrage agence:', err);
      showToast('❌ Erreur lors du filtrage par agence');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--color-text-muted)', padding: '32px' }}>Chargement des feedbacks...</div>;

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

      {/* Bandeau d'erreur de chargement initial */}
      {fetchError && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
          borderRadius: '12px', padding: '16px 20px', marginBottom: '24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <strong>⚠️ Erreur de connexion : </strong> {fetchError}
          </div>
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            style={{
              background: '#dc2626', color: 'white', border: 'none',
              borderRadius: '6px', padding: '8px 16px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem',
            }}
          >
            🔄 Réessayer
          </button>
        </div>
      )}

      {/* ── Header Carte Feedbacks ── */}
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
              <path d="M21 15A2 2 0 0 1 19 17H7L3 21V5A2 2 0 0 1 5 3H19A2 2 0 0 1 21 5V15Z" stroke="#02302D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#02302D', margin: 0 }}>
              Feedbacks Clients ({filteredFeedbacks.length})
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.88rem', marginTop: '2px', margin: 0 }}>
              {isCXOrAdmin
                ? 'Supervision globale des avis clients sur l\'ensemble des agences de votre organisation.'
                : 'Consultation et suivi des avis soumis dans votre agence.'}
            </p>
          </div>
        </div>
      </div>

      {/* Mini-statistiques */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', padding: '14px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, minWidth: '140px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total avis</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.total}</div>
        </div>
        <div style={{ background: 'white', padding: '14px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, minWidth: '140px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Positifs 😊</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{stats.positifs}</div>
        </div>
        <div style={{ background: 'white', padding: '14px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, minWidth: '140px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Négatifs 🙁</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{stats.negatifs}</div>
        </div>
        <div style={{ background: 'white', padding: '14px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, minWidth: '140px' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Rappels à faire 📞</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stats.contactsEnAttente > 0 ? '#d97706' : '#16a34a' }}>
            {stats.contactsEnAttente}
          </div>
        </div>
      </div>

      {/* Barre de Filtres */}
      <div style={{
        background: 'white', padding: '16px 20px', borderRadius: '12px',
        boxShadow: 'var(--shadow)', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="🔍 Rechercher dans le texte ou nom client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...selectStyle, flex: 2, minWidth: '200px' }}
        />

        {/* Filtre par Agence (si CX Manager ou Admin) */}
        {isCXOrAdmin && agences.length > 0 && (
          <select value={selectedAgenceId} onChange={(e) => handleAgenceFilterChange(e.target.value)} style={{ ...selectStyle, fontWeight: 600, borderColor: 'var(--color-primary)' }}>
            <option value="all">🏬 Toutes les agences ({agences.length})</option>
            {agences.map((a) => (
              <option key={a.id} value={a.id}>📍 {a.nom}</option>
            ))}
          </select>
        )}

        <select value={filterNote} onChange={(e) => setFilterNote(e.target.value)} style={selectStyle}>
          <option value="all">Toutes les notes</option>
          <option value="5">5 étoiles (★★★★★)</option>
          <option value="4">4 étoiles (★★★★)</option>
          <option value="3">3 étoiles (★★★)</option>
          <option value="2">2 étoiles (★★)</option>
          <option value="1">1 étoile (★)</option>
        </select>

        <select value={filterSentiment} onChange={(e) => setFilterSentiment(e.target.value)} style={selectStyle}>
          <option value="all">Tous les sentiments</option>
          <option value="positif">😊 Positif</option>
          <option value="neutre">😐 Neutre</option>
          <option value="negatif">🙁 Négatif</option>
        </select>

        <select value={filterTheme} onChange={(e) => setFilterTheme(e.target.value)} style={selectStyle}>
          <option value="all">Tous les thèmes</option>
          <option value="accueil">🤝 Accueil</option>
          <option value="attente">⏱ Attente</option>
          <option value="digital">📱 Digital</option>
          <option value="infrastructure">🏗 Infrastructure</option>
          <option value="communication">💬 Communication</option>
        </select>

        {/* Filtre Spécial (Discordances / Rappels) */}
        <select
          value={filterSpecial}
          onChange={(e) => setFilterSpecial(e.target.value)}
          style={{
            ...selectStyle,
            fontWeight: filterSpecial !== 'all' ? 700 : 400,
            borderColor: filterSpecial !== 'all' ? '#ea580c' : '#e2e8f0',
            background: filterSpecial !== 'all' ? '#fff7ed' : 'white',
          }}
        >
          <option value="all">🎯 Tous les cas</option>
          <option value="discordance">⚡ Discordances uniquement</option>
          <option value="contact">📞 Rappels client en attente</option>
        </select>
      </div>

      {/* Banner Agence Sélectionnée */}
      {selectedAgenceId !== 'all' && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px',
          padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#166534' }}>
              🏬 Agence : {agences.find(a => a.id === selectedAgenceId)?.nom || selectedAgenceId}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#15803d', marginTop: '2px' }}>
              Affichage détaillé des avis pour cette agence ({filteredFeedbacks.length} avis répertoriés)
            </div>
          </div>
          <button
            onClick={() => handleAgenceFilterChange('all')}
            style={{
              background: 'white', border: '1px solid #86efac', color: '#166534',
              borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            ✕ Voir toutes les agences
          </button>
        </div>
      )}

      {/* Liste des Feedbacks */}
      {filteredFeedbacks.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Aucun feedback ne correspond aux filtres sélectionnés.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredFeedbacks.map((f) => {
            const sentimentInfo = f.analyse_ia ? SENTIMENT_STYLE[f.analyse_ia.sentiment] : null;
            const criticiteInfo = f.analyse_ia ? CRITICITE_STYLE[f.analyse_ia.criticite] : null;
            const themeLabel = f.analyse_ia?.theme_principal ? THEME_LABELS[f.analyse_ia.theme_principal] || f.analyse_ia.theme_principal : null;
            const noteStars = STAR_MAP[f.note] || '★'.repeat(Math.max(1, Math.min(5, f.note || 1)));
            const noteColor = NOTE_COLOR[f.note] || '#94a3b8';

            return (
              <div key={f.id} style={{
                background: 'white', borderRadius: '12px', padding: '20px 24px',
                boxShadow: 'var(--shadow)', borderLeft: `5px solid ${noteColor}`,
              }}>
                {/* Ligne Supérieure : Note, Date, Badges IA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Badge Agence (Visible pour CX Manager et Admin) */}
                    {f.agence_nom && (
                      <span style={{
                        background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc',
                        padding: '4px 11px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700,
                      }}>
                        🏪 Agence {f.agence_nom}
                      </span>
                    )}

                    <span style={{ fontSize: '1.2rem', color: noteColor, fontWeight: 800 }}>
                      {noteStars} ({f.note}/5)
                    </span>

                    {/* Sentiment Badge */}
                    {sentimentInfo && (
                      <span style={{
                        background: sentimentInfo.bg, color: sentimentInfo.text,
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700,
                      }}>
                        {sentimentInfo.label}
                      </span>
                    )}

                    {/* Theme Badge */}
                    {themeLabel && (
                      <span style={{
                        background: '#f1f5f9', color: '#334155',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600,
                      }}>
                        {themeLabel}
                      </span>
                    )}

                    {/* Criticité Badge */}
                    {criticiteInfo && f.analyse_ia?.criticite !== 'faible' && (
                      <span style={{
                        background: criticiteInfo.bg, color: criticiteInfo.text,
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                        textTransform: 'uppercase',
                      }}>
                        Criticité {f.analyse_ia?.criticite}
                      </span>
                    )}

                    {/* Alert Discordance */}
                    {f.analyse_ia?.discordance_detectee && (
                      <span style={{
                        background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        ⚡ Discordance (Note 5/5 mais commentaire très négatif)
                      </span>
                    )}
                  </div>

                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {formatDate(f.date_soumission)}
                  </span>
                </div>

                {/* Commentaire client */}
                {f.commentaire ? (
                  <p style={{ fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.6, margin: '8px 0 12px', fontStyle: 'italic', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                    "{f.commentaire}"
                  </p>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', margin: '4px 0 12px' }}>
                    Aucun commentaire rédigé par le client.
                  </p>
                )}

                {/* Bloc Demande de Contact Client */}
                {f.demande_contact && (
                  <div style={{
                    marginTop: '14px', padding: '14px 18px', borderRadius: '8px',
                    background: f.demande_contact.traitee ? '#f0fdf4' : '#fff7ed',
                    border: `1px solid ${f.demande_contact.traitee ? '#bbf7d0' : '#ffedd5'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: f.demande_contact.traitee ? '#166534' : '#c2410c', marginBottom: '4px' }}>
                        📞 Demande de Recontact Client
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#334155' }}>
                        <strong>{f.demande_contact.nom || 'Client Anonyme'}</strong> — Tel : <strong>{f.demande_contact.telephone || 'Non renseigné'}</strong> | Email : {f.demande_contact.email || 'Non renseigné'}
                      </div>
                    </div>

                    {f.demande_contact.traitee ? (
                      <span style={{
                        background: '#dcfce7', color: '#15803d', padding: '4px 12px',
                        borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                      }}>
                        ✓ Recontacté
                      </span>
                    ) : (
                      <button
                        onClick={() => f.demande_contact?.id && handleTraiterContact(f.demande_contact.id)}
                        style={{
                          background: '#ea580c', color: 'white', border: 'none',
                          borderRadius: '6px', padding: '6px 14px', cursor: 'pointer',
                          fontFamily: 'inherit', fontWeight: 600, fontSize: '0.82rem',
                        }}
                      >
                        ✓ Marquer comme recontacté
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

