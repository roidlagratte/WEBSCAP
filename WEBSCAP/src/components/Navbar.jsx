import { useNavigate } from 'react-router-dom';
import { Home, Search, LogOut, ChartLineIcon, Calendar1Icon } from 'lucide-react';
import { CogIcon } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate(); // Utiliser le hook navigate pour la redirection

  // Fonction de déconnexion
  const handleLogout = () => {
    // Supprimer le token du stockage local
    localStorage.removeItem('token');
    // Rediriger vers la page de connexion
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <a href="/accueil" className="flex items-center space-x-2">
          <Home className="icon" />
          <span>Home</span>
        </a>
        <a href="/list" className="flex items-center space-x-2">
          <Calendar1Icon className="icon" />
          <span>Historic</span>
        </a>
        <a href="/stats" className="flex items-center space-x-2">
          <ChartLineIcon className="icon" />
          <span>Statistics</span>
        </a>
        <a href="/runscan" className="flex items-center space-x-2">
          <Search className="icon" />
          <span>Manual scan</span>
        </a>
        <a href="/users" className="flex items-center space-x-2">
          <CogIcon className="icon" />
          <span>Configuration</span>
        </a>
        <button onClick={handleLogout} className="flex items-center space-x-2">
          <LogOut className="icon" />
          <span>Disconnect</span>
        </button>
      </div>
    </nav>
  );
}
