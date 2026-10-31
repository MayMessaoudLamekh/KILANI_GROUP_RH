import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { format } from 'date-fns';
import { Download, FileText, X } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import './AdminPage.css';

const MISSION_COLS = [
  { header: 'Matricule', dataKey: 'matricule' },
  { header: 'Employé', dataKey: 'nom', render: (v, r) => `${r.prenom} ${r.nom}` },
  { header: 'Département', dataKey: 'service' },
  { header: 'Objet', dataKey: 'objet' },
  { header: 'Destination', dataKey: 'destination' },
  { header: 'Début', dataKey: 'jour_debut', render: v => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
  { header: 'Fin', dataKey: 'jour_fin', render: v => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
  { header: 'Transport', dataKey: 'moyen_transport' },
  { header: 'Statut', dataKey: 'acceptation_superieur' },
];

export default function Missions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [filters, setFilters] = useState({ statut: '', matricule: '', service: '', superieur: '', periode_debut: '', periode_fin: '' });

  const load = async () => {
    setLoading(true);
    try { setData(await adminService.getMissions(filters)); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([adminService.getServices(), adminService.getEmployees(), adminService.getManagers()])
      .then(([svc, emp, mgr]) => { setServices(svc); setEmployees(emp); setManagers(mgr); });
  }, []);
  useEffect(() => { load(); }, [filters]);

  const resetFilters = () => setFilters({ statut: '', matricule: '', service: '', superieur: '', periode_debut: '', periode_fin: '' });

  const statusBadge = (val) => {
    const map = { 'En attente': 'badge-warning', 'Validé': 'badge-success', 'Refusé': 'badge-danger' };
    return <span className={`badge ${map[val] || 'badge-info'}`}>{val || '—'}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Consultation des Missions</h1><span style={{ color: 'var(--text-muted)' }}>{data.length} résultats</span></div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => exportToExcel(data, MISSION_COLS, 'missions.xlsx')}><Download size={14}/> Excel</button>
          <button className="btn btn-outline" onClick={() => exportToExcel(data.filter(d => d.acceptation_superieur === 'Validé'), MISSION_COLS, 'missions_valides.xlsx')}><Download size={14}/> Validées (XLS)</button>
          <button className="btn btn-outline" onClick={() => exportToPDF(data, MISSION_COLS, 'Rapport des Missions', 'missions.pdf')}><FileText size={14}/> PDF</button>
          <button className="btn btn-outline" onClick={() => exportToPDF(data.filter(d => d.acceptation_superieur === 'Validé'), MISSION_COLS, 'Missions Validées', 'missions_valides.pdf')}><FileText size={14}/> Ordres mission (PDF)</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filter-bar">
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Statut</label>
          <select className="form-control" style={{ minWidth: '130px' }} value={filters.statut} onChange={e => setFilters({...filters, statut: e.target.value})}>
            <option value="">Tous</option><option value="En attente">En attente</option>
            <option value="Validé">Validées</option><option value="Refusé">Refusées</option>
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Département</label>
          <select className="form-control" style={{ minWidth: '150px' }} value={filters.service} onChange={e => setFilters({...filters, service: e.target.value})}>
            <option value="">Tous</option>{services.map(s => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Employé</label>
          <select className="form-control" style={{ minWidth: '160px' }} value={filters.matricule} onChange={e => setFilters({...filters, matricule: e.target.value})}>
            <option value="">Tous</option>{employees.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom}</option>)}
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Supérieur</label>
          <select className="form-control" style={{ minWidth: '160px' }} value={filters.superieur} onChange={e => setFilters({...filters, superieur: e.target.value})}>
            <option value="">Tous</option>{managers.map(m => <option key={m.matricule} value={m.matricule}>{m.prenom} {m.nom}</option>)}
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Période Début</label>
          <input type="date" className="form-control" value={filters.periode_debut} onChange={e => setFilters({...filters, periode_debut: e.target.value})} /></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Période Fin</label>
          <input type="date" className="form-control" value={filters.periode_fin} onChange={e => setFilters({...filters, periode_fin: e.target.value})} /></div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-outline" onClick={resetFilters}><X size={14}/> Réinitialiser</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Employé</th><th>Département</th><th>Objet</th><th>Destination</th><th>Début</th><th>Fin</th><th>Transport</th><th>Manager</th><th>Statut Supérieur</th><th>Statut RH</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td></tr> :
               data.length === 0 ? <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun résultat</td></tr> :
                data.map(row => (
                  <tr key={row.id}>
                    <td><strong>{row.prenom} {row.nom}</strong><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.matricule}</span></td>
                    <td>{row.service}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.objet}>{row.objet}</td>
                    <td>{row.destination}</td>
                    <td>{row.jour_debut ? format(new Date(row.jour_debut), 'dd/MM/yyyy') : '-'}</td>
                    <td>{row.jour_fin ? format(new Date(row.jour_fin), 'dd/MM/yyyy') : '-'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{row.moyen_transport || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{row.superieur_nom ? `${row.superieur_prenom} ${row.superieur_nom}` : '—'}</td>
                    <td>{statusBadge(row.acceptation_superieur)}</td>
                    <td>{statusBadge(row.acceptation_ressource)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
