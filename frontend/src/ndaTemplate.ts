import type { NdaFormData } from './types';

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  // Parse as local date to avoid timezone offset shifting the day
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '';
  const [year, month, day] = parts;
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function ph(value: string, placeholder: string): string {
  return value.trim()
    ? esc(value)
    : `<span class="placeholder">[${placeholder}]</span>`;
}

function datePh(dateStr: string, placeholder: string): string {
  return dateStr
    ? formatDate(dateStr)
    : `<span class="placeholder">[${placeholder}]</span>`;
}

export function getMndaTermText(data: NdaFormData): string {
  if (data.mndaTermType === 'fixed') {
    const y = data.mndaTermYears;
    return `${y} year${y !== 1 ? 's' : ''} from Effective Date`;
  }
  return 'continues until terminated in accordance with the terms of the MNDA';
}

export function getConfidentialityTermText(data: NdaFormData): string {
  if (data.confidentialityTermType === 'fixed') {
    const y = data.confidentialityTermYears;
    return `${y} year${y !== 1 ? 's' : ''} from the Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws`;
  }
  return 'in perpetuity';
}

function renderCoverPage(data: NdaFormData): string {
  const mndaFixed = data.mndaTermType === 'fixed';
  const confFixed = data.confidentialityTermType === 'fixed';

  return `
<div class="cover-page">
  <h1 class="doc-title">Mutual Non-Disclosure Agreement</h1>

  <div class="using-section">
    <h2>USING THIS MUTUAL NON-DISCLOSURE AGREEMENT</h2>
    <p>This Mutual Non-Disclosure Agreement (the &ldquo;MNDA&rdquo;) consists of: (1) this Cover Page (&ldquo;<strong>Cover Page</strong>&rdquo;) and (2) the Common Paper Mutual NDA Standard Terms Version 1.0 (&ldquo;<strong>Standard Terms</strong>&rdquo;) identical to those posted at <a href="https://commonpaper.com/standards/mutual-nda/1.0" target="_blank">commonpaper.com/standards/mutual-nda/1.0</a>. Any modifications of the Standard Terms should be made on the Cover Page, which will control over conflicts with the Standard Terms.</p>
  </div>

  <div class="cover-fields">

    <div class="field-section">
      <h3>Purpose</h3>
      <p class="field-label">How Confidential Information may be used</p>
      <div class="field-value">${ph(data.purpose, 'How Confidential Information may be used')}</div>
    </div>

    <div class="field-section">
      <h3>Effective Date</h3>
      <div class="field-value">${datePh(data.effectiveDate, 'Today\'s date')}</div>
    </div>

    <div class="field-section">
      <h3>MNDA Term</h3>
      <p class="field-label">The length of this MNDA</p>
      <div class="field-value">
        <div class="checkbox-item${mndaFixed ? ' checked' : ''}">
          <span class="checkbox">${mndaFixed ? '&#9745;' : '&#9744;'}</span>
          <span>Expires <strong>${data.mndaTermYears} year${data.mndaTermYears !== 1 ? 's' : ''}</strong> from Effective Date.</span>
        </div>
        <div class="checkbox-item${!mndaFixed ? ' checked' : ''}">
          <span class="checkbox">${!mndaFixed ? '&#9745;' : '&#9744;'}</span>
          <span>Continues until terminated in accordance with the terms of the MNDA.</span>
        </div>
      </div>
    </div>

    <div class="field-section">
      <h3>Term of Confidentiality</h3>
      <p class="field-label">How long Confidential Information is protected</p>
      <div class="field-value">
        <div class="checkbox-item${confFixed ? ' checked' : ''}">
          <span class="checkbox">${confFixed ? '&#9745;' : '&#9744;'}</span>
          <span><strong>${data.confidentialityTermYears} year${data.confidentialityTermYears !== 1 ? 's' : ''}</strong> from Effective Date, but in the case of trade secrets until Confidential Information is no longer considered a trade secret under applicable laws.</span>
        </div>
        <div class="checkbox-item${!confFixed ? ' checked' : ''}">
          <span class="checkbox">${!confFixed ? '&#9745;' : '&#9744;'}</span>
          <span>In perpetuity.</span>
        </div>
      </div>
    </div>

    <div class="field-section">
      <h3>Governing Law &amp; Jurisdiction</h3>
      <div class="field-value">
        <p>Governing Law: ${ph(data.governingLaw, 'Fill in state')}</p>
        <p>Jurisdiction: ${ph(data.jurisdiction, 'Fill in city or county and state, e.g. "courts located in New Castle, DE"')}</p>
      </div>
    </div>

    ${data.modifications.trim() ? `
    <div class="field-section">
      <h3>MNDA Modifications</h3>
      <div class="field-value">${esc(data.modifications)}</div>
    </div>
    ` : ''}

  </div>

  <div class="signature-section">
    <p>By signing this Cover Page, each party agrees to enter into this MNDA as of the Effective Date.</p>
    <table class="signature-table">
      <thead>
        <tr>
          <th></th>
          <th>PARTY 1</th>
          <th>PARTY 2</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Signature</td>
          <td class="sig-line"></td>
          <td class="sig-line"></td>
        </tr>
        <tr>
          <td>Print Name</td>
          <td>${ph(data.party1Name, 'Name')}</td>
          <td>${ph(data.party2Name, 'Name')}</td>
        </tr>
        <tr>
          <td>Title</td>
          <td>${ph(data.party1Title, 'Title')}</td>
          <td>${ph(data.party2Title, 'Title')}</td>
        </tr>
        <tr>
          <td>Company</td>
          <td>${ph(data.party1Company, 'Company')}</td>
          <td>${ph(data.party2Company, 'Company')}</td>
        </tr>
        <tr>
          <td>Notice Address<br><small>Use either email or postal address</small></td>
          <td>${ph(data.party1NoticeAddress, 'Email or postal address')}</td>
          <td>${ph(data.party2NoticeAddress, 'Email or postal address')}</td>
        </tr>
        <tr>
          <td>Date</td>
          <td>${datePh(data.party1Date, 'Signing Date')}</td>
          <td>${datePh(data.party2Date, 'Signing Date')}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="attribution">Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>.</p>
</div>`;
}

