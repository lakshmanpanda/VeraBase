'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginGateway() {
  const router = useRouter();
  const [email, setEmail] = useState('alice@techcorp.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Redirect if already logged in
    const token = localStorage.getItem('token');
    if (token) router.push('/dashboard');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // FIXED: Proper RBAC routing — admins go to control center
      if (data.user.role === 'admin' || data.user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (em: string, pw: string) => { setEmail(em); setPassword(pw); };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#080809] bg-grid flex items-center justify-center overflow-hidden relative font-sans">

      {/* Ambient glows */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[var(--accent-primary)] opacity-[0.06] blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[var(--gold)] opacity-[0.04] blur-[120px] rounded-full pointer-events-none" />

      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div style={{ animation: 'scan 8s linear infinite' }} className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent" />
      </div>

      <div className="w-full max-w-[440px] px-6 relative z-10">

        {/* Logo mark */}
        <div className="flex flex-col items-center mb-10 animate-fade-up">
          <div className="mb-6 relative">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent-primary)/30] flex items-center justify-center glow-violet">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="2" y="2" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.9"/>
                <rect x="16" y="2" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.5"/>
                <rect x="2" y="16" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.5"/>
                <rect x="16" y="16" width="10" height="10" rx="2" fill="var(--gold)" opacity="0.8"/>
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--emerald)] pulse-dot" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass tag-gold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] pulse-dot" />
            <span className="text-xs tracking-widest uppercase font-medium">Enterprise Platform</span>
          </div>

          <h1 className="text-[32px] font-light tracking-tight text-[var(--text-primary)] mb-2 text-center leading-none">
            VeraBase
          </h1>
          <p className="text-[var(--text-muted)] text-sm font-light text-center leading-relaxed">
            Natural language. Enterprise SQL. Zero guesswork.
          </p>
        </div>

        {/* Login card */}
        <div className="glass-elevated rounded-2xl p-8 animate-fade-up-delay shadow-2xl shadow-black/40">

          {/* Quick access pills */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => quickLogin('alice@techcorp.com', 'password123')}
              className="flex-1 text-xs py-2 px-3 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-hover)] border border-[var(--accent-primary)/20] hover:border-[var(--accent-primary)/40] transition-all font-medium truncate"
            >
              👑 Admin — TechCorp
            </button>
            <button
              type="button"
              onClick={() => quickLogin('bob@techcorp.com', 'password123')}
              className="flex-1 text-xs py-2 px-3 rounded-lg bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-dim)] transition-all font-medium truncate"
            >
              👤 Employee — TechCorp
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 pulse-dot shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">
                Corporate Email
              </label>
              <div className="relative flex items-center bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus-within:border-[var(--accent-primary)] transition-colors duration-200 group">
                <svg className="w-4 h-4 text-[var(--text-muted)] mr-3 shrink-0 group-focus-within:text-[var(--accent-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-sm font-light placeholder-[var(--text-muted)]"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">
                Access Key
              </label>
              <div className="relative flex items-center bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus-within:border-[var(--accent-primary)] transition-colors duration-200 group">
                <svg className="w-4 h-4 text-[var(--text-muted)] mr-3 shrink-0 group-focus-within:text-[var(--accent-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-sm font-light placeholder-[var(--text-muted)]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full mt-2 btn-accent py-3.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  Initialize Session
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center animate-fade-up-delay-2">
          <p className="text-[var(--text-muted)] text-xs font-light tracking-wide">
            Secured by JWT · Multi-Tenant Isolation · Semantic AI
          </p>
        </div>
      </div>
    </main>
  );
}