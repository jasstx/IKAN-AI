/**
 * Service API — axios instance avec gestion des erreurs et base URL.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // Envoie les cookies HTTP-only
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les 401 (session expirée)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Rediriger vers la page de login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ── Dashboard ─────────────────────────────────────────
export const dashboardApi = {
  agence: (agenceId: string, jours = 30) =>
    api.get(`/dashboard/agence/${agenceId}?jours=${jours}`),
  siege: (jours = 30) =>
    api.get(`/dashboard/siege?jours=${jours}`),
};

// ── Feedbacks ─────────────────────────────────────────
export const feedbacksApi = {
  list: (params?: { agence_id?: string; limit?: number; offset?: number }) =>
    api.get('/feedbacks/', { params }),
  traiterDemandeContact: (contactId: string) =>
    api.patch(`/feedbacks/demandes-contact/${contactId}/traiter`),
};

// ── Suggestions ───────────────────────────────────────
export const suggestionsApi = {
  list: () => api.get('/suggestions/'),
  updateStatut: (id: string, statut: string, commentaire?: string) =>
    api.patch(`/suggestions/${id}/statut`, { statut, commentaire }),
};

// ── Recommandations ───────────────────────────────────
export const recommandationsApi = {
  listAgence: (agenceId: string) =>
    api.get(`/recommandations/agences/${agenceId}`),
  marquerTraitee: (id: string) =>
    api.patch(`/recommandations/${id}/traiter`),
};

// ── Alertes ───────────────────────────────────────────
export const alertesApi = {
  list: () => api.get('/alertes/'),
  updateSeuil: (agenceId: string, seuil: number) =>
    api.patch(`/alertes/agences/${agenceId}/seuil`, { seuil_alerte: seuil }),
};

// ── Organisations ─────────────────────────────────────
export const organisationsApi = {
  list: () => api.get('/organisations/'),
  create: (data: object) => api.post('/organisations/', data),
  update: (id: string, data: object) => api.patch(`/organisations/${id}`, data),
  delete: (id: string) => api.delete(`/organisations/${id}`),
};

// ── Agences ───────────────────────────────────────────
export const agencesApi = {
  list: () => api.get('/agences/'),
  create: (orgId: string, data: object) => api.post('/agences/', data, { params: orgId ? { org_id: orgId } : undefined }),
  update: (id: string, data: object) => api.patch(`/agences/${id}`, data),
  delete: (id: string) => api.delete(`/agences/${id}`),
  updateSeuil: (id: string, seuil: number) => api.patch(`/agences/${id}`, { seuil_alerte: seuil }),
};

// ── Utilisateurs ──────────────────────────────────────
export const utilisateursApi = {
  list: () => api.get('/utilisateurs/'),
  create: (data: object) => api.post('/utilisateurs/', data),
  update: (id: string, data: object) => api.patch(`/utilisateurs/${id}`, data),
  delete: (id: string) => api.delete(`/utilisateurs/${id}`),
};

// ── Système (Settings & Permissions) ──────────────────
export const systemApi = {
  getSettings: () => api.get('/system/settings'),
  updateSettings: (data: object) => api.patch('/system/settings', data),
  getPermissions: () => api.get('/system/permissions'),
};

