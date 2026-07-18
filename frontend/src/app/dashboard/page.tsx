'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────
interface QueryResult {
  sql_query: string;
  execution_plan: any;
  data: Record<string, any>[];
  recommended_chart_type: 'kpi' | 'bar' | 'line' | 'pie' | 'table';
}

// ── Colour palette for charts ─────────────────────────────────────────────────
const CHART_COLORS = ['#7c6ff7', '#e8b84b', '#34d399', '#f87171', '#60a5fa', '#a78bfa', '#fb923c'];

// ── Formatters ────────────────────────────────────────────────────────────────
function formatValue(val: any): string {
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
    return val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return String(val);
}

// ── Chart Renderer ────────────────────────────────────────────────────────────
function ChartRenderer({ data, chartType }: { data: Record<string, any>[]; chartType: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)]">
        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        <p className="text-sm">No data returned</p>
      </div>
    );
  }

  const keys = Object.keys(data[0]);
  const dimKey = keys[0];
  const metricKeys = keys.slice(1);
  const firstMetricKey = metricKeys[0] || dimKey;

  const tooltipStyle = {
    contentStyle: {
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-dim)',
      borderRadius: '12px',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-dm-mono)',
      fontSize: '12px',
    },
    itemStyle: { color: 'var(--accent-hover)' },
    cursor: { fill: 'rgba(255,255,255,0.03)' },
  };

  // ── KPI Card ──
  if (chartType === 'kpi') {
    const val = data[0][dimKey] ?? data[0][firstMetricKey];
    const label = (dimKey === firstMetricKey ? dimKey : firstMetricKey).replace(/_/g, ' ');
    const isMonetary = ['revenue', 'spend', 'refund', 'cost', 'value', 'cac', 'roas', 'aov'].some(k => label.includes(k));
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-5">{label}</span>
        <div className="text-7xl font-light tracking-tight text-[var(--text-primary)] mb-2">
          {isMonetary ? '$' : ''}{typeof val === 'number' ? formatValue(val) : val}
        </div>
        <div className="mt-4 flex items-center gap-2 tag-gold px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] pulse-dot" />
          <span className="text-xs font-medium">Live Compute</span>
        </div>
      </div>
    );
  }

  // ── Line Chart ──
  if (chartType === 'line') {
    return (
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey={dimKey} stroke="var(--border-dim)" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-mono)' }} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--border-dim)" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => formatValue(v)} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [formatValue(v), '']} />
            {metricKeys.map((k, i) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: CHART_COLORS[i % CHART_COLORS.length], strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // ── Pie Chart ──
  if (chartType === 'pie') {
    const total = data.reduce((s, r) => s + (Number(r[firstMetricKey]) || 0), 0);
    return (
      <div className="h-[360px] w-full flex items-center">
        <ResponsiveContainer width="50%" height="100%">
          <PieChart>
            <Pie data={data} dataKey={firstMetricKey} nameKey={dimKey} cx="50%" cy="50%" innerRadius={70} outerRadius={130} paddingAngle={2} strokeWidth={0}>
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: any) => [formatValue(v), '']} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 flex flex-col gap-2 pl-4 overflow-y-auto max-h-[320px] pr-2">
          {data.map((row, i) => {
            const pct = total > 0 ? ((Number(row[firstMetricKey]) / total) * 100).toFixed(1) : 0;
            return (
              <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-sm text-[var(--text-secondary)] truncate">{String(row[dimKey])}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{formatValue(row[firstMetricKey])}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Table ──
  if (chartType === 'table') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-dim)] bg-[var(--bg-muted)]">
              {keys.map(k => (
                <th key={k} className="p-3 text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)]">
                  {k.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-muted)] transition-colors">
                {keys.map(k => (
                  <td key={k} className="p-3 text-[var(--text-secondary)] font-mono text-xs">
                    {typeof row[k] === 'number' ? formatValue(row[k]) : String(row[k] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── Bar Chart (default) ──
  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey={dimKey} stroke="var(--border-dim)" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-mono)' }} axisLine={false} tickLine={false} />
          <YAxis stroke="var(--border-dim)" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-dm-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => formatValue(v)} />
          <Tooltip {...tooltipStyle} formatter={(v: any) => [formatValue(v), '']} />
          {metricKeys.map((k, i) => (
            <Bar key={k} dataKey={k} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Chart type badge ──────────────────────────────────────────────────────────
const CHART_LABELS: Record<string, { label: string; icon: string }> = {
  kpi:   { label: 'KPI',        icon: '◆' },
  bar:   { label: 'Bar Chart',  icon: '▊' },
  line:  { label: 'Trend Line', icon: '∿' },
  pie:   { label: 'Pie Chart',  icon: '◕' },
  table: { label: 'Data Table', icon: '⊟' },
};

// ── Example prompts ───────────────────────────────────────────────────────────
const EXAMPLE_QUERIES = [
  'What is our total revenue?',
  'Show net revenue by customer segment',
  'Total revenue trend by month',
  'Ad spend breakdown by campaign platform',
  'Average resolution time by issue type',
];

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState('');
  const [showPlan, setShowPlan] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { handleLogout(); return; }
        throw new Error(data.detail || 'Query execution failed');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans overflow-x-hidden relative">

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[var(--accent-primary)] opacity-[0.04] blur-[180px] rounded-full pointer-events-none" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex justify-between items-center px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-base)/80] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-primary)/30] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="2" fill="var(--accent-primary)"/>
              <rect x="16" y="2" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.5"/>
              <rect x="2" y="16" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.5"/>
              <rect x="16" y="16" width="10" height="10" rx="2" fill="var(--gold)" opacity="0.8"/>
            </svg>
          </div>
          <span className="font-medium tracking-tight text-[var(--text-primary)]">VeraBase</span>
          <span className="hidden sm:inline-flex items-center gap-1 tag-gold px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase">
            <span className="w-1 h-1 rounded-full bg-[var(--gold)] pulse-dot" /> Live
          </span>
        </div>
        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <button
              onClick={() => router.push('/admin')}
              className="text-xs text-[var(--accent-hover)] bg-[var(--accent-subtle)] hover:bg-[rgba(124,111,247,0.14)] border border-[rgba(124,111,247,0.2)] px-4 py-2 rounded-lg transition-all duration-200 font-medium"
            >
              Control Center →
            </button>
          )}
          <div className="hidden sm:block text-xs text-[var(--text-muted)]">
            <span className="text-[var(--text-secondary)]">{user?.name}</span>
            <span className="ml-1.5 tag-violet px-1.5 py-0.5 rounded">{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--red)] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Exit
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-16 pb-24 relative z-10">

        {/* ── Hero text ──────────────────────────────────────────────── */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="text-4xl font-light tracking-tight text-[var(--text-primary)] mb-3">
            Ask your data anything
          </h1>
          <p className="text-[var(--text-muted)] font-light max-w-md mx-auto text-sm leading-relaxed">
            Type a question in plain English. The engine translates it to SQL, executes it securely, and renders the right visualization.
          </p>
        </div>

        {/* ── Search bar ─────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-6 group animate-fade-up-delay">
          <div className="absolute inset-0 rounded-2xl bg-[var(--accent-primary)] opacity-0 group-focus-within:opacity-10 blur-xl transition-opacity duration-500 pointer-events-none" />
          <div className="relative flex items-center bg-[var(--bg-elevated)] border border-[var(--border-dim)] rounded-2xl px-4 py-2 shadow-xl transition-all focus-within:border-[var(--accent-primary)/60]">
            <svg className="w-5 h-5 text-[var(--text-muted)] ml-1 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              id="query-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Show total revenue by customer segment"
              className="flex-1 bg-transparent border-none outline-none px-2 py-3.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] text-base font-light"
              disabled={loading}
            />
            <button
              type="submit"
              id="query-submit"
              disabled={loading || !query}
              className="shrink-0 btn-accent px-6 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none ml-2"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : 'Execute'}
            </button>
          </div>
        </form>

        {/* ── Example queries ─────────────────────────────────────────── */}
        {!result && !loading && (
          <div className="flex flex-wrap gap-2 justify-center mb-12 animate-fade-up-delay-2">
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="text-xs px-3 py-1.5 rounded-lg glass border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-dim)] transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── Error state ─────────────────────────────────────────────── */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 mb-6 bg-red-950/20 border border-red-500/20 rounded-xl text-red-300 flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-[var(--red)] pulse-dot shrink-0" />
            {error}
          </div>
        )}

        {/* ── Loading skeleton ─────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4 animate-fade-up">
            <div className="glass-elevated rounded-2xl p-8">
              <div className="shimmer h-5 w-40 rounded-lg mb-6" />
              <div className="shimmer h-64 rounded-xl" />
            </div>
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────── */}
        {result && !loading && (
          <div className="space-y-4 animate-fade-up">

            {/* Chart type badge */}
            <div className="flex items-center gap-2">
              <div className="tag-violet px-3 py-1.5 rounded-full flex items-center gap-2">
                <span>{CHART_LABELS[result.recommended_chart_type]?.icon}</span>
                <span className="font-medium tracking-wider uppercase text-[10px]">
                  {CHART_LABELS[result.recommended_chart_type]?.label}
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{result.data.length} row{result.data.length !== 1 ? 's' : ''} returned</span>
            </div>

            {/* Main visualization card */}
            <div className="glass-elevated rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-[var(--accent-primary)] rounded-full" />
                <h2 className="text-base font-medium text-[var(--text-primary)]">Query Results</h2>
              </div>
              <ChartRenderer data={result.data} chartType={result.recommended_chart_type} />
            </div>

            {/* Execution plan accordion */}
            <div className="glass rounded-2xl overflow-hidden">
              <button
                id="toggle-plan"
                onClick={() => setShowPlan(!showPlan)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--bg-muted)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">View Execution Plan & SQL</span>
                </div>
                <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${showPlan ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPlan && (
                <div className="px-6 pb-6 border-t border-[var(--border-subtle)] bg-[var(--bg-base)/50]">
                  <div className="pt-4 space-y-4">
                    {result.execution_plan.validated_joins?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">BFS Join Path</p>
                        <div className="flex flex-wrap gap-2">
                          {result.execution_plan.validated_joins.map((j: string, i: number) => (
                            <span key={i} className="tag-violet px-2.5 py-1 rounded-lg text-xs font-mono">{j}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Generated SQL</p>
                      <pre className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--emerald)] font-mono text-xs overflow-x-auto leading-relaxed">
                        <code>{result.sql_query}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}