import { createSignal, Show } from 'solid-js';
import Chat from './Chat';
import NdaPreview from './NdaPreview';
import DocumentPreview from './DocumentPreview';
import DocumentSelector from './DocumentSelector';
import type { DocumentFormData } from './types';

export default function App() {
  const [documentType, setDocumentType] = createSignal<string | null>(null);
  const [formData, setFormData] = createSignal<DocumentFormData>({});

  function selectDocument(docType: string) {
    setDocumentType(docType);
    setFormData({});
  }

  function applyFieldUpdates(updates: DocumentFormData) {
    setFormData(prev => ({ ...prev, ...updates }));
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
              fallback={<DocumentPreview documentType={docName()} data={formData()} />}
            >
              <NdaPreview data={formData()} />
            </Show>
          </section>
        </main>
      </Show>
    </div>
  );
}