function renderStandardTerms(data: NdaFormData): string {
  const purpose = data.purpose.trim()
    ? `<strong>${esc(data.purpose)}</strong>`
    : '<span class="placeholder">[Purpose]</span>';
  const effectiveDate = data.effectiveDate
    ? `<strong>${formatDate(data.effectiveDate)}</strong>`
    : '<span class="placeholder">[Effective Date]</span>';
  const mndaTermPhrase = data.mndaTermType === 'fixed'
    ? `expires at the end of the <strong>${getMndaTermText(data)}</strong>`
    : `<strong>${getMndaTermText(data)}</strong>`;
  const confTermPhrase = data.confidentialityTermType === 'fixed'
    ? `for the <strong>${getConfidentialityTermText(data)}</strong>`
    : `<strong>${getConfidentialityTermText(data)}</strong>`;
  const gl = data.governingLaw.trim()
    ? `<strong>${esc(data.governingLaw)}</strong>`
    : '<span class="placeholder">[State]</span>';
  const jur = data.jurisdiction.trim()
    ? `<strong>${esc(data.jurisdiction)}</strong>`
    : '<span class="placeholder">[Jurisdiction]</span>';

  return `
<div class="standard-terms">
  <h2>Standard Terms</h2>

  <p><strong>1. Introduction.</strong> This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) (&ldquo;<strong>MNDA</strong>&rdquo;) allows each party (&ldquo;<strong>Disclosing Party</strong>&rdquo;) to disclose or make available information in connection with the ${purpose} which (1) the Disclosing Party identifies to the receiving party (&ldquo;<strong>Receiving Party</strong>&rdquo;) as &ldquo;confidential&rdquo;, &ldquo;proprietary&rdquo;, or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure (&ldquo;<strong>Confidential Information</strong>&rdquo;). Each party&rsquo;s Confidential Information also includes the existence and status of the parties&rsquo; discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms (&ldquo;<strong>Cover Page</strong>&rdquo;). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.</p>

  <p><strong>2. Use and Protection of Confidential Information.</strong> The Receiving Party shall: (a) use Confidential Information solely for the ${purpose}; (b) not disclose Confidential Information to third parties without the Disclosing Party&rsquo;s prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the ${purpose}, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.</p>

  <p><strong>3. Exceptions.</strong> The Receiving Party&rsquo;s obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.</p>

  <p><strong>4. Disclosures Required by Law.</strong> The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party&rsquo;s expense, with the Disclosing Party&rsquo;s efforts to obtain confidential treatment for the Confidential Information.</p>

  <p><strong>5. Term and Termination.</strong> This MNDA commences on the ${effectiveDate} and ${mndaTermPhrase}. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party&rsquo;s obligations relating to Confidential Information will survive ${confTermPhrase}, despite any expiration or termination of this MNDA.</p>

  <p><strong>6. Return or Destruction of Confidential Information.</strong> Upon expiration or termination of this MNDA or upon the Disclosing Party&rsquo;s earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party&rsquo;s written request, destroy all Confidential Information in the Receiving Party&rsquo;s possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.</p>

  <p><strong>7. Proprietary Rights.</strong> The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.</p>

  <p><strong>8. Disclaimer.</strong> ALL CONFIDENTIAL INFORMATION IS PROVIDED &ldquo;AS IS&rdquo;, WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.</p>

  <p><strong>9. Governing Law and Jurisdiction.</strong> This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of ${gl}, without regard to the conflict of laws provisions of such ${gl}. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in ${jur}. Each party irrevocably submits to the exclusive jurisdiction of such ${jur} in any such suit, action, or proceeding.</p>

  <p><strong>10. Equitable Relief.</strong> A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.</p>

  <p><strong>11. General.</strong> Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party&rsquo;s permitted successors and assigns. Waivers must be signed by the waiving party&rsquo;s authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.</p>

  <p class="attribution">Common Paper Mutual Non-Disclosure Agreement <a href="https://commonpaper.com/standards/mutual-nda/1.0/" target="_blank">Version 1.0</a> free to use under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>.</p>
</div>`;
}

