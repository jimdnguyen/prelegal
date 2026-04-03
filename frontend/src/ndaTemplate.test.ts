import { describe, it, expect } from 'vitest';
import {
  getMndaTermText,
  getConfidentialityTermText,
  generateNdaHtml,
  generateStandaloneHtml,
} from './ndaTemplate';
import type { NdaFormData } from './types';
import { defaultFormData } from './types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return { ...defaultFormData, ...overrides };
}

// ── getMndaTermText ────────────────────────────────────────────────────────────

describe('getMndaTermText', () => {
  it('returns singular year when mndaTermYears is 1', () => {
    expect(getMndaTermText(makeData({ mndaTermType: 'fixed', mndaTermYears: 1 })))
      .toBe('1 year from Effective Date');
  });

  it('returns plural years when mndaTermYears is > 1', () => {
    expect(getMndaTermText(makeData({ mndaTermType: 'fixed', mndaTermYears: 3 })))
      .toBe('3 years from Effective Date');
  });

  it('returns perpetual text when mndaTermType is perpetual', () => {
    expect(getMndaTermText(makeData({ mndaTermType: 'perpetual' })))
      .toBe('continues until terminated in accordance with the terms of the MNDA');
  });
});

// ── getConfidentialityTermText ─────────────────────────────────────────────────

describe('getConfidentialityTermText', () => {
  it('returns singular year and trade secret clause for 1 year', () => {
    const result = getConfidentialityTermText(
      makeData({ confidentialityTermType: 'fixed', confidentialityTermYears: 1 })
    );
    expect(result).toContain('1 year from the Effective Date');
    expect(result).toContain('trade secrets');
  });

  it('returns plural years for > 1', () => {
    const result = getConfidentialityTermText(
      makeData({ confidentialityTermType: 'fixed', confidentialityTermYears: 5 })
    );
    expect(result).toContain('5 years from the Effective Date');
  });

  it('returns "in perpetuity" when perpetual', () => {
    expect(getConfidentialityTermText(makeData({ confidentialityTermType: 'perpetual' })))
      .toBe('in perpetuity');
  });
});

// ── XSS escaping via generateNdaHtml ─────────────────────────────────────────

