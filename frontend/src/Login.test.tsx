import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import Login from './Login';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();
const mockLoginAsGuest = vi.fn();

vi.mock('@solidjs/router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, loginAsGuest: mockLoginAsGuest }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function fillForm(container: HTMLElement, email: string, password: string) {
  const emailInput = container.querySelector('#email') as HTMLInputElement;
  const passwordInput = container.querySelector('#password') as HTMLInputElement;
  emailInput.value = email;
  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.value = password;
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('Login', () => {
  it('renders sign-in tab active by default', () => {
    render(() => <Login />);
    const signinTab = screen.getByRole('tab', { name: /sign in/i });
    expect(signinTab.getAttribute('aria-selected')).toBe('true');
  });

  it('switches to Create Account tab on click', () => {
    render(() => <Login />);
    const signupTab = screen.getByRole('tab', { name: /create account/i });
    signupTab.click();
    expect(signupTab.getAttribute('aria-selected')).toBe('true');
  });

  it('calls /api/auth/login on sign-in submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'tok', user_id: 1, email: 'a@b.com' }),
    }));
    const { container } = render(() => <Login />);
    fillForm(container, 'a@b.com', 'Password1');
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }));
    expect(mockLogin).toHaveBeenCalledWith('tok', { user_id: 1, email: 'a@b.com' });
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });

  it('calls /api/auth/register on sign-up submit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'tok', user_id: 2, email: 'new@b.com' }),
    }));
    const { container } = render(() => <Login />);
    screen.getByRole('tab', { name: /create account/i }).click();
    fillForm(container, 'new@b.com', 'Password1');
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({ method: 'POST' }));
  });

  it('shows error message from API on failed login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Invalid credentials' }),
    }));
    const { container } = render(() => <Login />);
    fillForm(container, 'bad@b.com', 'wrongpass');
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(await screen.findByText('Invalid credentials')).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows network error message on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { container } = render(() => <Login />);
    fillForm(container, 'a@b.com', 'Password1');
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true }));
    expect(await screen.findByText(/network error/i)).toBeTruthy();
  });

  it('Continue as Guest calls loginAsGuest and navigates to /app', () => {
    render(() => <Login />);
    screen.getByRole('button', { name: /continue as guest/i }).click();
    expect(mockLoginAsGuest).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/app');
  });
});
