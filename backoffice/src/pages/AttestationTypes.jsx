import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import Modal from '../components/Modal';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import './AdminPage.css';

const INITIAL = { code: '', libelle: '', description: '', validation_rh_requise: true, actif: true };

export default function AttestationTypes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null });
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setData(await adminService.getAttestationTypes()); } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(INITIAL); setModal({ open: true, mode: 'create', item: null }); };
  const openEdit = (item) => {
    setForm({ code: item.code, libelle: item.libelle, description: item.description || '',
              validation_rh_requise: !!item.validation_rh_requise, actif: !!item.actif });
    setModal({ open: true, mode: 'edit', item });
  };
  const closeModal = () => setModal({ open: false, mode: 'create', item: null });

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal.mode === 'create') await adminService.createAttestationType(form);
      else await adminService.updateAttestationType(modal.item.id, form);
      setMsg({ type: 'success', text: 'Type d\'attestation enregistré !' });
      load(); closeModal();
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur' }); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Désactiver ce type ?')) return;
    try { await adminService.deleteAttestationType(id); setMsg({ type: 'success', text: 'Type désactivé' }); load(); }
    catch { setMsg({ type: 'error', text: 'Erreur' }); }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Types d'Attestation</h1><span style={{ color: 'var(--text-muted)' }}>{data.length} types</span></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Nouveau Type</button>
      </div>

      {msg && <div className={`alert-msg ${msg.type}`} onClick={() => setMsg(null)}>{msg.type === 'success' ? <Check size={16}/> : <X size={16}/>} {msg.text}</div>}

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Code</th><th>Libellé</th><th>Description</th><th>Validation RH</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="6" style={{ textAlign: 'center' }}>Chargement...</td></tr> :
                data.map(item => (
                  <tr key={item.id}>
                    <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.code}</code></td>
                    <td><strong>{item.libelle}</strong></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.description || '—'}</td>
                    <td><span className={`badge ${item.validation_rh_requise ? 'badge-warning' : 'badge-info'}`}>{item.validation_rh_requise ? 'Requise' : 'Non requise'}</span></td>
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

      <Modal open={modal.open} onClose={closeModal} title={modal.mode === 'create' ? 'Nouveau Type d\'Attestation' : `Modifier : ${modal.item?.libelle}`}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group"><label className="form-label">Code *</label>
            <input className="form-control" required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="Ex: ATTEST_TRAVAIL" /></div>
          <div className="form-group"><label className="form-label">Libellé *</label>
            <input className="form-control" required value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} placeholder="Ex: Attestation de travail" /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.validation_rh_requise} onChange={e => setForm({...form, validation_rh_requise: e.target.checked})} />
            Validation RH requise
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={closeModal}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
