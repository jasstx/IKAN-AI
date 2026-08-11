import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi, recommandationsApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { DashboardAgence, Recommandation } from '../../types';

const THEME_COLORS = ['#1a5c45', '#d97706', '#2563eb', '#7c3aed', '#16a34a', '#dc2626'];

const PRIORITE_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  critical: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', label: 'CRITIQUE' },
  high: { bg: '#fff7ed', border: '#f97316', text: '#c2410c', label: 'ÉLEVÉE' },
  medium: { bg: '#fefce8', border: '#eab308', text: '#a16207', label: 'MOYENNE' },
  low: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', label: 'FAIBLE' },
};

function KPICard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: string;
}) {
  return (
    <div style={{
      background: color || 'var(--color-primary)',
      borderRadius: 'var(--radius)', padding: '18px 22px',
      color: 'white', flex: 1, minWidth: '140px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      {icon && <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{icon}</div>}
      <div style={{ fontSize: '0.75rem', opacity: 0.85, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardAgencePage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardAgence | null>(null);
  const [recos, setRecos] = useState<Recommandation[]>([]);
  const [jours, setJours] = useState(30);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const agenceId = user?.agence_id;

  useEffect(() => {
    if (!agenceId) return;
    setLoading(true);
    Promise.all([
      dashboardApi.agence(agenceId, jours),
      recommandationsApi.listAgence(agenceId),
    ]).then(([d, r]) => {
      setData(d.data);
      setRecos(r.data);
    }).finally(() => setLoading(false));
  }, [agenceId, jours]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const marquerTraitee = async (id: string) => {
    try {
      await recommandationsApi.marquerTraitee(id);
      setRecos((prev) => prev.filter((r) => r.id !== id));
      showToast('✅ Recommandation marquée comme traitée');
    } catch {
      showToast('❌ Erreur lors de la mise à jour');
    }
  };

  if (!agenceId) return (
    <div style={{ padding: '32px', color: 'var(--color-text-muted)' }}>
      Aucune agence rattachée à votre compte utilisateur.
    </div>
  );

  if (loading) return (
    <div style={{ padding: '32px', color: 'var(--color-text-muted)' }}>
      Chargement du tableau de bord d'agence...
    </div>
  );

  if (!data) return <div style={{ padding: '32px' }}>Aucune donnée disponible.</div>;

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

      {/* ── Header Carte Agence (Conforme à l'image UI) ── */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        border: '1px solid #E5E7EB',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
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
              {data.agence_nom}
            </h1>
            <p style={{ color: '#71717A', fontSize: '0.88rem', marginTop: '2px', margin: 0 }}>
              Tableau de bord de votre agence — {jours} derniers jours
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%' }}>
          <select
            value={jours}
            onChange={(e) => setJours(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #E4E4E7',
              background: '#FFFFFF',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              fontWeight: 500,
              color: '#18181B',
              appearance: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
          </select>
          <div style={{
            position: 'absolute',
            right: '18px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#52525B',
            fontSize: '0.75rem',
          }}>
            ▼
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <KPICard icon="💬" label="Feedbacks reçus" value={data.nombre_feedbacks} sub={data.periode} />
        <KPICard icon="😊" label="Taux de satisfaction" value={`${data.taux_satisfaction}%`} color={data.taux_satisfaction >= 80 ? '#16a34a' : data.taux_satisfaction >= 60 ? '#d97706' : '#dc2626'} />
        <KPICard icon="🙁" label="Feedbacks négatifs" value={data.nombre_negatifs} color="#dc2626" />
        <KPICard icon="⚡" label="Discordances" value={data.discordances} color="#d97706" sub="Note haute / Commentaire négatif" />
        <KPICard icon="💡" label="Suggestions" value={data.nombre_suggestions} color="#0ea5e9" />
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Évolution de la satisfaction */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
            📈 Évolution de la satisfaction
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.tendances}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Satisfaction']} />
              <Line type="monotone" dataKey="taux" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Thèmes récurrents */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
            🏷️ Répartition des Thèmes
          </h3>
          {data.themes.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.themes}
                  dataKey="count"
                  nameKey="theme"
                  cx="50%" cy="50%"
                  outerRadius={75}
                  label={({ theme, pourcentage }) => `${theme} ${pourcentage}%`}
                  fontSize={10}
                >
                  {data.themes.map((_, i) => (
                    <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [`${v} avis`, name]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', paddingTop: '60px', fontSize: '0.88rem' }}>
              Aucune donnée thématique sur cette période.
            </div>
          )}
        </div>
      </div>

      {/* Plan d'action & Recommandations IA */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
          🤖 Plan d'action — Recommandations IA ({recos.length})
        </h3>
        {recos.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#16a34a', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            🎉 Aucune recommandation en attente ! Toutes les actions suggérées ont été traitées.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recos.map((r) => {
              const pStyle = PRIORITE_STYLE[r.priorite] || { bg: '#f8fafc', border: '#94a3b8', text: '#475569', label: r.priorite };
              return (
                <div key={r.id} style={{
                  background: pStyle.bg,
                  border: `1px solid ${pStyle.border}`,
                  borderLeft: `5px solid ${pStyle.border}`,
                  borderRadius: '8px',
                  padding: '14px 18px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        background: pStyle.border,
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        marginRight: '10px',
                        display: 'inline-block',
                      }}>
                        PRIORITÉ {pStyle.label}
                      </span>
                      <span style={{ fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.5 }}>
                        {r.contenu}
                      </span>
                    </div>

                    <button
                      onClick={() => marquerTraitee(r.id)}
                      style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ✓ Marquer comme traité
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
