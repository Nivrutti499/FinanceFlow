import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ff_token');
    const user = localStorage.getItem('ff_user');
    if (token && user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch {
        localStorage.removeItem('ff_token');
        localStorage.removeItem('ff_user');
      }
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('ff_token', token);
    localStorage.setItem('ff_user', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
    setCurrentUser(null);
  }

  function hasRole(...roles) {
    return currentUser && roles.includes(currentUser.role);
  }

  function hasMinRole(minRole) {
    const hierarchy = { viewer: 1, analyst: 2, admin: 3 };
    return currentUser && (hierarchy[currentUser.role] || 0) >= (hierarchy[minRole] || 999);
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout, hasRole, hasMinRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
