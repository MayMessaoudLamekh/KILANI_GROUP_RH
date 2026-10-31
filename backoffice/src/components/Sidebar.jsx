import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Briefcase, FileText, Settings, Tag, FileBadge, LogOut } from 'lucide-react';
import { authService } from '../services/api';

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const sections = [
    {
      title: 'PRINCIPAL',
      items: [
        { path: '/', icon: <LayoutDashboard size={18} />, label: 'Tableau de bord', end: true },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { path: '/employees', icon: <Users size={18} />, label: 'Employés & Accès' },
        { path: '/leave-motifs', icon: <Tag size={18} />, label: 'Motifs de Congé' },
        { path: '/attestation-types', icon: <FileBadge size={18} />, label: "Types d'Attestation" },
        { path: '/settings', icon: <Settings size={18} />, label: 'Paramétrage' },
      ]
    },
    {
      title: 'CONSULTATION',
      items: [
        { path: '/leaves', icon: <Calendar size={18} />, label: 'Congés' },
        { path: '/missions', icon: <Briefcase size={18} />, label: 'Missions' },
        { path: '/attestations', icon: <FileText size={18} />, label: 'Attestations' },
      ]
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span style={{ marginRight: '6px' }}>✨</span> KILANI RH
      </div>
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
              {section.title}
            </div>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>BackOffice RH v1.0</div>
        <button 
          onClick={handleLogout}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
          title="Se déconnecter"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
