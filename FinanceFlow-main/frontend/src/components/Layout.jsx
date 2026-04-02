import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  admin: 'role-avatar-admin',
  analyst: 'role-avatar-analyst',
  viewer: 'role-avatar-viewer',
};

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function Layout({ children }) {
  const { currentUser, logout, hasMinRole } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💹</div>
          <span className="sidebar-logo-text">FinanceFlow</span>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-title">Overview</p>
          <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <span className="sidebar-icon">📊</span>
            Dashboard
          </NavLink>

          {hasMinRole('analyst') && (
            <>
              <p className="sidebar-section-title">Finance</p>
              <NavLink to="/records" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="sidebar-icon">📋</span>
                Transactions
              </NavLink>
            </>
          )}

          {currentUser?.role === 'admin' && (
            <>
              <p className="sidebar-section-title">Administration</p>
              <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="sidebar-icon">👥</span>
                Users
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className={`sidebar-avatar ${ROLE_COLORS[currentUser?.role]}`}>
              {getInitials(currentUser?.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser?.name}</div>
              <div className="sidebar-user-role">{currentUser?.role}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
