'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  {
    name: 'Semantic Brain',
    path: '/admin/metrics',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    description: 'Metrics & dimensions',
  },
  {
    name: 'Warehouse',
    path: '/admin/warehouse',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    description: 'Data dictionary',
  },
  {
    name: 'Tenant Onboarding',
    path: '/admin/onboard',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    description: 'Add new clients',
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) { router.push('/'); return; }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin' && parsedUser.role !== 'super_admin') {
      router.push('/dashboard');
    } else {
      setUser(parsedUser);
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--accent-primary)]">
          <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm font-medium text-[var(--text-muted)]">Verifying privileges…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans flex flex-col">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <nav className="z-30 flex justify-between items-center px-6 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-base)/80] backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-subtle)] border border-[rgba(124,111,247,0.3)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="2" fill="var(--accent-primary)"/>
              <rect x="16" y="2" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.5"/>
              <rect x="2" y="16" width="10" height="10" rx="2" fill="var(--accent-primary)" opacity="0.5"/>
              <rect x="16" y="16" width="10" height="10" rx="2" fill="var(--gold)" opacity="0.8"/>
            </svg>
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)] tracking-tight">VeraBase</span>
            <span className="text-sm text-[var(--text-muted)]"> / Control Center</span>
          </div>
          <div className="tag-gold px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase">
            Admin
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[var(--text-muted)] hidden sm:block">
            {user?.name}
          </span>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </nav>

      {/* ── Main layout ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-60 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 flex flex-col gap-1 shrink-0">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-3 px-2">Navigation</p>

          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent-hover)] border border-[rgba(124,111,247,0.2)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                }`}>
                  <span className={isActive ? 'text-[var(--accent-primary)]' : 'group-hover:text-[var(--text-secondary)] transition-colors'}>
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-sm font-medium leading-none mb-0.5">{item.name}</div>
                    <div className={`text-[10px] ${isActive ? 'text-[var(--accent-primary)/70]' : 'text-[var(--text-muted)]'}`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Status panel at bottom */}
          <div className="mt-auto pt-4 border-t border-[var(--border-subtle)]">
            <div className="glass px-3 py-3 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--emerald)] pulse-dot" />
                <span className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">System Online</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                PostgreSQL + pgvector<br/>SQLite Warehouse Ready
              </p>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8 relative bg-[var(--bg-base)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--accent-primary)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-5xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}