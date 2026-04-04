import { createSignal } from 'solid-js';
import Chat from './Chat';
import NdaPreview from './NdaPreview';
import { defaultFormData } from './types';
import type { NdaFormData } from './types';

export default function App() {
  const [formData, setFormData] = createSignal(defaultFormData);

  function applyFieldUpdates(updates: Partial<NdaFormData>) {
    setFormData(prev => ({ ...prev, ...updates }));
  }

  return (
    <div class="app">
      <header class="app-header">
        <div class="header-content">
          <div class="header-brand">
            <span class="brand-icon">⚖️</span>
            <div>
              <h1>Prelegal</h1>
              <p>Mutual NDA Creator</p>
            </div>
          </div>
          <div class="header-meta">
            <span class="badge">AI Chat</span>
            <span class="header-hint">Chat with the AI to fill in your Mutual NDA</span>
          </div>
        </div>
      </header>

      <main class="app-main">
        <aside class="form-pane">
          <Chat onFieldUpdates={applyFieldUpdates} />
        </aside>
        <section class="preview-pane">
          <NdaPreview data={formData()} />
        </section>
      </main>
    </div>
  );
}
