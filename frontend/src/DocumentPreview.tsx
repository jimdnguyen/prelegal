import { createMemo, createResource, createSignal } from 'solid-js';
import { marked } from 'marked';
import type { DocumentFormData } from './types';
import html2pdf from 'html2pdf.js';

interface Props {
  documentType: string;
  data: DocumentFormData;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fillTemplate(template: string, data: DocumentFormData): string {
  return template.replace(
    /<span class="(?:orderform|keyterms|coverpage)_link">([^<]+)<\/span>/g,
    (_match, fieldName: string) => {
      // Try exact match first
      let value = data[fieldName];
      let suffix = '';

      // Handle possessives: "Customer's" → look up "Customer" and append "'s"
      if (!value || !value.trim()) {
        const possessive = fieldName.match(/^(.+)['\u2019]s$/);
        if (possessive) {
          const base = possessive[1];
          if (data[base]?.trim()) {
            value = data[base];
            suffix = "'s";
          }
        }
      }

      if (value && value.trim()) {
        return `<strong>${escHtml(value + suffix)}</strong>`;
      }
      return `<span class="placeholder">[${fieldName}]</span>`;
    },
  );
}

export default function DocumentPreview(props: Props) {
  const [downloading, setDownloading] = createSignal(false);

  const [rawTemplate] = createResource(
    () => props.documentType,
    async (docType) => {
      const res = await fetch(`/api/templates/${encodeURIComponent(docType)}`);
      if (!res.ok) return '';
      const json = await res.json();
      return json.content as string;
    },
  );

  const html = createMemo(() => {
    const template = rawTemplate();
    if (!template) return '<p>Loading document…</p>';
    const filled = fillTemplate(template, props.data);
    return marked.parse(filled) as string;
  });

  async function downloadPdf() {
    setDownloading(true);
    const element = document.querySelector('.document-paper') as HTMLElement;
    const name = props.documentType.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await html2pdf()
      .from(element)
      .set({
        filename: `${name}.pdf`,
        margin: [10, 10, 10, 10],
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' },
      })
      .save();
    setDownloading(false);
  }

  return (
    <div class="preview-panel">
      <div class="preview-toolbar">
        <span class="preview-label">Live Preview</span>
        <div class="preview-actions">
          <button
            class="btn btn-primary"
            onClick={downloadPdf}
            disabled={downloading()}
            title="Download as PDF"
          >
            {downloading() ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
      <div class="preview-scroll">
        <div class="document-paper document-generic" innerHTML={html()} />
      </div>
    </div>
  );
}