describe('XSS escaping', () => {
  it('escapes < and > in party names', () => {
    const html = generateNdaHtml(makeData({ party1Name: 'Bob <script>alert(1)</script>' }));
    expect(html).toContain('Bob &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('escapes & in company names', () => {
    const html = generateNdaHtml(makeData({ party1Company: 'Acme & Sons, LLC' }));
    expect(html).toContain('Acme &amp; Sons, LLC');
  });

  it('escapes double quotes in purpose', () => {
    const html = generateNdaHtml(makeData({ purpose: 'Evaluate "Project X"' }));
    expect(html).toContain('Evaluate &quot;Project X&quot;');
  });

  it('escapes special chars in governing law', () => {
    const html = generateNdaHtml(makeData({ governingLaw: 'D&C State' }));
    expect(html).toContain('D&amp;C State');
  });
});

// ── Placeholder rendering ──────────────────────────────────────────────────────

describe('placeholder rendering', () => {
  it('shows red placeholder span when party1Name is empty', () => {
    const html = generateNdaHtml(makeData({ party1Name: '' }));
    expect(html).toContain('<span class="placeholder">[Name]</span>');
  });

  it('shows red placeholder span when party2Company is empty', () => {
    const html = generateNdaHtml(makeData({ party2Company: '' }));
    expect(html).toContain('<span class="placeholder">[Company]</span>');
  });

  it('shows placeholder for effectiveDate when empty', () => {
    const html = generateNdaHtml(makeData({ effectiveDate: '' }));
    expect(html).toContain('<span class="placeholder">[Today\'s date]</span>');
  });

  it('shows placeholder for party1Date when empty', () => {
    const html = generateNdaHtml(makeData({ party1Date: '' }));
    expect(html).toContain('<span class="placeholder">[Signing Date]</span>');
  });

  it('shows placeholder for party2Date when empty', () => {
    const html = generateNdaHtml(makeData({ party2Date: '' }));
    expect(html).toContain('<span class="placeholder">[Signing Date]</span>');
  });

  it('shows placeholder for party1Title when empty', () => {
    const html = generateNdaHtml(makeData({ party1Title: '' }));
    expect(html).toContain('<span class="placeholder">[Title]</span>');
  });

  it('shows placeholder for party1NoticeAddress when empty', () => {
    const html = generateNdaHtml(makeData({ party1NoticeAddress: '' }));
    expect(html).toContain('<span class="placeholder">[Email or postal address]</span>');
  });

  it('does NOT show placeholder when value is provided', () => {
    const html = generateNdaHtml(makeData({ party1Name: 'Jane Smith' }));
    expect(html).toContain('Jane Smith');
    // Only one [Name] placeholder should appear (for party2 which is empty by default)
    const placeholderCount = (html.match(/\[Name\]/g) || []).length;
    expect(placeholderCount).toBe(1);
  });

  it('shows purpose placeholder in both cover page and standard terms', () => {
    const html = generateNdaHtml(makeData({ purpose: '' }));
    const purposePlaceholderCount = (html.match(/class="placeholder"/g) || []).length;
    // Should appear multiple times (cover page label + standard terms sections 1, 2)
    expect(purposePlaceholderCount).toBeGreaterThan(1);
  });
});

// ── Date formatting ────────────────────────────────────────────────────────────

describe('date formatting', () => {
  it('formats a date without timezone shift (local constructor)', () => {
    // Verifies the timezone-safe local date parsing — if UTC were used, Jan 1 could
    // display as Dec 31 in negative-offset timezones.
    const html = generateNdaHtml(makeData({ effectiveDate: '2024-01-15' }));
    expect(html).toContain('January 15, 2024');
  });

  it('formats end-of-year date correctly', () => {
    const html = generateNdaHtml(makeData({ effectiveDate: '2024-12-31' }));
    expect(html).toContain('December 31, 2024');
  });

  it('formats start-of-year date correctly', () => {
    const html = generateNdaHtml(makeData({ effectiveDate: '2025-01-01' }));
    expect(html).toContain('January 1, 2025');
  });
});

// ── Section 5 grammar (Bug #1) ─────────────────────────────────────────────────

describe('Section 5 grammar', () => {
  it('uses "expires at the end of the N years" when mndaTermType is fixed', () => {
    const html = generateNdaHtml(makeData({
      mndaTermType: 'fixed',
      mndaTermYears: 2,
      effectiveDate: '2025-06-01',
    }));
    expect(html).toContain('expires at the end of the');
    expect(html).toContain('2 years from Effective Date');
  });

  it('does NOT say "expires at the end of the" when mndaTermType is perpetual', () => {
    const html = generateNdaHtml(makeData({ mndaTermType: 'perpetual' }));
    expect(html).not.toContain('expires at the end of the continues');
    expect(html).toContain('continues until terminated');
  });

  it('perpetual term reads grammatically in Section 5 sentence', () => {
    const html = generateNdaHtml(makeData({ mndaTermType: 'perpetual', effectiveDate: '2025-01-01' }));
    expect(html).toContain('commences on the') ;
    // Should NOT include "expires at the end of the" phrase when perpetual
    expect(html).not.toMatch(/expires at the end of the\s+<strong>continues/);
  });
});

// ── Section 5 confidentiality term grammar (bonus fix) ────────────────────────

describe('Section 5 confidentiality term grammar', () => {
  it('uses "survive for the N years" when confidentialityTermType is fixed', () => {
    const html = generateNdaHtml(makeData({
      confidentialityTermType: 'fixed',
      confidentialityTermYears: 3,
    }));
    expect(html).toContain('will survive for the');
    expect(html).toContain('3 years from the Effective Date');
  });

  it('does NOT say "survive for the in perpetuity" when perpetual', () => {
    const html = generateNdaHtml(makeData({ confidentialityTermType: 'perpetual' }));
    expect(html).not.toContain('survive for the in perpetuity');
    expect(html).toContain('in perpetuity');
  });
});

// ── Cover page checkboxes ──────────────────────────────────────────────────────

describe('cover page checkboxes', () => {
  it('checks the fixed MNDA Term box when mndaTermType is fixed', () => {
    const html = generateNdaHtml(makeData({ mndaTermType: 'fixed', mndaTermYears: 1 }));
    // First checkbox-item should be checked (contains &#9745;)
    const fixedChecked = html.includes('checkbox-item checked');
    expect(fixedChecked).toBe(true);
  });

  it('checks the perpetual MNDA Term box when mndaTermType is perpetual', () => {
    const html = generateNdaHtml(makeData({ mndaTermType: 'perpetual' }));
    expect(html).toContain('Continues until terminated');
    // The "checked" class should appear on the perpetual checkbox item
    expect(html).toContain('checkbox-item checked');
  });

  it('shows correct year count in MNDA Term checkbox label', () => {
    const html = generateNdaHtml(makeData({ mndaTermType: 'fixed', mndaTermYears: 5 }));
    expect(html).toContain('5 year');
  });

  it('checks the fixed confidentiality term box', () => {
    const html = generateNdaHtml(makeData({ confidentialityTermType: 'fixed', confidentialityTermYears: 2 }));
    expect(html).toContain('2 year');
    expect(html).toContain('trade secrets');
  });

  it('checks the perpetual confidentiality term box', () => {
    const html = generateNdaHtml(makeData({ confidentialityTermType: 'perpetual' }));
    expect(html).toContain('In perpetuity.');
  });
});

// ── Governing law and jurisdiction ────────────────────────────────────────────

describe('governing law and jurisdiction', () => {
  it('renders governing law in Section 9', () => {
    const html = generateNdaHtml(makeData({ governingLaw: 'Delaware' }));
    expect(html).toContain('laws of the State of <strong>Delaware</strong>');
  });

  it('renders jurisdiction in Section 9', () => {
    const html = generateNdaHtml(makeData({ jurisdiction: 'courts located in New Castle, DE' }));
    expect(html).toContain('<strong>courts located in New Castle, DE</strong>');
  });

  it('shows placeholder when governingLaw is empty', () => {
    const html = generateNdaHtml(makeData({ governingLaw: '' }));
    expect(html).toContain('<span class="placeholder">[State]</span>');
  });

  it('shows placeholder when jurisdiction is empty', () => {
    const html = generateNdaHtml(makeData({ jurisdiction: '' }));
    expect(html).toContain('<span class="placeholder">[Jurisdiction]</span>');
  });
});

// ── MNDA modifications section ────────────────────────────────────────────────

describe('MNDA modifications', () => {
  it('shows modifications section when modifications are provided', () => {
    const html = generateNdaHtml(makeData({ modifications: 'Section 3 is amended to remove subsection (d).' }));
    expect(html).toContain('MNDA Modifications');
    expect(html).toContain('Section 3 is amended to remove subsection (d).');
  });

  it('hides modifications section when modifications is empty', () => {
    const html = generateNdaHtml(makeData({ modifications: '' }));
    expect(html).not.toContain('MNDA Modifications');
  });

  it('escapes HTML in modifications text', () => {
    const html = generateNdaHtml(makeData({ modifications: '<b>Bold clause</b>' }));
    expect(html).toContain('&lt;b&gt;Bold clause&lt;/b&gt;');
  });
});

// ── Signature table ───────────────────────────────────────────────────────────

describe('signature table', () => {
  it('renders both party names in the signature table', () => {
    const html = generateNdaHtml(makeData({
      party1Name: 'Alice Johnson',
      party2Name: 'Bob Williams',
    }));
    expect(html).toContain('Alice Johnson');
    expect(html).toContain('Bob Williams');
  });

  it('renders party companies in the signature table', () => {
    const html = generateNdaHtml(makeData({
      party1Company: 'Alpha Corp',
      party2Company: 'Beta LLC',
    }));
    expect(html).toContain('Alpha Corp');
    expect(html).toContain('Beta LLC');
  });

  it('includes sig-line cells for signatures', () => {
    const html = generateNdaHtml(makeData({}));
    expect(html).toContain('class="sig-line"');
  });
});

// ── generateStandaloneHtml ─────────────────────────────────────────────────────

describe('generateStandaloneHtml', () => {
  it('returns a complete HTML document', () => {
    const html = generateStandaloneHtml(makeData({}));
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
  });

  it('embeds all styles in a <style> tag (no external deps)', () => {
    const html = generateStandaloneHtml(makeData({}));
    expect(html).toContain('<style>');
    expect(html).not.toContain('<link');
  });

  it('uses party company names in the <title>', () => {
    const html = generateStandaloneHtml(makeData({
      party1Company: 'Acme Inc',
      party2Company: 'Globex',
    }));
    expect(html).toContain('Acme Inc');
    expect(html).toContain('Globex');
  });

  it('escapes company names in the <title>', () => {
    const html = generateStandaloneHtml(makeData({
      party1Company: 'A&B Co',
      party2Company: 'C<D>E',
    }));
    expect(html).toContain('A&amp;B Co');
    expect(html).toContain('C&lt;D&gt;E');
  });

  it('falls back to Party1/Party2 in title when companies are empty', () => {
    const html = generateStandaloneHtml(makeData({ party1Company: '', party2Company: '' }));
    expect(html).toContain('Party1');
    expect(html).toContain('Party2');
  });

  it('contains the NDA body inside the document', () => {
    const html = generateStandaloneHtml(makeData({ party1Name: 'John Doe' }));
    expect(html).toContain('John Doe');
    expect(html).toContain('Mutual Non-Disclosure Agreement');
  });

  it('includes the Common Paper attribution', () => {
    const html = generateStandaloneHtml(makeData({}));
    expect(html).toContain('Common Paper');
    expect(html).toContain('CC BY 4.0');
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('handles whitespace-only strings as empty (shows placeholder)', () => {
    const html = generateNdaHtml(makeData({ party1Name: '   ' }));
    expect(html).toContain('<span class="placeholder">[Name]</span>');
  });

  it('handles a fully filled form without any placeholders in required fields', () => {
    const html = generateNdaHtml(makeData({
      purpose: 'Evaluate a potential business partnership',
      effectiveDate: '2025-03-01',
      mndaTermType: 'fixed',
      mndaTermYears: 2,
      confidentialityTermType: 'fixed',
      confidentialityTermYears: 3,
      governingLaw: 'California',
      jurisdiction: 'courts located in San Francisco, CA',
      party1Name: 'Alice',
      party1Title: 'CEO',
      party1Company: 'Alpha Corp',
      party1NoticeAddress: 'alice@alpha.com',
      party1Date: '2025-03-01',
      party2Name: 'Bob',
      party2Title: 'CTO',
      party2Company: 'Beta LLC',
      party2NoticeAddress: 'bob@beta.com',
      party2Date: '2025-03-02',
    }));
    // No red placeholder spans should appear for required fields
    expect(html).not.toContain('[Name]');
    expect(html).not.toContain('[Company]');
    expect(html).not.toContain('[State]');
    expect(html).not.toContain('[Jurisdiction]');
    expect(html).not.toContain('[Effective Date]');
    expect(html).not.toContain('[Signing Date]');
  });

  it('handles mndaTermYears of 0 (defaults to 1 per form validation)', () => {
    // The form enforces min=1, but template should still handle it
    const text = getMndaTermText(makeData({ mndaTermType: 'fixed', mndaTermYears: 0 }));
    expect(typeof text).toBe('string');
    expect(text).toContain('year');
  });

  it('generates valid HTML structure (has required elements)', () => {
    const html = generateNdaHtml(makeData({}));
    expect(html).toContain('class="cover-page"');
    expect(html).toContain('class="standard-terms"');
    expect(html).toContain('class="signature-table"');
  });
});
