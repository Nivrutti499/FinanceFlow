import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n || 0);
}

function TrendChart({ trends }) {
  if (!trends?.length) return <div className="empty-state"><div className="empty-state-text">No trend data yet</div></div>;

  const maxVal = Math.max(...trends.map(t => Math.max(t.income, t.expenses)), 1);
  return (
    <div className="chart-container">
      <div className="chart-bars">
        {trends.map(t => (
          <div key={t.month} className="chart-bar-group">
            <div className="chart-bar income" style={{ height: `${(t.income / maxVal) * 100}%` }} title={`Income: ${fmt(t.income)}`} />
            <div className="chart-bar expense" style={{ height: `${(t.expenses / maxVal) * 100}%` }} title={`Expenses: ${fmt(t.expenses)}`} />
            <div className="chart-label">{t.month.substring(5)}/{t.month.substring(2, 4)}</div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <div className="chart-legend-item">
          <div className="chart-legend-dot" style={{ background: '#48bb78' }} />
          Income
        </div>
        <div className="chart-legend-item">
          <div className="chart-legend-dot" style={{ background: '#f56565' }} />
          Expenses
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdown({ categories }) {
  const incomeItems = categories?.filter(c => c.type === 'income') || [];
  const expenseItems = categories?.filter(c => c.type === 'expense') || [];
  const maxIncome = Math.max(...incomeItems.map(c => c.total), 1);
  const maxExpense = Math.max(...expenseItems.map(c => c.total), 1);

  return (
    <div>
      {incomeItems.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Income</div>
          <div className="category-list" style={{ marginBottom: 20 }}>
            {incomeItems.slice(0, 5).map(c => (
              <div key={`i-${c.category}`} className="category-item">
                <div className="category-item-header">
                  <span className="category-name">{c.category}</span>
                  <span className="category-amount" style={{ color: 'var(--accent-green)' }}>{fmt(c.total)}</span>
                </div>
                <div className="category-bar-bg">
                  <div className="category-bar-fill" style={{ width: `${(c.total / maxIncome) * 100}%`, background: 'var(--gradient-green)' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {expenseItems.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Expenses</div>
          <div className="category-list">
            {expenseItems.slice(0, 5).map(c => (
              <div key={`e-${c.category}`} className="category-item">
                <div className="category-item-header">
                  <span className="category-name">{c.category}</span>
                  <span className="category-amount" style={{ color: 'var(--accent-red)' }}>{fmt(c.total)}</span>
                </div>
                <div className="category-bar-bg">
                  <div className="category-bar-fill" style={{ width: `${(c.total / maxExpense) * 100}%`, background: 'var(--gradient-red)' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const CATEGORY_ICONS = {
  Salary: '💼', Rent: '🏠', Freelance: '💻', Food: '🍔', Transport: '🚗',
  Utilities: '⚡', Software: '🖥️', Equipment: '🔧', Investment: '📈',
  Marketing: '📣', Other: '💰',
};

function getIcon(category) {
  return CATEGORY_ICONS[category] || '💰';
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [sumRes, trendRes, catRes, recentRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/trends'),
          api.get('/dashboard/category-breakdown'),
          api.get('/dashboard/recent'),
        ]);
        setSummary(sumRes.data);
        setTrends(trendRes.data.trends);
        setCategories(catRes.data.categories);
        setRecent(recentRes.data.records);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Dashboard</div><div className="topbar-subtitle">Loading...</div></div>
      </div>
      <div className="page-content"><div className="loading-spinner"><div className="spinner" /></div></div>
    </>
  );

  const balance = summary?.netBalance || 0;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Dashboard</div>
          <div className="topbar-subtitle">Welcome back, {currentUser?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="page-content">
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card green">
            <div className="stat-icon green">💰</div>
            <div className="stat-label">Total Income</div>
            <div className="stat-value green">{fmt(summary?.totalIncome)}</div>
            <div className="stat-sub">This month: {fmt(summary?.monthIncome)}</div>
          </div>

          <div className="stat-card red">
            <div className="stat-icon red">📤</div>
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value red">{fmt(summary?.totalExpenses)}</div>
            <div className="stat-sub">This month: {fmt(summary?.monthExpenses)}</div>
          </div>

          <div className={`stat-card ${balance >= 0 ? 'blue' : 'red'}`}>
            <div className={`stat-icon ${balance >= 0 ? 'blue' : 'red'}`}>{balance >= 0 ? '📈' : '📉'}</div>
            <div className="stat-label">Net Balance</div>
            <div className={`stat-value ${balance >= 0 ? 'blue' : 'red'}`}>{fmt(balance)}</div>
            <div className="stat-sub">{balance >= 0 ? 'Positive cash flow' : 'Negative cash flow'}</div>
          </div>

          <div className="stat-card purple">
            <div className="stat-icon purple">📋</div>
            <div className="stat-label">Total Records</div>
            <div className="stat-value purple">{summary?.totalRecords || 0}</div>
            <div className="stat-sub">All transactions</div>
          </div>
        </div>

        {/* Charts row */}
        <div className="dashboard-grid">
          <div className="card">
            <div className="card-header">
              <span className="card-title">📊 Monthly Trends (6 months)</span>
            </div>
            <div className="card-body">
              <TrendChart trends={trends} />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">🗂️ Category Breakdown</span>
            </div>
            <div className="card-body">
              <CategoryBreakdown categories={categories} />
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚡ Recent Activity</span>
            <span className="text-muted">Last 10 transactions</span>
          </div>
          <div className="card-body" style={{ padding: '0 24px 8px' }}>
            {recent.length === 0 ? (
              <div className="empty-state"><div className="empty-state-text">No transactions yet</div></div>
            ) : (
              <div className="activity-list">
                {recent.map(r => (
                  <div key={r.id} className="activity-item">
                    <div className={`activity-icon ${r.type}`}>{getIcon(r.category)}</div>
                    <div className="activity-info">
                      <div className="activity-category">{r.category}</div>
                      <div className="activity-meta">{r.date} · {r.notes || '—'}</div>
                    </div>
                    <div className={`activity-amount ${r.type}`}>
                      {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
