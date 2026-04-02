import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Rent', 'Food', 'Transport', 'Utilities', 'Software', 'Equipment', 'Marketing', 'Other'];

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);
}

function RecordModal({ record, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: record?.amount || '',
    type: record?.type || 'income',
    category: record?.category || 'Salary',
    date: record?.date || new Date().toISOString().substring(0, 10),
    notes: record?.notes || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (record?.id) {
        await api.put(`/records/${record.id}`, form);
      } else {
        await api.post('/records', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{record?.id ? '✏️ Edit Transaction' : '➕ New Transaction'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-banner">⚠️ {error}</div>}
          <form onSubmit={handleSubmit} id="record-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Amount ($)</label>
                <input id="r-amount" type="number" step="0.01" min="0.01" className="form-input" value={form.amount} onChange={e => set('amount', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select id="r-type" className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select id="r-category" className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input id="r-date" type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea id="r-notes" className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Add a description..." />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button id="record-submit-btn" type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (record?.id ? 'Save Changes' : 'Create Record')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ record, onClose, onDeleteConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`/records/${record.id}`);
      onDeleteConfirm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">🗑️ Delete Transaction</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-banner">⚠️ {error}</div>}
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 6 }}>
            Are you sure you want to delete this transaction?
          </p>
          <div style={{ background: 'rgba(245,101,101,0.06)', border: '1px solid rgba(245,101,101,0.15)', borderRadius: 8, padding: '12px 16px', marginBottom: 6 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{record.category} — {fmt(record.amount)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{record.date} · {record.notes || 'No notes'}</div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>This action uses soft delete and can be recovered by an admin.</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="confirm-delete-btn" type="button" className="btn btn-danger" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecordsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/records', { params });
      setRecords(res.data.records);
      setPagination(res.data.pagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, categoryFilter, startDate, endDate]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // Debounced search
  useEffect(() => { setPage(1); }, [search, typeFilter, categoryFilter, startDate, endDate]);

  function handleSave() {
    setShowCreate(false);
    setEditRecord(null);
    fetchRecords();
  }

  function handleDelete() {
    setDeleteRecord(null);
    fetchRecords();
  }

  const pages = [];
  for (let i = 1; i <= pagination.totalPages; i++) pages.push(i);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Transactions</div>
          <div className="topbar-subtitle">{pagination.total} total records</div>
        </div>
        <div className="topbar-actions">
          {isAdmin && (
            <button id="create-record-btn" className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              ➕ New Transaction
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Filters */}
        <div className="filters-bar">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              id="search-records"
              type="text"
              className="search-input"
              placeholder="Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select id="filter-type" className="filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select id="filter-category" className="filter-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <input type="date" className="filter-select" value={startDate} onChange={e => setStartDate(e.target.value)} title="Start date" />
          <input type="date" className="filter-select" value={endDate} onChange={e => setEndDate(e.target.value)} title="End date" />

          {(search || typeFilter || categoryFilter || startDate || endDate) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setTypeFilter(''); setCategoryFilter(''); setStartDate(''); setEndDate(''); }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-wrapper">
            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No transactions found</div>
                <div className="empty-state-sub">Try adjusting your filters</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Notes</th>
                    <th>Amount</th>
                    <th>Created By</th>
                    {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td style={{ fontWeight: 500 }}>{r.category}</td>
                      <td>
                        <span className={`badge badge-${r.type}`}>
                          {r.type === 'income' ? '↑' : '↓'} {r.type}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.notes || '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: r.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)', whiteSpace: 'nowrap' }}>
                        {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.createdByName || '—'}</td>
                      {isAdmin && (
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button className="btn btn-secondary btn-sm" style={{ marginRight: 6 }} onClick={() => setEditRecord(r)}>
                            ✏️ Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteRecord(r)}>
                            🗑️
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {pages.map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>›</button>
            </div>
          )}
        </div>
      </div>

      {showCreate && <RecordModal onClose={() => setShowCreate(false)} onSave={handleSave} />}
      {editRecord && <RecordModal record={editRecord} onClose={() => setEditRecord(null)} onSave={handleSave} />}
      {deleteRecord && <DeleteModal record={deleteRecord} onClose={() => setDeleteRecord(null)} onDeleteConfirm={handleDelete} />}
    </>
  );
}
