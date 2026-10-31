import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import { AlertTriangle, CheckCircle2, Settings2, CalendarCog, FileType } from 'lucide-react';
import { Link } from 'react-router-dom';
import './AdminPage.css';

export default function Settings() {
  const [monthlyRight, setMonthlyRight] = useState(1.75);
  const [saving, setSaving] = useState(false);
  const [crediting, setCrediting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleUpdateMonthly = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await adminService.updateMonthlyRights({ droit_mensuel: monthlyRight, appliquer_a_tous: true });
      setMsg({ type: 'success', text: `Droit mensuel mis à jour à ${monthlyRight} j/mois pour tous les employés actifs.` });
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur' }); }
    setSaving(false);
  };

  const handleCreditMonthly = async () => {
    if (!window.confirm(`Créditer ${monthlyRight} jour(s) de congé à tous les employés actifs maintenant ?`)) return;
    setCrediting(true);
    try {
      await adminService.creditMonthly();
      setMsg({ type: 'success', text: 'Soldes crédités avec succès pour tous les employés actifs !' });
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.error || 'Erreur' }); }
    setCrediting(false);
  };

  const adminLinks = [
    { to: '/employees', icon: <Settings2 size={28} />, title: 'Gestion des Employés', desc: 'Créer, modifier, désactiver les comptes collaborateurs, gérer les supérieurs hiérarchiques et les droits d\'accès (rôles RH).' },
    { to: '/leave-motifs', icon: <CalendarCog size={28} />, title: 'Motifs de Congé', desc: 'Configurer les types de motifs (Annuel, Maladie, Maternité...) avec leurs règles de validation et impact sur le solde.' },
    { to: '/attestation-types', icon: <FileType size={28} />, title: 'Types d\'Attestation', desc: 'Définir les différents types d\'attestations disponibles pour les employés (Travail, Salaire, Ancienneté...).' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Paramétrage</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Configuration générale du système RH</p>

      {msg && <div className={`alert-msg ${msg.type}`} onClick={() => setMsg(null)}>{msg.type === 'success' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>} {msg.text}</div>}

      {/* Droits Mensuels */}
      <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--accent-gold)' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>⚙️ Paramétrage des Droits Mensuels</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Définir le nombre de jours de congé crédités chaque mois à tous les employés actifs. Vous pouvez également déclencher le crédit manuellement.
        </p>
        <form onSubmit={handleUpdateMonthly} style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">Droit mensuel (jours/mois)</label>
            <input
              type="number" step="0.25" min="0" max="31"
              className="form-control" style={{ width: '180px' }}
              value={monthlyRight}
              onChange={e => setMonthlyRight(parseFloat(e.target.value))}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : '✓ Appliquer à tous les employés actifs'}
          </button>
          <button type="button" className="btn btn-accent" onClick={handleCreditMonthly} disabled={crediting}>
            {crediting ? 'Crédit en cours...' : '➕ Créditer maintenant'}
          </button>
        </form>
      </div>

      {/* Quick Links */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Administration</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {adminLinks.map((link, i) => (
          <Link key={i} to={link.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', gap: '1rem', cursor: 'pointer', transition: 'var(--transition)', borderLeft: '3px solid var(--accent-gold)' }}>
              <div style={{ width: '52px', height: '52px', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', flexShrink: 0 }}>
                {link.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>{link.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.5 }}>{link.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
