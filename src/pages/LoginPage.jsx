import { useState } from 'react';
import { authAPI } from '../services/api';
import useStore from '../store/useStore';

export default function LoginPage() {
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [form, setForm]       = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useStore((s) => s.setAuth);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ── Client-side validation before hitting the API ──────────────────
  function validate() {
    if (mode === 'register') {
      if (form.username.trim().length < 3 || form.username.trim().length > 20) {
        return 'Username must be 3–20 characters';
      }
      if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
        return 'Username can only contain letters, numbers, and underscores';
      }
    }
    if (!form.email.trim()) {
      return 'Email is required';
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      return 'Invalid email address';
    }
    if (form.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (mode === 'register' && !/.*[A-Z].*/.test(form.password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (mode === 'register' && !/.*[0-9].*/.test(form.password)) {
      return 'Password must contain at least one number';
    }
    return null; // no error
  }

  async function handleSubmit() {
    setError('');

    // Run client-side validation first
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = mode === 'login'
        ? await authAPI.login({ email: form.email, password: form.password })
        : await authAPI.register(form);

      const { accessToken, refreshToken, userId, username } = res.data; // ← added refreshToken
      setAuth({ userId, username }, accessToken, refreshToken);          // ← pass refreshToken
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  // ── Password strength indicator (register only) ────────────────────
  function getPasswordStrength() {
    const p = form.password;
    if (p.length === 0) return null;
    let score = 0;
    if (p.length >= 8)        score++;
    if (/[A-Z]/.test(p))      score++;
    if (/[0-9]/.test(p))      score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++; // special char bonus

    if (score <= 1) return { label: 'Weak',   color: 'bg-red-500',    width: 'w-1/4' };
    if (score === 2) return { label: 'Fair',   color: 'bg-yellow-500', width: 'w-2/4' };
    if (score === 3) return { label: 'Good',   color: 'bg-blue-500',   width: 'w-3/4' };
    return              { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  }

  const strength = mode === 'register' ? getPasswordStrength() : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050508]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NexusChat</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time chat powered by Redis + WebSocket</p>
        </div>

        {/* Card */}
        <div className="bg-[#0d0d12] border border-[#1e293b] rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex bg-[#050508] rounded-lg p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all capitalize
                  ${mode === m
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-500 hover:text-slate-300'}`}>
                {m}
              </button>
            ))}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="text-xs text-slate-500 block mb-1">USERNAME</label>
                <input name="username" value={form.username} onChange={handleChange}
                  placeholder="arjun"
                  className="w-full bg-[#050508] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500" />
                {/* Username hint */}
                <p className="text-xs text-slate-600 mt-1 px-1">
                  3–20 chars, letters/numbers/underscores only
                </p>
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 block mb-1">EMAIL</label>
              <input name="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" type="email"
                className="w-full bg-[#050508] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">PASSWORD</label>
              <input name="password" value={form.password} onChange={handleChange}
                placeholder="••••••••" type="password"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full bg-[#050508] border border-[#1e293b] rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500" />

              {/* Password strength bar — register only */}
              {strength && (
                <div className="mt-2 px-1">
                  <div className="h-1 w-full bg-[#1e293b] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-xs mt-1 ${
                    strength.label === 'Weak'   ? 'text-red-400' :
                    strength.label === 'Fair'   ? 'text-yellow-400' :
                    strength.label === 'Good'   ? 'text-blue-400' :
                    'text-emerald-400'}`}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full mt-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm">
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}