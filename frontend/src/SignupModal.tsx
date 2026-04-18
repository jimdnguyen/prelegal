import { createSignal } from 'solid-js';
import type { AuthUser } from './AuthContext';

interface Props {
  onSuccess: (token: string, user: AuthUser) => void;
  onClose: () => void;
}

export default function SignupModal(props: Props) {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  async function submit(e: Event) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email(), password: password() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ?? 'Registration failed');
        return;
      }
      props.onSuccess(data.token, { user_id: data.user_id, email: data.email });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  }

  return (
    <div class="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button class="modal-close" onClick={props.onClose} aria-label="Close sign up dialog">
          &times;
        </button>
        <h2 class="modal-title" id="modal-title">Sign up to save your document</h2>
        <p class="modal-subtitle">Create an account to save and access your documents anytime.</p>

        <form class="modal-form" onSubmit={submit} aria-label="Create account form">
          <div class="form-group">
            <label class="form-label" for="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              class="form-input"
              placeholder="you@example.com"
              value={email()}
              onInput={e => setEmail(e.currentTarget.value)}
              required
              autocomplete="email"
              aria-label="Email address"
            />
          </div>
          <div class="form-group">
            <label class="form-label" for="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              class="form-input"
              placeholder="Create a password"
              value={password()}
              onInput={e => setPassword(e.currentTarget.value)}
              required
              autocomplete="new-password"
              aria-label="Password (minimum 8 characters)"
            />
          </div>
          {error() && <div class="login-error" role="alert">{error()}</div>}
          <button class="btn btn-primary" type="submit" disabled={loading()}>
            {loading() ? 'Creating account...' : 'Create Account & Save'}
          </button>
        </form>
      </div>
    </div>
  );
}
