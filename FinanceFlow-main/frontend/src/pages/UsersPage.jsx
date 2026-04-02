import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const ROLE_COLORS = {
  admin: 'role-avatar-admin',
  analyst: 'role-avatar-analyst',
  viewer: 'role-avatar-viewer',
};

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'viewer',
    status: user?.status || 'active',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (user?.id && !payload.password) delete payload.password;
      if (user?.id) {
        await api.put(`/users/${user.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{user?.id ? '✏️ Edit User' : '👤 Create User'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-banner">⚠️ {error}</div>}
          <form onSubmit={handleSubmit} id="user-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="u-name" type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            {!user?.id && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input id="u-email" type="email" className="form-input" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">{user?.id ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input id="u-password" type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} minLength={6} required={!user?.id} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select id="u-role" className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {user?.id && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select id="u-status" className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button id="user-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (user?.id ? 'Save Changes' : 'Create User')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function toggleStatus(user) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/users/${user.id}`, { status: newStatus });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status.');
    }
  }

  function handleSave() {
    setShowCreate(false);
    setEditUser(null);
    fetchUsers();
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Users</div>
          <div className="topbar-subtitle">{users.length} team members</div>
        </div>
        <div className="topbar-actions">
          <button id="create-user-btn" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            ➕ Add User
          </button>
        </div>
      </div>

      <div className="page-content">
        {error && <div className="error-banner">⚠️ {error}</div>}

        <div className="card">
          <div className="table-wrapper">
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-text">No users found</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className={`sidebar-avatar ${ROLE_COLORS[u.role]}`} style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                            {getInitials(u.name)}
                          </div>
                          <span style={{ fontWeight: 500 }}>
                            {u.name}
                            {u.id === currentUser?.id && <span style={{ fontSize: 11, color: 'var(--accent-blue-light)', marginLeft: 6 }}>(you)</span>}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                      <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {u.id !== currentUser?.id && (
                          <>
                            <button className="btn btn-secondary btn-sm" style={{ marginRight: 6 }} onClick={() => setEditUser(u)}>
                              ✏️ Edit
                            </button>
                            <button
                              className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => toggleStatus(u)}
                            >
                              {u.status === 'active' ? '🔒 Deactivate' : '✓ Activate'}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Role legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
          {[
            { role: 'admin', desc: 'Full access — manage users, records, and dashboard' },
            { role: 'analyst', desc: 'Can view records and dashboard insights' },
            { role: 'viewer', desc: 'Dashboard view only, read-only access' },
          ].map(item => (
            <div key={item.role} style={{ flex: 1, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ marginBottom: 6 }}><span className={`badge badge-${item.role}`}>{item.role}</span></div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && <UserModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
      {editUser && <UserModal user={editUser} onClose={() => setEditUser(null)} onSave={handleSave} />}
    </>
  );
}
