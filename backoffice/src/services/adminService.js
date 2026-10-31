import api from './api';

const adminService = {
  // ── Dashboard ──────────────────────────────────────
  getStats: () => api.get('/admin/stats').then(r => r.data),

  // ── Employees ──────────────────────────────────────
  getEmployees: () => api.get('/admin/employees').then(r => r.data),
  createEmployee: (data) => api.post('/admin/employees', data).then(r => r.data),
  updateEmployee: (matricule, data) => api.put(`/admin/employees/${matricule}`, data).then(r => r.data),
  deleteEmployee: (matricule) => api.delete(`/admin/employees/${matricule}`).then(r => r.data),
  resetPassword: (matricule, newPassword) => api.post(`/admin/employees/${matricule}/reset-password`, { newPassword }).then(r => r.data),

  // ── Services / Managers ─────────────────────────────
  getServices: () => api.get('/admin/services').then(r => r.data),
  getManagers: () => api.get('/admin/managers').then(r => r.data),

  // ── Leave Motifs ────────────────────────────────────
  getLeaveMotifs: () => api.get('/admin/leave-motifs').then(r => r.data),
  createLeaveMotif: (data) => api.post('/admin/leave-motifs', data).then(r => r.data),
  updateLeaveMotif: (id, data) => api.put(`/admin/leave-motifs/${id}`, data).then(r => r.data),
  deleteLeaveMotif: (id) => api.delete(`/admin/leave-motifs/${id}`).then(r => r.data),

  // ── Attestation Types ───────────────────────────────
  getAttestationTypes: () => api.get('/admin/attestation-types').then(r => r.data),
  createAttestationType: (data) => api.post('/admin/attestation-types', data).then(r => r.data),
  updateAttestationType: (id, data) => api.put(`/admin/attestation-types/${id}`, data).then(r => r.data),
  deleteAttestationType: (id) => api.delete(`/admin/attestation-types/${id}`).then(r => r.data),

  // ── Leaves (Consultation) ───────────────────────────
  getLeaves: (filters = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined))
    ).toString();
    return api.get(`/admin/leaves?${params}`).then(r => r.data);
  },

  // ── Missions (Consultation) ─────────────────────────
  getMissions: (filters = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined))
    ).toString();
    return api.get(`/admin/missions?${params}`).then(r => r.data);
  },

  // ── Attestations (Consultation) ──────────────────────
  getAttestations: (filters = {}) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined))
    ).toString();
    return api.get(`/admin/attestations?${params}`).then(r => r.data);
  },

  // ── Paramétrage ──────────────────────────────────────
  updateMonthlyRights: (data) => api.post('/admin/settings/monthly-rights', data).then(r => r.data),
  creditMonthly: () => api.post('/admin/settings/credit-monthly').then(r => r.data),
};

export default adminService;