export function generateNdaHtml(data: NdaFormData): string {
  return renderCoverPage(data) + renderStandardTerms(data);
}

const DOCUMENT_STYLES = `
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #1a202c; max-width: 800px; margin: 40px auto; padding: 0 40px; }
  h1.doc-title { font-size: 20pt; text-align: center; margin-bottom: 24px; }
  h2 { font-size: 14pt; margin-top: 32px; margin-bottom: 16px; }
  h3 { font-size: 12pt; margin-top: 20px; margin-bottom: 6px; }
  p { margin: 0 0 12px; }
  .field-label { font-style: italic; color: #666; font-size: 10pt; margin: 0 0 4px; }
  .field-value { margin-bottom: 8px; }
  .checkbox-item { margin: 4px 0; }
  .checkbox { margin-right: 6px; }
  .signature-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .signature-table th, .signature-table td { border: 1px solid #999; padding: 8px 12px; text-align: left; }
  .signature-table th { background: #f5f5f5; font-weight: bold; }
  .sig-line { height: 40px; }
  .attribution { font-size: 9pt; color: #666; margin-top: 24px; border-top: 1px solid #ddd; padding-top: 12px; }
  .placeholder { color: #b91c1c; font-style: italic; }
  .standard-terms { margin-top: 40px; border-top: 2px solid #333; padding-top: 24px; }
  a { color: #1d4ed8; }
  small { font-size: 9pt; }
`;

export function generateStandaloneHtml(data: NdaFormData): string {
  const p1 = data.party1Company || 'Party1';
  const p2 = data.party2Company || 'Party2';
  const body = generateNdaHtml(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mutual NDA &mdash; ${esc(p1)} &amp; ${esc(p2)}</title>
  <style>${DOCUMENT_STYLES}</style>
</head>
<body>
${body}
</body>
</html>`;
}
