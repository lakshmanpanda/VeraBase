'use client';

import { useState, useEffect } from 'react';

interface Metric {
  id: string;
  canonical_name: string;
  description: string;
  grain: string;
  base_table: string;
  sql_template: string;
  dependencies: string[];
  is_active: boolean;
}

const EMPTY_FORM = { name: '', desc: '', sql: '', grain: '', baseTable: '', dependencies: '' };

export default function SemanticGridPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<string | null>(null);

  const authHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/metadata/metrics', {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch semantic brain data');
      setMetrics(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMetrics(); }, []);

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); }
    else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will affect AI query planning.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/metadata/metrics/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete metric');
      notify(`"${name}" deleted.`);
      fetchMetrics();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setDeleting(null);
    }
  };

  const handleInject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/metadata/metrics', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          canonical_name: form.name,
          description: form.desc,
          sql_template: form.sql,
          grain: form.grain,
          base_table: form.baseTable,
          dependencies: form.dependencies ? form.dependencies.split(',').map(s => s.trim()).filter(Boolean) : [],
        }),
      });
      if (!res.ok) throw new Error('Failed to inject metric');
      notify(`"${form.name}" injected and vectorized.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchMetrics();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-light text-[var(--text-primary)] mb-2 tracking-tight">Semantic Brain</h1>
          <p className="text-[var(--text-muted)] text-sm font-light">
            Define and manage the enterprise data dictionary. Each metric is vectorized and stored in PostgreSQL.
          </p>
        </div>
        <button
          id="toggle-inject-form"
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            showForm
              ? 'bg-[var(--bg-muted)] border border-[var(--border-dim)] text-[var(--text-secondary)]'
              : 'btn-accent'
          }`}
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Inject Metric
            </>
          )}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-5 p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-red-300 text-sm flex items-center gap-3">
          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
          <svg className="w-4 h-4 text-[var(--emerald)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {success}
        </div>
      )}

      {/* Injection form */}
      {showForm && (
        <form onSubmit={handleInject} className="glass-elevated border border-[rgba(124,111,247,0.2)] rounded-2xl p-8 mb-8 animate-fade-up">
          <h2 className="text-base font-medium text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-[var(--accent-primary)] rounded-full" />
            Define New Semantic Metric
          </h2>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Canonical Name</label>
              <input
                type="text"
                id="metric-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)] font-mono"
                placeholder="e.g., net_revenue"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Base Table</label>
              <input
                type="text"
                id="metric-base-table"
                value={form.baseTable}
                onChange={(e) => setForm({ ...form, baseTable: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)] font-mono"
                placeholder="e.g., order_items"
                required
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">SQL Template</label>
            <input
              type="text"
              id="metric-sql"
              value={form.sql}
              onChange={(e) => setForm({ ...form, sql: e.target.value })}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--emerald)] text-sm font-mono focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)]"
              placeholder="e.g., SUM(order_items.price_at_time * order_items.quantity)"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Grain</label>
              <input
                type="text"
                id="metric-grain"
                value={form.grain}
                onChange={(e) => setForm({ ...form, grain: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)]"
                placeholder="e.g., order_item"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Dependencies (comma separated)</label>
              <input
                type="text"
                id="metric-deps"
                value={form.dependencies}
                onChange={(e) => setForm({ ...form, dependencies: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)] font-mono"
                placeholder="e.g., refunds_and_returns"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">
              Plain-English Description <span className="text-[var(--accent-primary)]">(used for AI vectorization)</span>
            </label>
            <textarea
              id="metric-desc"
              value={form.desc}
              onChange={(e) => setForm({ ...form, desc: e.target.value })}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors h-20 resize-none placeholder-[var(--text-muted)]"
              placeholder="Describe what this metric measures in plain English so the AI can match it to user questions..."
              required
            />
          </div>

          <button
            type="submit"
            id="metric-submit"
            disabled={submitting}
            className="btn-accent px-8 py-3 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Vectorizing & Saving…
              </>
            ) : (
              <>
                Save to Semantic Brain
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </>
            )}
          </button>
        </form>
      )}

      {/* Data grid */}
      <div className="glass-elevated rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="shimmer h-12 rounded-xl" />
            ))}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-dim)] bg-[var(--bg-muted)]">
                <th className="p-4 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">Metric</th>
                <th className="p-4 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">Base Table</th>
                <th className="p-4 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">SQL Template</th>
                <th className="p-4 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">Grain</th>
                <th className="p-4 text-right" />
              </tr>
            </thead>
            <tbody>
              {metrics.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-[var(--text-muted)] text-sm">
                    No semantic definitions yet. Inject your first metric.
                  </td>
                </tr>
              ) : (
                metrics.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-muted)] transition-colors group">
                    <td className="p-4">
                      <div className="font-mono text-sm text-[var(--accent-hover)] mb-0.5">{m.canonical_name}</div>
                      <div className="text-xs text-[var(--text-muted)] max-w-xs truncate" title={m.description}>{m.description}</div>
                    </td>
                    <td className="p-4">
                      <span className="tag-violet px-2 py-1 rounded-lg text-xs">{m.base_table}</span>
                    </td>
                    <td className="p-4 max-w-[280px]">
                      <code className="text-[11px] text-[var(--emerald)] bg-[var(--bg-base)] px-2 py-1 rounded-lg block truncate" title={m.sql_template}>
                        {m.sql_template}
                      </code>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-[var(--text-muted)]">{m.grain}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(m.id, m.canonical_name)}
                        disabled={deleting === m.id}
                        className="opacity-0 group-hover:opacity-100 p-2 text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete metric"
                      >
                        {deleting === m.id ? (
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Count footer */}
      {!loading && metrics.length > 0 && (
        <div className="mt-3 text-xs text-[var(--text-muted)] text-right">
          {metrics.length} metric{metrics.length !== 1 ? 's' : ''} in semantic brain
        </div>
      )}
    </div>
  );
}