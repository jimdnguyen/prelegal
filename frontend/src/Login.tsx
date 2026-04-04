import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from './AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tab, setTab] = createSignal<'signin' | 'signup'>('signin');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  async function submit(e: Event) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = tab() === 'signin' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email(), password: password() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Something went wrong');
        return;
      }
      login(data.token, { user_id: data.user_id, email: data.email });
      navigate('/app');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <span class="login-icon">⚖️</span>
          <h1>Prelegal</h1>
          <p>AI-powered legal document drafting</p>
        </div>

        <div class="login-tabs">
          <button
            class={`login-tab ${tab() === 'signin' ? 'active' : ''}`}
            onClick={() => { setTab('signin'); setError(''); }}
          >
            Sign In
          </button>
          <button
            class={`login-tab ${tab() === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <form class="login-form" onSubmit={submit}>
          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              type="email"
              class="form-input"
              placeholder="you@example.com"
              value={email()}
              onInput={e => setEmail(e.currentTarget.value)}
              required
              autocomplete="email"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-input"
              placeholder="••••••••"
              value={password()}
              onInput={e => setPassword(e.currentTarget.value)}
              required
              autocomplete={tab() === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>
          {error() && <div class="login-error">{error()}</div>}
          <button class="btn btn-primary login-btn" type="submit" disabled={loading()}>
            {loading() ? 'Please wait…' : tab() === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p class="login-disclaimer">
          Documents generated are drafts only and subject to legal review.
        </p>
      </div>
    </div>
  );
}
