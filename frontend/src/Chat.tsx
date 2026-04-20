import { createSignal, createEffect, For } from 'solid-js';
import type { DocumentFormData } from './types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  documentType: string;
  onFieldUpdates: (updates: DocumentFormData) => void;
}

function initialMessage(docType: string): Message {
  return {
    role: 'assistant',
    content: `Hello! I'm your AI legal assistant. I'll help you create a ${docType}. Let's get started — who are the parties involved in this agreement?`,
  };
}

export default function Chat(props: Props) {
  const [messages, setMessages] = createSignal<Message[]>([initialMessage(props.documentType)]);
  const [input, setInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  // eslint-disable-next-line no-unassigned-vars
  let scrollRef: HTMLDivElement | undefined;

  createEffect(() => {
    messages(); // track signal
    if (scrollRef) scrollRef.scrollTop = scrollRef.scrollHeight;
  });

  async function send() {
    const text = input().trim();
    if (!text || loading()) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages(), userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, document_type: props.documentType }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Chat API ${res.status}:`, errText);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      // Convert list of {key, value} pairs to a partial update object
      if (Array.isArray(data.field_updates) && data.field_updates.length > 0) {
        const updates: DocumentFormData = {};
        for (const { key, value } of data.field_updates) {
          if (key && value !== null && value !== undefined && value !== '') {
            updates[key] = String(value);
          }
        }
        if (Object.keys(updates).length > 0) props.onFieldUpdates(updates);
      }
    } catch (err) {
      console.error('Chat failed:', err);
      const isNetworkDrop =
        err instanceof TypeError &&
        /networkerror|failed to fetch/i.test(String(err.message));
      const msg = isNetworkDrop
        ? 'Done! Check the form fields — the AI may have filled them in. Try again if not.'
        : 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div class="chat-pane">
      <div class="chat-messages" ref={scrollRef} role="log" aria-live="polite" aria-label="Chat conversation">
        <For each={messages()}>
          {msg => (
            <div class={`chat-bubble ${msg.role}`}>
              <div class="bubble-content" role={msg.role === 'user' ? 'status' : undefined}>
                {msg.content}
              </div>
            </div>
          )}
        </For>
        {loading() && (
          <div class="chat-bubble assistant">
            <div class="bubble-content chat-typing" aria-label="AI is typing">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      <p class="chat-disclaimer">AI-generated · not legal advice · verify with a qualified attorney</p>

      <div class="chat-input-area">
        <textarea
          class="chat-input"
          placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
          aria-label="Chat message input"
          rows={3}
          value={input()}
          onInput={e => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          disabled={loading()}
        />
        <button
          class="btn btn-send"
          onClick={send}
          aria-label="Send message"
          disabled={loading() || !input().trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
