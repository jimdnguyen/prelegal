import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import History from './History';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
let authToken: string | null = 'tok';
let authIsGuest = false;

vi.mock('@solidjs/router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    auth: () => ({
      token: authToken,
      isGuest: authIsGuest,
      user: authToken ? { user_id: 1, email: 'user@test.com' } : null,
    }),
    logout: mockLogout,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  authToken = 'tok';
  authIsGuest = false;
});

describe('History', () => {
  it('redirects to / when not authenticated', () => {
    authToken = null;
    render(() => <History />);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('redirects to / when user is a guest', () => {
    authToken = null;
    authIsGuest = true;
    render(() => <History />);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('shows loading state while fetching', () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => new Promise(() => {})));
    render(() => <History />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('renders list of saved documents', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, title: 'My NDA', document_type: 'Mutual NDA', created_at: '2025-01-15T00:00:00Z' },
        { id: 2, title: 'My SLA', document_type: 'SLA', created_at: '2025-02-01T00:00:00Z' },
      ]),
    }));
    render(() => <History />);
    expect(await screen.findByText('My NDA')).toBeTruthy();
    expect(screen.getByText('My SLA')).toBeTruthy();
  });

  it('shows empty state when user has no documents', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    }));
    render(() => <History />);
    expect(await screen.findByText(/no saved documents/i)).toBeTruthy();
  });

  it('navigates to /app with document data on card click', async () => {
    const mockDoc = { id: 1, title: 'My NDA', document_type: 'Mutual NDA', form_data: {}, created_at: '2025-01-15T00:00:00Z' };
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1, title: 'My NDA', document_type: 'Mutual NDA', created_at: '2025-01-15T00:00:00Z' }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDoc),
      })
    );
    render(() => <History />);
    const card = await screen.findByText('My NDA');
    card.closest('button')!.click();
    await new Promise(r => setTimeout(r, 50));
    expect(mockNavigate).toHaveBeenCalledWith('/app', { state: { resumeDoc: mockDoc } });
  });

  it('shows not found error when document open returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 1, title: 'My NDA', document_type: 'Mutual NDA', created_at: '2025-01-15T00:00:00Z' }]),
      })
      .mockResolvedValueOnce({ ok: false, status: 404 })
    );
    render(() => <History />);
    const card = await screen.findByText('My NDA');
    card.closest('button')!.click();
    await new Promise(r => setTimeout(r, 50));
    expect(await screen.findByText(/document not found/i)).toBeTruthy();
  });

  it('logs out and redirects to / on 401 from document list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    render(() => <History />);
    await new Promise(r => setTimeout(r, 100));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
