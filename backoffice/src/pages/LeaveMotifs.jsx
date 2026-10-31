import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import './AdminPage.css';

const INITIAL = { libelle: '', description: '', nombre_max_jours: '', impact_solde: true, validation_hierarchique_obligatoire: true, actif: true };

export default function LeaveMotifs() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setData(await adminService.getLeaveMotifs()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(INITIAL); setModal({ open: true, mode: 'create', item: null }); };
  const openEdit = (item) => {
    setForm({ libelle: item.libelle, description: item.description || '', nombre_max_jours: item.nombre_max_jours || '',
              impact_solde: !!item.impact_solde, validation_hierarchique_obligatoire: !!item.validation_hierarchique_obligatoire, actif: !!item.actif });
    setModal({ open: true, mode: 'edit', item });
  };
  const closeModal = () => setModal({ open: false, mode: 'create', item: null });

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'create') await adminService.createLeaveMotif(form);
      else await adminService.updateLeaveMotif(modal.item.id, form);
      setMsg({ type: 'success', text: 'Motif enregistré !' });
      load(); closeModal();
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur' }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Désactiver ce motif ?')) return;
    try { await adminService.deleteLeaveMotif(id); setMsg({ type: 'success', text: 'Motif désactivé' }); load(); }
    catch { setMsg({ type: 'error', text: 'Erreur' }); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Gestion des Motifs de Congé</h1><span style={{ color: 'var(--text-muted)' }}>{data.length} motifs</span></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Nouveau Motif</button>
      </div>

      {msg && <div className={`alert-msg ${msg.type}`} onClick={() => setMsg(null)}>{msg.type === 'success' ? <Check size={16}/> : <X size={16}/>} {msg.text}</div>}

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Libellé</th><th>Description</th><th>Max Jours</th><th>Impact Solde</th><th>Validation Hiér.</th><th>Actif</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" style={{ textAlign: 'center' }}>Chargement...</td></tr> :
                data.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.libelle}</strong></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.description || '—'}</td>
                    <td>{item.nombre_max_jours || '∞'}</td>
                    <td><span className={`badge ${item.impact_solde ? 'badge-warning' : 'badge-info'}`}>{item.impact_solde ? 'Oui' : 'Non'}</span></td>
                    <td><span className={`badge ${item.validation_hierarchique_obligatoire ? 'badge-warning' : 'badge-info'}`}>{item.validation_hierarchique_obligatoire ? 'Obligatoire' : 'Optionnel'}</span></td>
                    <td><span className={`badge ${item.actif ? 'badge-success' : 'badge-danger'}`}>{item.actif ? 'Actif' : 'Inactif'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-outline icon-btn" onClick={() => openEdit(item)}><Edit2 size={14}/></button>
                        <button className="btn btn-outline icon-btn danger" onClick={() => handleDelete(item.id)}><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal.open} onClose={closeModal} title={modal.mode === 'create' ? 'Nouveau Motif de Congé' : `Modifier : ${modal.item?.libelle}`}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group"><label className="form-label">Libellé *</label>
            <input className="form-control" required value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Nombre max de jours (vide = illimité)</label>
            <input type="number" className="form-control" value={form.nombre_max_jours} onChange={e => setForm({...form, nombre_max_jours: e.target.value})} /></div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.impact_solde} onChange={e => setForm({...form, impact_solde: e.target.checked})} />
              Impact sur le solde
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.validation_hierarchique_obligatoire} onChange={e => setForm({...form, validation_hierarchique_obligatoire: e.target.checked})} />
              Validation hiérarchique obligatoire
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
