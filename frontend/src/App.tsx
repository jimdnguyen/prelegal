import { createSignal } from 'solid-js';
import NdaForm from './NdaForm';
import NdaPreview from './NdaPreview';
import { defaultFormData } from './types';

export default function App() {
  const [formData, setFormData] = createSignal(defaultFormData);

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
            <span class="badge">Prototype</span>
            <span class="header-hint">Fill in the form to generate your Mutual NDA</span>
          </div>
        </div>
      </header>

      <main class="app-main">
        <aside class="form-pane">
          <NdaForm data={formData()} setData={setFormData} />
        </aside>
        <section class="preview-pane">
          <NdaPreview data={formData()} />
        </section>
      </main>
    </div>
  );
}
