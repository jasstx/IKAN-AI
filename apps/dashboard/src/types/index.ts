// Types TypeScript pour IKAN AI Dashboard

export type UserRole = 'admin' | 'cx_manager' | 'agency_manager';
export type SentimentType = 'positif' | 'neutre' | 'negatif';
export type CriticiteType = 'faible' | 'moyenne' | 'elevee' | 'critique';
export type IdeaStatus = 'nouveau' | 'en_cours' | 'traite' | 'rejete';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  organisation_id: string;
  agence_id?: string;
}

export interface Organisation {
  id: string;
  nom: string;
  secteur: string;
  email: string;
  telephone?: string;
  active: boolean;
  date_creation: string;
}

export interface Agence {
  id: string;
  organisation_id: string;
  nom: string;
  adresse?: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
  active: boolean;
  seuil_alerte: number;
  date_creation: string;
  qr_code_token?: string;
  qr_code_url?: string;
}

export interface DemandeContact {
  id: string;
  nom?: string;
  telephone?: string;
  email?: string;
  souhaite_etre_rappele: boolean;
  traitee: boolean;
}

export interface Feedback {
  id: string;
  qr_code_id: string;
  agence_id?: string;
  agence_nom?: string;
  note: number;
  commentaire?: string;
  date_soumission: string;
  analyse_ia?: {
    id: string;
    sentiment: SentimentType;
    criticite: CriticiteType;
    theme_principal?: string;
    discordance_detectee: boolean;
    score_sentiment?: number;
  };
  demande_contact?: DemandeContact;
}

export interface AnalyseIA {
  id: string;
  feedback_id: string;
  sentiment: SentimentType;
  criticite: CriticiteType;
  theme_principal?: string;
  discordance_detectee: boolean;
  score_sentiment?: number;
  date_analyse: string;
}

export interface Suggestion {
  id: string;
  feedback_id: string;
  contenu: string;
  statut: IdeaStatus;
  date_soumission: string;
  date_traitement?: string;
  notes_internes?: string;
}

export interface Recommandation {
  id: string;
  analyse_ia_id: string;
  contenu: string;
  priorite: PriorityLevel;
  date_generation: string;
  traitee: boolean;
}

export interface KPIAgence {
  agence_id: string;
  agence_nom: string;
  ville?: string;
  taux_satisfaction: number;
  nombre_feedbacks: number;
  nombre_negatifs: number;
  nombre_suggestions: number;
  latitude?: number;
  longitude?: number;
}

export interface TendanceSatisfaction {
  date: string;
  taux: number;
  nombre_feedbacks: number;
}

export interface DashboardAgence {
  agence_id: string;
  agence_nom: string;
  periode: string;
  taux_satisfaction: number;
  nombre_feedbacks: number;
  nombre_negatifs: number;
  nombre_critiques: number;
  nombre_suggestions: number;
  tendances: TendanceSatisfaction[];
  themes: { theme: string; count: number; pourcentage: number }[];
  discordances: number;
}

export interface DashboardSiege {
  organisation_id: string;
  periode: string;
  feedbacks_total: number;
  taux_satisfaction_global: number;
  idees_en_attente: number;
  agences_actives: number;
  agences: KPIAgence[];
  tendances: TendanceSatisfaction[];
  themes_globaux: { theme: string; count: number; pourcentage: number }[];
  sentiments_globaux: { sentiment: string; count: number; pourcentage: number }[];
  nombre_discordances: number;
  nombre_critiques: number;
}

export interface Alerte {
  agence_id: string;
  agence_nom: string;
  taux_actuel: number;
  seuil: number;
  message: string;
}
