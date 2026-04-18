import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import Chat from './Chat';

afterEach(cleanup);

describe('Chat', () => {
  it('renders initial assistant message', () => {
    render(() => <Chat documentType="Mutual Non-Disclosure Agreement" onFieldUpdates={() => {}} />);
    expect(screen.getByText(/I'm your AI legal assistant/)).toBeTruthy();
  });

  it('sends a message on Enter key', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Response', field_updates: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={() => {}} />);

    const textarea = container.querySelector('.chat-input') as HTMLTextAreaElement;
    textarea.value = 'Hello';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // Wait for async fetch
    await new Promise(r => setTimeout(r, 50));

    expect(mockFetch).toHaveBeenCalledWith('/api/assist', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('Hello'),
    }));
  });

  it('does not send empty messages', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={() => {}} />);

    const button = container.querySelector('.btn-send') as HTMLButtonElement;
    button.click();

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('displays API error message when API returns 500', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Internal server error'),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={() => {}} />);

    const textarea = container.querySelector('.chat-input') as HTMLTextAreaElement;
    textarea.value = 'Test message';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // Wait for async fetch and state update
    await new Promise(r => setTimeout(r, 100));

    expect(await screen.findByText(/something went wrong/i)).toBeTruthy();
  });

  it('calls onFieldUpdates when field_updates are returned', async () => {
    const onFieldUpdates = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Updated fields',
        field_updates: [
          { key: 'party_a', value: 'Acme Corp' },
          { key: 'party_b', value: 'Tech Inc' },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={onFieldUpdates} />);

    const textarea = container.querySelector('.chat-input') as HTMLTextAreaElement;
    textarea.value = 'Party A is Acme, Party B is Tech';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // Wait for async fetch and state update
    await new Promise(r => setTimeout(r, 100));

    expect(await screen.findByText('Updated fields')).toBeTruthy();
    expect(onFieldUpdates).toHaveBeenCalledWith({
      party_a: 'Acme Corp',
      party_b: 'Tech Inc',
    });
  });

  it('clears input after sending message', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Response', field_updates: [] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={() => {}} />);

    const textarea = container.querySelector('.chat-input') as HTMLTextAreaElement;
    textarea.value = 'Test message';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // Wait for async fetch and state update
    await new Promise(r => setTimeout(r, 50));

    expect(textarea.value).toBe('');
  });

  it('shows typing indicator while waiting for response', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() =>
          resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Response', field_updates: [] }),
          }),
          200,
        ),
      ),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={() => {}} />);

    const textarea = container.querySelector('.chat-input') as HTMLTextAreaElement;
    textarea.value = 'Test';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // Wait a bit for the typing indicator to appear
    await new Promise(r => setTimeout(r, 50));

    const typingIndicator = container.querySelector('.chat-typing');
    expect(typingIndicator).toBeTruthy();
  });

  it('handles network failure when backend is unreachable', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={() => {}} />);

    const textarea = container.querySelector('.chat-input') as HTMLTextAreaElement;
    textarea.value = 'Test message';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // Wait for async fetch and error handling
    await new Promise(r => setTimeout(r, 100));

    expect(await screen.findByText(/something went wrong/i)).toBeTruthy();
  });

  it('handles API timeout scenarios', async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 100),
      ),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={() => {}} />);

    const textarea = container.querySelector('.chat-input') as HTMLTextAreaElement;
    textarea.value = 'Test';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // Wait for async fetch and error handling
    await new Promise(r => setTimeout(r, 150));

    expect(await screen.findByText(/something went wrong/i)).toBeTruthy();
  });

  it('ignores empty field updates', async () => {
    const onFieldUpdates = vi.fn();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Response',
        field_updates: [
          { key: 'field1', value: '' },
          { key: 'field2', value: null },
          { key: 'field3', value: 'valid' },
        ],
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { container } = render(() => <Chat documentType="NDA" onFieldUpdates={onFieldUpdates} />);

    const textarea = container.querySelector('.chat-input') as HTMLTextAreaElement;
    textarea.value = 'Test';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    // Wait for async fetch and state update
    await new Promise(r => setTimeout(r, 100));

    expect(onFieldUpdates).toHaveBeenCalledWith({
      field3: 'valid',
    });
  });
});
