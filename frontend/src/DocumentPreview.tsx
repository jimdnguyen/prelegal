import { createMemo, createResource, createSignal, Show } from 'solid-js';
import { marked } from 'marked';
import type { DocumentFormData } from './types';
import { useAuth, type AuthUser } from './AuthContext';
import SignupModal from './SignupModal';
import html2pdf from 'html2pdf.js';

interface Props {
  documentType: string;
  data: DocumentFormData;
  savedDocId?: number | null;
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
      let value = data[fieldName];
      let suffix = '';

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
  const { auth, login } = useAuth();
  const [downloading, setDownloading] = createSignal(false);
  const [saveState, setSaveState] = createSignal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSignupModal, setShowSignupModal] = createSignal(false);

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
    if (!template) return '<p style="color:#888;padding:2rem">Loading document…</p>';
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

  async function saveDocument(token: string): Promise<boolean> {
    setSaveState('saving');
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const title = `${props.documentType} — ${date}`;
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ document_type: props.documentType, title, form_data: props.data }),
      });
      if (!res.ok) throw new Error();
      setSaveState('saved');
      return true;
    } catch {
      setSaveState('error');
      setTimeout(() => setSaveState('idle'), 3000);
      return false;
    }
  }

  function handleSaveClick() {
    if (auth().isGuest) {
      setShowSignupModal(true);
    } else if (auth().token) {
      saveDocument(auth().token!);
    }
  }

  async function handleSignupSuccess(token: string, user: AuthUser) {
    login(token, user);
    setShowSignupModal(false);
    const success = await saveDocument(token);
    if (success) {
      localStorage.removeItem('prelegal_guest_form');
    }
  }

  const saveLabel = () => {
    if (saveState() === 'saving') return 'Saving…';
    if (saveState() === 'saved') return '✓ Saved';
    if (saveState() === 'error') return 'Save failed';
    return props.savedDocId ? 'Save New Copy' : 'Save Document';
  };

  return (
    <div class="preview-panel">
      <div class="disclaimer-banner">
        ⚠️ This document is a draft generated with AI assistance. It should be reviewed by a qualified legal professional before use.
      </div>

      <div class="preview-toolbar">
        <span class="preview-label">Live Preview</span>
        <div class="preview-actions">
          <Show when={auth().token || auth().isGuest}>
            <button
              class={`btn btn-save ${saveState()}`}
              onClick={handleSaveClick}
              disabled={saveState() === 'saving' || saveState() === 'saved'}
            >
              {auth().isGuest ? 'Save Document' : saveLabel()}
            </button>
          </Show>
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

      <Show when={showSignupModal()}>
        <SignupModal
          onSuccess={handleSignupSuccess}
          onClose={() => setShowSignupModal(false)}
        />
      </Show>
    </div>
  );
}
