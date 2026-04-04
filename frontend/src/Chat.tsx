import { createSignal, createEffect, For } from 'solid-js';
import type { NdaFormData } from './types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Hello! I'm your AI legal assistant. I'll help you create a Mutual NDA. Let's start — what is the purpose of this agreement? For example: \"Evaluating whether to enter into a business partnership.\"",
};

interface Props {
  onFieldUpdates: (updates: Partial<NdaFormData>) => void;
}

export default function Chat(props: Props) {
  const [messages, setMessages] = createSignal<Message[]>([INITIAL_MESSAGE]);
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
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Chat API ${res.status}:`, errText);
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);

      // Apply non-null field updates to the document
      const updates = data.field_updates as Record<string, unknown>;
      const filtered = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== null && v !== undefined)
      ) as Partial<NdaFormData>;
      if (Object.keys(filtered).length > 0) props.onFieldUpdates(filtered);
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
