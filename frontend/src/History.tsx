import { createResource, createSignal, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from './AuthContext';
import type { SavedDocumentSummary, SavedDocument } from './types';

export default function History() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  // Route guard — redirect unauthenticated users and guests to login
  if (!auth().token || auth().isGuest) {
    navigate('/', { replace: true });
    return null;
  }

  const [openError, setOpenError] = createSignal('');

  const [docs, { refetch }] = createResource<SavedDocumentSummary[]>(async () => {
    const token = auth().token;
    if (!token) return [];
    const res = await fetch('/api/documents', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      logout();
      navigate('/');
      return [];
    }
    if (!res.ok) return [];
    return res.json();
  });

  async function openDocument(id: number) {
    const token = auth().token;
    if (!token) return;
    setOpenError('');
    const res = await fetch(`/api/documents/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setOpenError(res.status === 404 ? 'Document not found.' : 'Failed to load document. Please try again.');
      return;
    }
    const doc: SavedDocument = await res.json();
    navigate('/app', { state: { resumeDoc: doc } });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  return (
    <div class="app">
      <header class="app-header">
        <div class="header-content">
          <div class="header-brand">
            <span class="brand-icon">⚖️</span>
            <div>
              <h1>Prelegal</h1>
              <p>My Documents</p>
            </div>
          </div>
          <div class="header-meta">
            <button class="btn-nav" onClick={() => navigate('/app')}>New Document</button>
            <Show when={auth().user}>
              <span class="header-user">{auth().user!.email}</span>
            </Show>
            <button class="btn-logout" onClick={() => { logout(); navigate('/'); }}>Sign Out</button>
          </div>
        </div>
      </header>

      <main class="history-main">
        <div class="history-container">
          <h2 class="history-title">My Saved Documents</h2>

          {openError() && <div class="login-error" style="margin-bottom:16px">{openError()}</div>}

          <Show
            when={!docs.loading}
            fallback={<div class="history-empty">Loading…</div>}
          >
            <Show
              when={(docs() ?? []).length > 0}
              fallback={
                <div class="history-empty">
                  <p>No saved documents yet.</p>
                  <button class="btn btn-primary" onClick={() => navigate('/app')}>
                    Create your first document
                  </button>
                </div>
              }
            >
              <div class="history-list">
                <For each={docs()}>
                  {doc => (
                    <button class="history-card" onClick={() => openDocument(doc.id)}>
                      <div class="history-card-body">
                        <div class="history-card-title">{doc.title}</div>
                        <div class="history-card-type">{doc.document_type}</div>
                      </div>
                      <div class="history-card-date">{formatDate(doc.created_at)}</div>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </div>
      </main>
    </div>
  );
}
