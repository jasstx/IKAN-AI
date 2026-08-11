import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { dashboardApi, alertesApi } from '../../services/api';
import type { DashboardSiege, Alerte } from '../../types';

// ── Types enrichis ─────────────────────────────────────
interface ThemeStats { theme: string; count: number; pourcentage: number; }
interface SentimentStats { sentiment: string; count: number; pourcentage: number; }
interface DashboardSiegeFull extends DashboardSiege {
  themes_globaux: ThemeStats[];
  sentiments_globaux: SentimentStats[];
  nombre_discordances: number;
  nombre_critiques: number;
}

// ── Constantes Design ──────────────────────────────────
const SENTIMENT_COLORS: Record<string, string> = {
  positif: '#22c55e',
  neutre: '#f59e0b',
  negatif: '#ef4444',
};

const THEME_LABELS: Record<string, string> = {
  accueil: '🤝 Accueil',
  attente: '⏱ Attente',
  digital: '📱 Digital',
  infrastructure: '🏗 Infrastructure',
  communication: '💬 Communication',
  autre: '📌 Autre',
};

const AGENCE_COLOR = (taux: number) =>
  taux >= 80 ? '#22c55e' : taux >= 60 ? '#f59e0b' : '#ef4444';

// ── KPI Card ───────────────────────────────────────────
function KPICard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color?: string; icon?: string;
}) {
  return (
    <div style={{
      background: color || 'var(--color-primary)',
      borderRadius: 'var(--radius)', padding: '20px 24px',
      color: 'white', flex: 1, minWidth: '160px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    }}>
      {icon && <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{icon}</div>}
      <div style={{ fontSize: '0.78rem', opacity: 0.85, marginBottom: '4px', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.73rem', opacity: 0.75, marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

// ── Section Container ──────────────────────────────────
function SectionCard({ title, children, height }: { title: string; children: React.ReactNode; height?: number }) {
  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: '20px 24px', boxShadow: 'var(--shadow)' }}>
      <h3 style={{ marginBottom: '18px', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{title}</h3>
      {height ? <div style={{ height }}>{children}</div> : children}
    </div>
  );
}

// ── Custom Tooltip Recharts ────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '0.85rem' }}>
      <p style={{ fontWeight: 600, marginBottom: '4px', color: '#1e293b' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name} : <strong>{p.value}{typeof p.value === 'number' && p.name !== 'Feedbacks' ? '%' : ''}</strong></p>
      ))}
    </div>
  );
};

export default function DashboardSiegePage() {
  const [data, setData] = useState<DashboardSiegeFull | null>(null);
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [jours, setJours] = useState(30);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'carte' | 'tendances'>('overview');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([dashboardApi.siege(jours), alertesApi.list()])
      .then(([d, a]) => {
        setData(d.data as DashboardSiegeFull);
        setAlertes(a.data);
      })
      .finally(() => setLoading(false));
  }, [jours]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'var(--color-text-muted)' }}>Chargement des données...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!data) return <div style={{ padding: '32px' }}>Aucune donnée disponible</div>;

  const agencesAvecCoords = data.agences.filter(a => a.latitude && a.longitude);

  // Centre de la carte (centroïde des agences)
  const centerLat = agencesAvecCoords.length > 0
    ? agencesAvecCoords.reduce((s, a) => s + (a.latitude || 0), 0) / agencesAvecCoords.length
    : 34.0;
  const centerLng = agencesAvecCoords.length > 0
    ? agencesAvecCoords.reduce((s, a) => s + (a.longitude || 0), 0) / agencesAvecCoords.length
    : 9.0;

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-btn { padding: 8px 18px; border: none; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 0.88rem; font-weight: 600; transition: all 0.15s; }
        .tab-btn.active { background: var(--color-primary); color: white; }
        .tab-btn:not(.active) { background: white; color: #64748b; border: 1px solid #e2e8f0; }
        .tab-btn:not(.active):hover { background: #f8fafc; }
      `}</style>

      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>📊 Vue Siège</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Pilotage global de l'expérience client — {data.periode}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={jours}
            onChange={(e) => setJours(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontFamily: 'inherit', fontSize: '0.88rem', cursor: 'pointer' }}
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
            <option value={365}>12 derniers mois</option>
          </select>
        </div>
      </div>

      {/* ── Alertes ────────────────────────────────────── */}
      {alertes.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alertes.map((a, i) => (
            <div key={i} style={{
              background: '#fff7ed', border: '1px solid #fb923c', borderLeft: '4px solid #f97316',
              borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#7c2d12' }}>{a.message}</span>
                <span style={{ marginLeft: '12px', fontSize: '0.78rem', color: '#c2410c' }}>
                  Taux actuel : <strong>{a.taux_actuel}%</strong> | Seuil : <strong>{a.seuil}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── KPIs Globaux ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <KPICard icon="💬" label="Feedbacks reçus" value={data.feedbacks_total} sub={data.periode} />
        <KPICard icon="😊" label="Satisfaction globale" value={`${data.taux_satisfaction_global}%`} color="var(--color-primary-dark)" />
        <KPICard icon="💡" label="Idées en attente" value={data.idees_en_attente} color="#0ea5e9" />
        <KPICard icon="🏪" label="Agences actives" value={data.agences_actives} color="#6366f1" />
        <KPICard icon="🚨" label="Cas critiques" value={data.nombre_critiques} color="#dc2626" sub="Feedbacks urgents" />
        <KPICard icon="⚡" label="Discordances" value={data.nombre_discordances} color="#d97706" sub="Note ≠ Commentaire" />
      </div>

      {/* ── Tabs Navigation ────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { key: 'overview', label: '📈 Vue d\'ensemble' },
          { key: 'carte', label: '🗺️ Carte des agences' },
          { key: 'tendances', label: '📊 Thèmes & Tendances' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn${activeTab === key ? ' active' : ''}`}
            onClick={() => setActiveTab(key as any)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Vue d'ensemble ─────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Tendance satisfaction */}
            <SectionCard title="📈 Tendance de satisfaction globale">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.tendances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="taux" name="Satisfaction" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="nombre_feedbacks" name="Feedbacks" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* Répartition des sentiments — Donut */}
            <SectionCard title="🎭 Répartition des sentiments">
              {data.sentiments_globaux.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.sentiments_globaux}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        dataKey="count"
                        nameKey="sentiment"
                      >
                        {data.sentiments_globaux.map((entry) => (
                          <Cell key={entry.sentiment} fill={SENTIMENT_COLORS[entry.sentiment] || '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number, name: string) => [`${v} feedbacks`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {data.sentiments_globaux.map((s) => (
                      <div key={s.sentiment} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: SENTIMENT_COLORS[s.sentiment] || '#94a3b8' }} />
                        <span style={{ textTransform: 'capitalize' }}>{s.sentiment}</span>
                        <strong>{s.pourcentage}%</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', paddingTop: '40px', fontSize: '0.88rem' }}>
                  Pas encore de données d'analyse IA.
                </div>
              )}
            </SectionCard>
          </div>

          {/* Comparatif agences */}
          <SectionCard title="🏪 Comparatif satisfaction par agence">
            <ResponsiveContainer width="100%" height={Math.max(200, data.agences.length * 40)}>
              <BarChart data={data.agences} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="agence_nom" type="category" tick={{ fontSize: 10 }} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="taux_satisfaction" name="Satisfaction" radius={[0, 6, 6, 0]}>
                  {data.agences.map((a) => (
                    <Cell key={a.agence_id} fill={AGENCE_COLOR(a.taux_satisfaction)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>

          {/* Tableau détaillé */}
          <SectionCard title="📋 Détail par agence">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Agence', 'Ville', 'Feedbacks', 'Satisfaction', 'Négatifs', 'Suggestions'].map((h) => (
                    <th key={h} style={{ textAlign: h === 'Agence' || h === 'Ville' ? 'left' : 'right', padding: '10px 12px', color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.agences.map((a) => (
                  <tr key={a.agence_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{a.agence_nom}</td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>{a.ville || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{a.nombre_feedbacks}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: AGENCE_COLOR(a.taux_satisfaction) }}>
                        {a.taux_satisfaction}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ef4444' }}>{a.nombre_negatifs}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0ea5e9' }}>{a.nombre_suggestions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      )}

      {/* ── TAB: Carte des agences ──────────────────────── */}
      {activeTab === 'carte' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SectionCard title="🗺️ Carte géographique des agences">
            {agencesAvecCoords.length > 0 ? (
              <>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <MapContainer
                    center={[centerLat, centerLng]}
                    zoom={7}
                    style={{ height: '480px', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    {agencesAvecCoords.map((a) => (
                      <CircleMarker
                        key={a.agence_id}
                        center={[a.latitude!, a.longitude!]}
                        radius={Math.max(10, a.nombre_feedbacks / 2)}
                        fillColor={AGENCE_COLOR(a.taux_satisfaction)}
                        color="white"
                        weight={2}
                        fillOpacity={0.85}
                      >
                        <Popup>
                          <div style={{ minWidth: '160px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>{a.agence_nom}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.ville}</div>
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                              <div>📊 Satisfaction : <strong style={{ color: AGENCE_COLOR(a.taux_satisfaction) }}>{a.taux_satisfaction}%</strong></div>
                              <div>💬 Feedbacks : <strong>{a.nombre_feedbacks}</strong></div>
                              <div>😞 Négatifs : <strong>{a.nombre_negatifs}</strong></div>
                              <div>💡 Suggestions : <strong>{a.nombre_suggestions}</strong></div>
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
                {/* Légende */}
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                  {[
                    { color: '#22c55e', label: '≥ 80% — Excellent' },
                    { color: '#f59e0b', label: '60-80% — À surveiller' },
                    { color: '#ef4444', label: '< 60% — Critique' },
                  ].map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', color: '#475569' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗺️</div>
                <div>Aucune agence avec coordonnées géographiques.</div>
                <div style={{ marginTop: '6px', fontSize: '0.8rem' }}>Ajoutez les coordonnées (latitude/longitude) depuis la gestion des agences.</div>
              </div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── TAB: Thèmes & Tendances ─────────────────────── */}
      {activeTab === 'tendances' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Thèmes dominants */}
            <SectionCard title="🏷️ Thèmes récurrents (toutes agences)">
              {data.themes_globaux.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {data.themes_globaux.map((t, i) => (
                    <div key={t.theme}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 600 }}>{THEME_LABELS[t.theme] || t.theme}</span>
                        <span style={{ color: '#64748b' }}>{t.count} avis ({t.pourcentage}%)</span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '4px',
                          background: `hsl(${160 - i * 20}, 65%, 45%)`,
                          width: `${t.pourcentage}%`,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '40px', fontSize: '0.88rem' }}>
                  Pas encore de données de classification thématique.
                </div>
              )}
            </SectionCard>

            {/* Répartition sentiments (histogramme) */}
            <SectionCard title="🎭 Sentiments détectés (toutes agences)">
              {data.sentiments_globaux.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.sentiments_globaux} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="sentiment" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number, name: string, props: any) => [`${v} (${props.payload.pourcentage}%)`, 'Feedbacks']} />
                    <Bar dataKey="count" name="Feedbacks" radius={[6, 6, 0, 0]}>
                      {data.sentiments_globaux.map((s) => (
                        <Cell key={s.sentiment} fill={SENTIMENT_COLORS[s.sentiment] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '60px', fontSize: '0.88rem' }}>
                  Pas encore de données.
                </div>
              )}
            </SectionCard>
          </div>

          {/* Tendance détaillée */}
          <SectionCard title="📈 Évolution détaillée de la satisfaction">
            {data.tendances.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.tendances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="taux" name="Satisfaction %" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="nombre_feedbacks" name="Feedbacks" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', paddingTop: '60px', fontSize: '0.88rem' }}>
                Pas encore de données sur la période sélectionnée.
              </div>
            )}
          </SectionCard>

          {/* Alertes actuelles */}
          {alertes.length > 0 && (
            <SectionCard title="⚠️ Agences en alerte">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alertes.map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: '#fff7ed', border: '1px solid #fb923c',
                    borderRadius: '8px', fontSize: '0.88rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>⚠️</span>
                      <span style={{ fontWeight: 600 }}>{a.agence_nom}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', color: '#7c2d12' }}>
                      <span>Taux actuel : <strong style={{ color: '#dc2626' }}>{a.taux_actuel}%</strong></span>
                      <span>Seuil : <strong>{a.seuil}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}
