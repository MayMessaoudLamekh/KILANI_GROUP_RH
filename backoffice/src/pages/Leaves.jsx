import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { format } from 'date-fns';
import { Download, FileText, Filter, X, Check } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import './AdminPage.css';

const STATUS_OPTS = ['', 'En attente', 'Validé', 'Refusé'];

const LEAVE_COLS = [
  { header: 'Matricule', dataKey: 'matricule' },
  { header: 'Nom', dataKey: 'nom', render: (v, r) => `${r.prenom} ${r.nom}` },
  { header: 'Département', dataKey: 'service' },
  { header: 'Motif', dataKey: 'nom_motif' },
  { header: 'Début', dataKey: 'jour_debut', render: v => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
  { header: 'Fin', dataKey: 'jour_fin', render: v => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
  { header: 'Nb. Jours', dataKey: 'nombre_jours' },
  { header: 'Statut', dataKey: 'acceptation_superieur' },
  { header: 'Manager', dataKey: 'superieur_nom', render: (v, r) => v ? `${r.superieur_prenom} ${v}` : '-' },
];

export default function Leaves() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [motifs, setMotifs] = useState([]);
  const [managers, setManagers] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ statut: '', matricule: '', service: '', superieur: '', motif_id: '', periode_debut: '', periode_fin: '' });

  const load = async () => {
    setLoading(true);
    try {
      const leaves = await adminService.getLeaves(filters);
      setData(leaves);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([adminService.getLeaveMotifs(), adminService.getManagers(), adminService.getServices(), adminService.getEmployees()])
      .then(([m, mgr, svc, emp]) => { setMotifs(m); setManagers(mgr); setServices(svc); setEmployees(emp); });
  }, []);

  useEffect(() => { load(); }, [filters]);

  const resetFilters = () => setFilters({ statut: '', matricule: '', service: '', superieur: '', motif_id: '', periode_debut: '', periode_fin: '' });

  const statusBadge = (val) => {
    const map = { 'En attente': 'badge-warning', 'Validé': 'badge-success', 'Refusé': 'badge-danger' };
    return <span className={`badge ${map[val] || 'badge-info'}`}>{val || '—'}</span>;
  };

  const handleExcelExport = (type) => {
    let exportData = data;
    let filename = 'conges_rapport';
    if (type === 'pending') { exportData = data.filter(d => d.acceptation_superieur === 'En attente'); filename = 'conges_en_attente'; }
    else if (type === 'validated') { exportData = data.filter(d => d.acceptation_superieur === 'Validé'); filename = 'conges_valides'; }
    else if (type === 'refused') { exportData = data.filter(d => d.acceptation_superieur === 'Refusé'); filename = 'conges_refuses'; }
    exportToExcel(exportData, LEAVE_COLS, `${filename}.xlsx`);
  };

  const handlePDFExport = (type) => {
    let exportData = data;
    let title = 'Rapport des Congés';
    let filename = 'conges_rapport';
    if (type === 'pending') { exportData = data.filter(d => d.acceptation_superieur === 'En attente'); title = 'Congés en Attente'; filename = 'conges_en_attente'; }
    else if (type === 'validated') { exportData = data.filter(d => d.acceptation_superieur === 'Validé'); title = 'Congés Validés'; filename = 'conges_valides'; }
    else if (type === 'refused') { exportData = data.filter(d => d.acceptation_superieur === 'Refusé'); title = 'Congés Refusés'; filename = 'conges_refuses'; }
    exportToPDF(exportData, LEAVE_COLS, title, `${filename}.pdf`);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Consultation des Congés</h1><span style={{ color: 'var(--text-muted)' }}>{data.length} résultats</span></div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="export-group">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Excel :</span>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleExcelExport('all')}><Download size={14}/> Tous</button>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleExcelExport('pending')}>En attente</button>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleExcelExport('validated')}>Validés</button>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleExcelExport('refused')}>Refusés</button>
          </div>
          <div className="export-group">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>PDF :</span>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handlePDFExport('all')}><FileText size={14}/> Tous</button>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handlePDFExport('pending')}>En attente</button>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handlePDFExport('validated')}>Validés</button>
            <button className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handlePDFExport('refused')}>Refusés</button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filter-bar">
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Statut</label>
          <select className="form-control" style={{ minWidth: '130px' }} value={filters.statut} onChange={e => setFilters({...filters, statut: e.target.value})}>
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s || 'Tous'}</option>)}
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Département</label>
          <select className="form-control" style={{ minWidth: '150px' }} value={filters.service} onChange={e => setFilters({...filters, service: e.target.value})}>
            <option value="">Tous</option>
            {services.map(s => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Employé</label>
          <select className="form-control" style={{ minWidth: '160px' }} value={filters.matricule} onChange={e => setFilters({...filters, matricule: e.target.value})}>
            <option value="">Tous</option>
            {employees.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom}</option>)}
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Supérieur</label>
          <select className="form-control" style={{ minWidth: '160px' }} value={filters.superieur} onChange={e => setFilters({...filters, superieur: e.target.value})}>
            <option value="">Tous</option>
            {managers.map(m => <option key={m.matricule} value={m.matricule}>{m.prenom} {m.nom}</option>)}
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Motif</label>
          <select className="form-control" style={{ minWidth: '150px' }} value={filters.motif_id} onChange={e => setFilters({...filters, motif_id: e.target.value})}>
            <option value="">Tous</option>
            {motifs.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
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
              <tr><th>Employé</th><th>Département</th><th>Motif</th><th>Début</th><th>Fin</th><th>Jours</th><th>Manager</th><th>Statut Supérieur</th><th>Statut RH</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td></tr> :
               data.length === 0 ? <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun résultat</td></tr> :
                data.map(row => (
                  <tr key={row.id}>
                    <td><strong>{row.prenom} {row.nom}</strong><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.matricule}</span></td>
                    <td>{row.service}</td>
                    <td>{row.nom_motif || '—'}</td>
                    <td>{row.jour_debut ? format(new Date(row.jour_debut), 'dd/MM/yyyy') : '-'}</td>
                    <td>{row.jour_fin ? format(new Date(row.jour_fin), 'dd/MM/yyyy') : '-'}</td>
                    <td><strong>{row.nombre_jours}</strong> j</td>
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
