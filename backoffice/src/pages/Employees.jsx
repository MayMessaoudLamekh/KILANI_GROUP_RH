import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { Plus, Edit2, Trash2, RotateCcw, X, Check } from 'lucide-react';
import Modal from '../components/Modal';
import './AdminPage.css';

const INITIAL_FORM = {
  matricule: '', nom: '', prenom: '', Email: '', fonction: '',
  service: '', site: '', Statut: 'Employe', Etat: 'Actif',
  superieur_hierarchique: '', Droit_Mensuel: 1.75,
  date_recrutement: '', Societe: 'Kilani Group',
};

export default function Employees() {
  const [data, setData] = useState([]);
  const [managers, setManagers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [emps, mgrs, svcs] = await Promise.all([
        adminService.getEmployees(),
        adminService.getManagers(),
        adminService.getServices(),
      ]);
      setData(emps); setManagers(mgrs); setServices(svcs);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(INITIAL_FORM); setModal({ open: true, mode: 'create', item: null }); };
  const openEdit = (item) => {
    setForm({
      matricule: item.matricule, nom: item.nom, prenom: item.prenom, Email: item.Email,
      fonction: item.fonction || '', service: item.service || '', site: item.site || '',
      Statut: item.Statut, Etat: item.Etat,
      superieur_hierarchique: item.superieur_hierarchique || '',
      Droit_Mensuel: item.Droit_Mensuel || 1.75,
      date_recrutement: item.date_recrutement ? item.date_recrutement.substring(0, 10) : '',
      Societe: item.Societe || 'Kilani Group',
    });
    setModal({ open: true, mode: 'edit', item });
  };
  const closeModal = () => setModal({ open: false, mode: 'create', item: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') await adminService.createEmployee(form);
      else await adminService.updateEmployee(modal.item.matricule, form);
      setMsg({ type: 'success', text: modal.mode === 'create' ? 'Employé créé !' : 'Employé mis à jour !' });
      load(); closeModal();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur' });
    }
    setSaving(false);
  };

  const handleDelete = async (matricule) => {
    if (!window.confirm(`Désactiver l'employé ${matricule} ?`)) return;
    try {
      await adminService.deleteEmployee(matricule);
      setMsg({ type: 'success', text: 'Employé désactivé' });
      load();
    } catch (e) { setMsg({ type: 'error', text: 'Erreur' }); }
  };

  const filtered = data.filter(emp =>
    !search || [emp.nom, emp.prenom, emp.matricule, emp.service, emp.Email]
      .some(v => v && v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Gestion des Employés</h1><span style={{ color: 'var(--text-muted)' }}>{data.length} collaborateurs</span></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Nouvel Employé</button>
      </div>

      {msg && (
        <div className={`alert-msg ${msg.type}`} onClick={() => setMsg(null)}>
          {msg.type === 'success' ? <Check size={16}/> : <X size={16}/>} {msg.text}
        </div>
      )}

      <div className="card">
        <div className="table-toolbar">
          <input className="form-control" style={{ maxWidth: '350px' }} placeholder="🔍 Rechercher un employé..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Matricule</th><th>Nom Complet</th><th>Email</th><th>Département</th>
                <th>Statut</th><th>Solde Congé</th><th>Manager</th><th>État</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Chargement...</td></tr>
              ) : filtered.map(emp => (
                <tr key={emp.matricule}>
                  <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{emp.matricule}</code></td>
                  <td><strong>{emp.prenom} {emp.nom}</strong></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{emp.Email}</td>
                  <td>{emp.service}</td>
                  <td><span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{emp.Statut}</span></td>
                  <td><strong style={{ color: 'var(--accent-gold)' }}>{emp.Solde_Conge}</strong> j</td>
                  <td style={{ fontSize: '0.85rem' }}>{emp.superieur_nom ? `${emp.superieur_prenom} ${emp.superieur_nom}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><span className={`badge ${emp.Etat === 'Actif' ? 'badge-success' : 'badge-danger'}`}>{emp.Etat}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline icon-btn" title="Modifier" onClick={() => openEdit(emp)}><Edit2 size={14} /></button>
                      <button className="btn btn-outline icon-btn danger" title="Désactiver" onClick={() => handleDelete(emp.matricule)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création/Édition */}
      <Modal open={modal.open} onClose={closeModal} title={modal.mode === 'create' ? 'Nouvel Employé' : `Modifier : ${modal.item?.prenom} ${modal.item?.nom}`}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group"><label className="form-label">Matricule *</label>
            <input className="form-control" required value={form.matricule} onChange={e => setForm({...form, matricule: e.target.value})} disabled={modal.mode === 'edit'} /></div>
          <div className="form-group"><label className="form-label">Prénom *</label>
            <input className="form-control" required value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Nom *</label>
            <input className="form-control" required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Email *</label>
            <input type="email" className="form-control" required value={form.Email} onChange={e => setForm({...form, Email: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Fonction</label>
            <input className="form-control" value={form.fonction} onChange={e => setForm({...form, fonction: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Département</label>
            <input list="services-list" className="form-control" value={form.service} onChange={e => setForm({...form, service: e.target.value})} />
            <datalist id="services-list">{services.map(s => <option key={s} value={s} />)}</datalist></div>
          <div className="form-group"><label className="form-label">Site</label>
            <input className="form-control" value={form.site} onChange={e => setForm({...form, site: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Statut RH *</label>
            <select className="form-control" value={form.Statut} onChange={e => setForm({...form, Statut: e.target.value})}>
              <option value="Employe">Employé</option>
              <option value="Responsable Hiérarchique">Responsable Hiérarchique</option>
              <option value="Ressources Humaines">Ressources Humaines</option>
              <option value="Administrateur">Administrateur</option>
            </select></div>
          <div className="form-group"><label className="form-label">Supérieur Hiérarchique</label>
            <select className="form-control" value={form.superieur_hierarchique} onChange={e => setForm({...form, superieur_hierarchique: e.target.value})}>
              <option value="">— Aucun —</option>
              {managers.map(m => <option key={m.matricule} value={m.matricule}>{m.prenom} {m.nom}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Droit Mensuel (jours)</label>
            <input type="number" step="0.25" className="form-control" value={form.Droit_Mensuel} onChange={e => setForm({...form, Droit_Mensuel: parseFloat(e.target.value)})} /></div>
          <div className="form-group"><label className="form-label">Date de recrutement</label>
            <input type="date" className="form-control" value={form.date_recrutement} onChange={e => setForm({...form, date_recrutement: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">État</label>
            <select className="form-control" value={form.Etat} onChange={e => setForm({...form, Etat: e.target.value})}>
              <option value="Actif">Actif</option><option value="Inactif">Inactif</option>
            </select></div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
