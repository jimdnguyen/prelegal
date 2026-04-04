import { createSignal, Show } from 'solid-js';
import { useNavigate, useLocation } from '@solidjs/router';
import Chat from './Chat';
import NdaPreview from './NdaPreview';
import DocumentPreview from './DocumentPreview';
import DocumentSelector from './DocumentSelector';
import { useAuth } from './AuthContext';
import type { DocumentFormData, SavedDocument } from './types';

export default function App() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation<{ resumeDoc?: SavedDocument }>();

  // Route guard — redirect unauthenticated users to login
  if (!auth().token) {
    navigate('/', { replace: true });
    return null;
  }

  const resume = location.state?.resumeDoc;

  const [documentType, setDocumentType] = createSignal<string | null>(resume?.document_type ?? null);
  const [formData, setFormData] = createSignal<DocumentFormData>(resume?.form_data ?? {});
  const [resumeDocId, setResumeDocId] = createSignal<number | null>(resume?.id ?? null);

  function selectDocument(docType: string) {
    setDocumentType(docType);
    setFormData({});
    setResumeDocId(null);
  }

  function applyFieldUpdates(updates: DocumentFormData) {
    setFormData(prev => ({ ...prev, ...updates }));
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const isNda = () => documentType() === 'Mutual Non-Disclosure Agreement';
  const docName = () => documentType() ?? '';

  return (
    <div class="app">
      <header class="app-header">
        <div class="header-content">
          <div class="header-brand">
            <span class="brand-icon">⚖️</span>
            <div>
              <h1>Prelegal</h1>
              <p>{documentType() ?? 'Legal Document Creator'}</p>
            </div>
          </div>
          <div class="header-meta">
            <Show when={documentType()}>
              <span class="badge">AI Chat</span>
              <button class="btn-change-doc" onClick={() => { setDocumentType(null); setFormData({}); }}>
                Change Document
              </button>
            </Show>
            <button class="btn-nav" onClick={() => navigate('/history')}>My Documents</button>
            <Show when={auth().user}>
              <span class="header-user">{auth().user!.email}</span>
            </Show>
            <button class="btn-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </header>

      <Show
        when={documentType()}
        fallback={
          <main class="selector-main">
            <DocumentSelector onSelect={selectDocument} />
          </main>
        }
      >
        <main class="app-main">
          <aside class="form-pane">
            <Chat documentType={docName()} onFieldUpdates={applyFieldUpdates} />
          </aside>
          <section class="preview-pane">
            <Show
              when={isNda()}
              fallback={
                <DocumentPreview
                  documentType={docName()}
                  data={formData()}
                  savedDocId={resumeDocId()}
                />
              }
            >
              <NdaPreview data={formData()} />
            </Show>
          </section>
        </main>
      </Show>
    </div>
  );
}
