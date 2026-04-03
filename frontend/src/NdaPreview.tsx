import type { NdaFormData } from './types';
import { createMemo } from 'solid-js';
import { generateNdaHtml, generateStandaloneHtml } from './ndaTemplate';

interface Props {
  data: NdaFormData;
}

function createBlobUrl(data: NdaFormData): string {
  const content = generateStandaloneHtml(data);
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
}

function buildFilename(data: NdaFormData): string {
  const p1 = data.party1Company || 'Party1';
  const p2 = data.party2Company || 'Party2';
  return `mutual-nda-${p1}-${p2}.html`
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
}

export default function NdaPreview(props: Props) {
  const html = createMemo(() => generateNdaHtml(props.data));

  function downloadHtml() {
    const url = createBlobUrl(props.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildFilename(props.data);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function printDocument() {
    const url = createBlobUrl(props.data);
    const win = window.open(url, '_blank');
    if (!win) {
      URL.revokeObjectURL(url);
      return;
    }
    win.addEventListener('load', () => {
      win.print();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div class="preview-panel">
      <div class="preview-toolbar">
        <span class="preview-label">Live Preview</span>
        <div class="preview-actions">
          <button class="btn btn-secondary" onClick={printDocument} title="Open in new tab and print (save as PDF)">
            Print / Save PDF
          </button>
          <button class="btn btn-primary" onClick={downloadHtml} title="Download as HTML file">
            Download HTML
          </button>
        </div>
      </div>
      <div class="preview-scroll">
        <div class="document-paper" innerHTML={html()} />
      </div>
    </div>
  );
}
