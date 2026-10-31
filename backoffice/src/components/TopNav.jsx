import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopNav() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, clear local storage / auth state here
    navigate('/login');
  };

  return (
    <header className="top-nav">
      <div className="user-profile">
        <div className="user-info" style={{ textAlign: 'right' }}>
          <span className="user-name">Administrateur</span>
          <span className="user-role">Responsable RH</span>
        </div>
        <div className="user-avatar">A</div>
        <button 
          onClick={handleLogout}
          className="btn btn-outline" 
          style={{ marginLeft: '1rem', border: 'none', padding: '0.5rem', color: 'var(--danger)' }}
          title="Déconnexion"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
