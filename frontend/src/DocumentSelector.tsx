import { createResource, For, Show } from 'solid-js';
import type { CatalogEntry } from './types';

interface Props {
  onSelect: (documentType: string) => void;
}

export default function DocumentSelector(props: Props) {
  const [catalog] = createResource<CatalogEntry[]>(async () => {
    const res = await fetch('/api/catalog');
    return res.json();
  });

  return (
    <div class="doc-selector">
      <div class="doc-selector-header">
        <h2>What document would you like to create?</h2>
        <p>Select a document type and our AI assistant will guide you through filling it in.</p>
      </div>

      <Show when={catalog()} fallback={<div class="doc-selector-loading">Loading documents…</div>}>
        <div class="doc-grid" role="list">
          <For each={catalog()}>
            {entry => (
              <button
                class="doc-card"
                role="listitem"
                aria-label={`Create ${entry.name}`}
                onClick={() => props.onSelect(entry.name)}
              >
                <div class="doc-card-name">{entry.name}</div>
                <div class="doc-card-desc">{entry.description}</div>
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
