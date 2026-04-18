import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@solidjs/testing-library';
import { AuthProvider, useAuth } from './AuthContext';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

function AuthConsumer() {
  const { auth, login, loginAsGuest, logout } = useAuth();
  return (
    <div>
      <span data-testid="token">{auth().token ?? 'none'}</span>
      <span data-testid="guest">{String(auth().isGuest)}</span>
      <span data-testid="email">{auth().user?.email ?? 'none'}</span>
      <button data-testid="btn-login" onClick={() => login('tok123', { user_id: 1, email: 'user@test.com' })}>login</button>
      <button data-testid="btn-guest" onClick={() => loginAsGuest()}>guest</button>
      <button data-testid="btn-logout" onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthProvider', () => {
  it('starts with empty auth state when localStorage is clear', () => {
    render(() => <AuthProvider><AuthConsumer /></AuthProvider>);
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(screen.getByTestId('guest').textContent).toBe('false');
    expect(screen.getByTestId('email').textContent).toBe('none');
  });

  it('login() updates state and persists token to localStorage', () => {
    render(() => <AuthProvider><AuthConsumer /></AuthProvider>);
    fireEvent.click(screen.getByTestId('btn-login'));
    expect(screen.getByTestId('token').textContent).toBe('tok123');
    expect(screen.getByTestId('email').textContent).toBe('user@test.com');
    const stored = JSON.parse(localStorage.getItem('prelegal_auth')!);
    expect(stored.token).toBe('tok123');
    expect(stored.user.email).toBe('user@test.com');
  });

  it('loginAsGuest() sets isGuest and removes auth from localStorage', () => {
    localStorage.setItem('prelegal_auth', JSON.stringify({ token: 'old', user: null, isGuest: false }));
    render(() => <AuthProvider><AuthConsumer /></AuthProvider>);
    fireEvent.click(screen.getByTestId('btn-guest'));
    expect(screen.getByTestId('guest').textContent).toBe('true');
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(localStorage.getItem('prelegal_auth')).toBeNull();
  });

  it('logout() clears state and removes both storage keys', () => {
    localStorage.setItem('prelegal_auth', JSON.stringify({ token: 'tok', user: { user_id: 1, email: 'a@b.com' }, isGuest: false }));
    localStorage.setItem('prelegal_guest_form', '{"documentType":"NDA"}');
    render(() => <AuthProvider><AuthConsumer /></AuthProvider>);
    fireEvent.click(screen.getByTestId('btn-logout'));
    expect(screen.getByTestId('token').textContent).toBe('none');
    expect(screen.getByTestId('guest').textContent).toBe('false');
    expect(localStorage.getItem('prelegal_auth')).toBeNull();
    expect(localStorage.getItem('prelegal_guest_form')).toBeNull();
  });

  it('restores auth state from localStorage on mount', () => {
    localStorage.setItem('prelegal_auth', JSON.stringify({
      token: 'restored-tok',
      user: { user_id: 2, email: 'restored@test.com' },
      isGuest: false,
    }));
    render(() => <AuthProvider><AuthConsumer /></AuthProvider>);
    expect(screen.getByTestId('token').textContent).toBe('restored-tok');
    expect(screen.getByTestId('email').textContent).toBe('restored@test.com');
  });
});

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => render(() => <AuthConsumer />)).toThrow('useAuth must be used within AuthProvider');
  });
});
