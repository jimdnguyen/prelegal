import { createMemo, createSignal } from 'solid-js';
import { generateNdaHtml } from './ndaTemplate';
import { toNdaFormData } from './types';
import type { DocumentFormData } from './types';
import html2pdf from 'html2pdf.js';

interface Props {
  data: DocumentFormData;
}

export default function NdaPreview(props: Props) {
  const html = createMemo(() => generateNdaHtml(toNdaFormData(props.data)));
  const [downloading, setDownloading] = createSignal(false);

  function buildFilename(): string {
    const p1 = props.data['party1Company'] || 'Party1';
    const p2 = props.data['party2Company'] || 'Party2';
    return `mutual-nda-${p1}-${p2}.pdf`
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-');
  }

  async function downloadPdf() {
    setDownloading(true);
    const element = document.querySelector('.document-paper') as HTMLElement;
    await html2pdf()
      .from(element)
      .set({
        filename: buildFilename(),
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
          <button class="btn btn-primary" onClick={downloadPdf} disabled={downloading()} title="Download as PDF">
            {downloading() ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>
      <div class="preview-scroll">
        <div class="document-paper" innerHTML={html()} />
      </div>
    </div>
  );
}
