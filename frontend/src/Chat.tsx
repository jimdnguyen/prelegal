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
      const res = await fetch('/api/chat', {
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
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
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
      <div class="chat-messages" ref={scrollRef}>
        <For each={messages()}>
          {msg => (
            <div class={`chat-bubble ${msg.role}`}>
              <div class="bubble-content">{msg.content}</div>
            </div>
          )}
        </For>
        {loading() && (
          <div class="chat-bubble assistant">
            <div class="bubble-content chat-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      <div class="chat-input-area">
        <textarea
          class="chat-input"
          placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
          rows={3}
          value={input()}
          onInput={e => setInput(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          disabled={loading()}
        />
        <button
          class="btn btn-send"
          onClick={send}
          disabled={loading() || !input().trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
