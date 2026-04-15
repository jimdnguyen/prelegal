import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import DocumentSelector from './DocumentSelector';

afterEach(cleanup);

const mockCatalog = [
  { name: 'Mutual Non-Disclosure Agreement', description: 'Standard mutual NDA.' },
  { name: 'Service Level Agreement', description: 'Uptime commitments.' },
];

function mockFetch(data: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve(data),
  }));
}

describe('DocumentSelector', () => {
  it('shows loading state initially', () => {
    mockFetch(mockCatalog);
    render(() => <DocumentSelector onSelect={() => {}} />);
    expect(screen.getByText('Loading documents…')).toBeTruthy();
  });

  it('renders document cards from catalog', async () => {
    mockFetch(mockCatalog);
    render(() => <DocumentSelector onSelect={() => {}} />);
    expect(await screen.findByText('Mutual Non-Disclosure Agreement')).toBeTruthy();
    expect(screen.getByText('Service Level Agreement')).toBeTruthy();
  });

  it('calls onSelect with the document name when a card is clicked', async () => {
    mockFetch(mockCatalog);
    const onSelect = vi.fn();
    render(() => <DocumentSelector onSelect={onSelect} />);
    const card = await screen.findByText('Mutual Non-Disclosure Agreement');
    card.click();
    expect(onSelect).toHaveBeenCalledWith('Mutual Non-Disclosure Agreement');
  });

  it('shows document descriptions', async () => {
    mockFetch(mockCatalog);
    render(() => <DocumentSelector onSelect={() => {}} />);
    expect(await screen.findByText('Standard mutual NDA.')).toBeTruthy();
  });
});
