import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { format } from 'date-fns';
import { Users, Calendar, Briefcase, FileText, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Employés Actifs', value: stats.employees, icon: <Users size={22} />, color: '#3B82F6', bg: '#DBEAFE' },
    { label: 'Congés en attente', value: stats.leavesPending, icon: <Clock size={22} />, color: '#F59E0B', bg: '#FEF3C7' },
    { label: 'Congés validés', value: stats.leavesValidated, icon: <TrendingUp size={22} />, color: '#10B981', bg: '#D1FAE5' },
    { label: 'Congés refusés', value: stats.leavesRefused, icon: <TrendingDown size={22} />, color: '#EF4444', bg: '#FEE2E2' },
    { label: 'Missions en attente', value: stats.missionsPending, icon: <Briefcase size={22} />, color: '#8B5CF6', bg: '#EDE9FE' },
    { label: 'Attestations en attente', value: stats.attestPending, icon: <FileText size={22} />, color: '#06B6D4', bg: '#CFFAFE' },
  ] : [];

  const statusBadge = (statut) => {
    const map = {
      'En attente': 'badge-warning',
      'Validé': 'badge-success',
      'Refusé': 'badge-danger',
    };
    return <span className={`badge ${map[statut] || 'badge-info'}`}>{statut}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Bienvenue dans l'espace d'administration Kilani RH
        </span>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card stat-card skeleton" />
          ))
        ) : (
          statCards.map((card, i) => (
            <div key={i} className="card stat-card">
              <div className="stat-icon" style={{ backgroundColor: card.bg, color: card.color }}>
                {card.icon}
              </div>
              <div className="stat-info">
                <span className="stat-label">{card.label}</span>
                <span className="stat-value">{card.value}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Recent Requests Table */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>Dernières Demandes</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Employé</th>
                  <th>Période</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>Chargement...</td></tr>
                ) : stats?.recentRequests?.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aucune demande</td></tr>
                ) : (
                  stats?.recentRequests?.map((req, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={`badge ${req.type_demande === 'Congé' ? 'badge-info' : 'badge-warning'}`}>
                          {req.type_demande}
                        </span>
                      </td>
                      <td>{req.prenom} {req.nom}</td>
                      <td>{req.date_debut ? format(new Date(req.date_debut), 'dd/MM') : '-'} → {req.date_fin ? format(new Date(req.date_fin), 'dd/MM') : '-'}</td>
                      <td>{req.date_creation ? format(new Date(req.date_creation), 'dd/MM/yyyy') : '-'}</td>
                      <td>{statusBadge(req.statut)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>Répartition des Congés</h2>
          {loading ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>
          ) : (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Validés', value: stats?.leavesValidated || 0, color: '#10B981' },
                      { name: 'En attente', value: stats?.leavesPending || 0, color: '#F59E0B' },
                      { name: 'Refusés', value: stats?.leavesRefused || 0, color: '#EF4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: 'Validés', value: stats?.leavesValidated || 0, color: '#10B981' },
                      { name: 'En attente', value: stats?.leavesPending || 0, color: '#F59E0B' },
                      { name: 'Refusés', value: stats?.leavesRefused || 0, color: '#EF4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
