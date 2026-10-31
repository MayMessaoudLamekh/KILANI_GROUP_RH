import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { format } from 'date-fns';
import { Download, FileText, X } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import './AdminPage.css';

const ATTEST_COLS = [
  { header: 'Matricule', dataKey: 'matricule' },
  { header: 'Employé', dataKey: 'nom', render: (v, r) => `${r.prenom} ${r.nom}` },
  { header: 'Département', dataKey: 'service' },
  { header: 'Intitulé', dataKey: 'Intitule' },
  { header: 'Type', dataKey: 'titre_attestation' },
  { header: 'Date demande', dataKey: 'Datetime', render: v => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
  { header: 'Statut', dataKey: 'etat_demande' },
  { header: 'Traité par', dataKey: 'approbateur_nom', render: (v, r) => v ? `${r.approbateur_prenom} ${v}` : '-' },
];

export default function Attestations() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({ statut: '', matricule: '', service: '' });

  const load = async () => {
    setLoading(true);
    try { setData(await adminService.getAttestations(filters)); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([adminService.getServices(), adminService.getEmployees()])
      .then(([svc, emp]) => { setServices(svc); setEmployees(emp); });
  }, []);
  useEffect(() => { load(); }, [filters]);

  const resetFilters = () => setFilters({ statut: '', matricule: '', service: '' });

  const statusBadge = (val) => {
    const map = { 'En attente': 'badge-warning', 'Validé': 'badge-success', 'Refusé': 'badge-danger', 'Généré': 'badge-info', 'Prête': 'badge-success' };
    return <span className={`badge ${map[val] || 'badge-info'}`}>{val || '—'}</span>;
  };

  const generees = data.filter(d => d.etat_demande === 'Généré' || d.etat_demande === 'Prête');

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Consultation des Attestations</h1><span style={{ color: 'var(--text-muted)' }}>{data.length} résultats · {generees.length} générées</span></div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => exportToExcel(data, ATTEST_COLS, 'attestations.xlsx')}><Download size={14}/> Demandées (XLS)</button>
          <button className="btn btn-outline" onClick={() => exportToExcel(generees, ATTEST_COLS, 'attestations_generees.xlsx')}><Download size={14}/> Générées (XLS)</button>
          <button className="btn btn-outline" onClick={() => exportToPDF(data, ATTEST_COLS, 'Historique des Attestations', 'attestations_historique.pdf')}><FileText size={14}/> Historique (PDF)</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="filter-bar">
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Statut</label>
          <select className="form-control" style={{ minWidth: '130px' }} value={filters.statut} onChange={e => setFilters({...filters, statut: e.target.value})}>
            <option value="">Tous</option>
            <option value="En attente">En attente</option>
            <option value="Validé">Validées</option>
            <option value="Généré">Générées</option>
            <option value="Refusé">Refusées</option>
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Département</label>
          <select className="form-control" style={{ minWidth: '150px' }} value={filters.service} onChange={e => setFilters({...filters, service: e.target.value})}>
            <option value="">Tous</option>{services.map(s => <option key={s} value={s}>{s}</option>)}
          </select></div>
        <div><label className="form-label" style={{ fontSize: '0.8rem' }}>Employé</label>
          <select className="form-control" style={{ minWidth: '160px' }} value={filters.matricule} onChange={e => setFilters({...filters, matricule: e.target.value})}>
            <option value="">Tous</option>{employees.map(e => <option key={e.matricule} value={e.matricule}>{e.prenom} {e.nom}</option>)}
          </select></div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-outline" onClick={resetFilters}><X size={14}/> Réinitialiser</button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Employé</th><th>Département</th><th>Intitulé</th><th>Type</th><th>Date Demande</th><th>Statut</th><th>Traité par</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td></tr> :
               data.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun résultat</td></tr> :
                data.map(row => (
                  <tr key={row.id}>
                    <td><strong>{row.prenom} {row.nom}</strong><br/><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.matricule}</span></td>
                    <td>{row.service}</td>
                    <td>{row.Intitule}</td>
                    <td style={{ fontSize: '0.85rem' }}>{row.titre_attestation}</td>
                    <td>{row.Datetime ? format(new Date(row.Datetime), 'dd/MM/yyyy HH:mm') : '-'}</td>
                    <td>{statusBadge(row.etat_demande)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{row.approbateur_nom ? `${row.approbateur_prenom} ${row.approbateur_nom}` : '—'}</td>
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
