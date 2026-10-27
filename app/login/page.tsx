'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Wrong password. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
         style={{ background: 'var(--hot-bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'var(--hot-primary-light)' }}>
            <span className="text-3xl">🔥</span>
          </div>
          <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--hot-text)' }}>
            Goals Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--hot-muted)' }}>
            $10K months. Act like it.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--hot-text-2)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full h-12 px-4 rounded-xl border text-base outline-none transition-all"
              style={{
                background: 'var(--hot-surface)',
                borderColor: error ? 'var(--hot-danger)' : 'var(--hot-border)',
                color: 'var(--hot-text)',
              }}
              onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'var(--hot-primary)'; }}
              onBlur={e => { if (!error) e.currentTarget.style.borderColor = 'var(--hot-border)'; }}
            />
            {error && (
              <p className="mt-1.5 text-sm" style={{ color: 'var(--hot-danger)' }}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-12 rounded-xl font-medium text-base transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'var(--hot-primary)', color: '#fff' }}
          >
            {loading ? 'Opening…' : 'Open dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
