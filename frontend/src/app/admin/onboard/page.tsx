'use client';

import { useState } from 'react';

interface NewTenantForm {
  companyName: string;
  tier: 'Enterprise' | 'Pro' | 'Growth';
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export default function TenantOnboardingPage() {
  const [form, setForm] = useState<NewTenantForm>({
    companyName: '',
    tier: 'Pro',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [step, setStep] = useState<'form' | 'preview' | 'done'>('form');
  const [generatedId] = useState(() => Math.floor(Math.random() * 9000) + 1000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('preview');
  };

  const handleConfirm = () => {
    // In production: POST /api/admin/tenants to create company + admin employee
    // For MVP demo: show the "success" state
    setStep('done');
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-[var(--text-primary)] mb-2 tracking-tight">Tenant Onboarding</h1>
        <p className="text-[var(--text-muted)] text-sm font-light">
          Register a new client company into the VeraBase multi-tenant data warehouse.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {['Configure', 'Review', 'Complete'].map((label, i) => {
          const stepIndex = i;
          const currentIndex = step === 'form' ? 0 : step === 'preview' ? 1 : 2;
          const isDone = currentIndex > stepIndex;
          const isActive = currentIndex === stepIndex;
          return (
            <div key={label} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isDone ? 'bg-[var(--emerald)/15] text-[var(--emerald)] border border-[var(--emerald)/20]' :
                isActive ? 'bg-[var(--accent-subtle)] text-[var(--accent-hover)] border border-[rgba(124,111,247,0.3)]' :
                'bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
              }`}>
                {isDone ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{i + 1}</span>
                )}
                <span>{label}</span>
              </div>
              {i < 2 && <div className="w-6 h-px bg-[var(--border-subtle)]" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Form ─────────────────────────────────────────────── */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="glass-elevated rounded-2xl p-8 max-w-2xl">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-[var(--accent-primary)] rounded-full" />
            Company Details
          </h2>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  id="company-name"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)]"
                  placeholder="e.g., Acme Corp"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">
                  Subscription Tier
                </label>
                <select
                  id="tier"
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value as any })}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors"
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="Pro">Pro</option>
                  <option value="Growth">Growth</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-5">
              <h3 className="text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-4">
                Tenant Admin Account
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Full Name</label>
                  <input
                    type="text"
                    id="admin-name"
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)]"
                    placeholder="Jane Smith"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Admin Email</label>
                  <input
                    type="email"
                    id="admin-email"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)]"
                    placeholder="admin@acmecorp.com"
                    required
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="block text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Temporary Password</label>
                <input
                  type="password"
                  id="admin-password"
                  value={form.adminPassword}
                  onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-colors placeholder-[var(--text-muted)]"
                  placeholder="Set a temporary access key"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="onboard-preview"
                className="btn-accent px-8 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
              >
                Preview Manifest
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Step 2: Preview ──────────────────────────────────────────── */}
      {step === 'preview' && (
        <div className="glass-elevated rounded-2xl p-8 max-w-2xl animate-fade-up">
          <h2 className="text-lg font-medium text-[var(--text-primary)] mb-6 flex items-center gap-2">
            <span className="w-1 h-5 bg-[var(--gold)] rounded-full" />
            Onboarding Manifest
          </h2>

          <div className="space-y-3 mb-8">
            {[
              { label: 'Company ID (Auto-Generated)', value: `CMP-${generatedId}`, mono: true },
              { label: 'Company Name', value: form.companyName },
              { label: 'Subscription Tier', value: form.tier },
              { label: 'Admin Name', value: form.adminName },
              { label: 'Admin Email', value: form.adminEmail },
              { label: 'Data Isolation', value: `WHERE company_id = ${generatedId}`, mono: true },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-xs text-[var(--text-muted)] tracking-wide">{label}</span>
                <span className={`text-sm ${mono ? 'font-mono text-[var(--emerald)] text-xs' : 'text-[var(--text-primary)] font-medium'}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[var(--gold-dim)] border border-[rgba(232,184,75,0.2)] mb-6">
            <div className="flex gap-2 text-[var(--gold)] text-xs">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>This will INSERT a new company and admin employee record into the SQLite data warehouse. All queries for this tenant will be automatically isolated.</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="px-6 py-3 rounded-xl text-sm font-medium text-[var(--text-muted)] bg-[var(--bg-muted)] border border-[var(--border-subtle)] hover:border-[var(--border-dim)] transition-all"
            >
              Back
            </button>
            <button
              id="onboard-confirm"
              onClick={handleConfirm}
              className="btn-accent px-8 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              Confirm & Provision
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ─────────────────────────────────────────────── */}
      {step === 'done' && (
        <div className="glass-elevated rounded-2xl p-12 max-w-2xl text-center animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-[var(--emerald)/15] border border-[var(--emerald)/20] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[var(--emerald)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-light text-[var(--text-primary)] mb-2">Tenant Provisioned</h2>
          <p className="text-[var(--text-muted)] text-sm font-light mb-2">
            <strong className="text-[var(--text-primary)]">{form.companyName}</strong> has been onboarded.
          </p>
          <p className="text-[var(--text-muted)] text-xs font-mono mb-8 bg-[var(--bg-muted)] px-4 py-2 rounded-lg inline-block">
            Company ID: CMP-{generatedId}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setStep('form'); setForm({ companyName: '', tier: 'Pro', adminName: '', adminEmail: '', adminPassword: '' }); }}
              className="btn-accent px-6 py-3 rounded-xl text-sm font-medium"
            >
              Add Another Client
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
