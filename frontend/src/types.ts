export interface NdaFormData {
  // Agreement terms
  purpose: string;
  effectiveDate: string;
  mndaTermType: 'fixed' | 'perpetual';
  mndaTermYears: number;
  confidentialityTermType: 'fixed' | 'perpetual';
  confidentialityTermYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  // Party 1
  party1Name: string;
  party1Title: string;
  party1Company: string;
  party1NoticeAddress: string;
  party1Date: string;
  // Party 2
  party2Name: string;
  party2Title: string;
  party2Company: string;
  party2NoticeAddress: string;
  party2Date: string;
}

export const defaultFormData: NdaFormData = {
  purpose: 'Evaluating whether to enter into a business relationship with the other party.',
  effectiveDate: new Date().toISOString().split('T')[0],
  mndaTermType: 'fixed',
  mndaTermYears: 1,
  confidentialityTermType: 'fixed',
  confidentialityTermYears: 1,
  governingLaw: '',
  jurisdiction: '',
  modifications: '',
  party1Name: '',
  party1Title: '',
  party1Company: '',
  party1NoticeAddress: '',
  party1Date: '',
  party2Name: '',
  party2Title: '',
  party2Company: '',
  party2NoticeAddress: '',
  party2Date: '',
};

/** Generic form data used across all document types. */
export type DocumentFormData = Record<string, string>;

/** Convert generic form data to typed NdaFormData for the NDA preview. */
export function toNdaFormData(data: DocumentFormData): NdaFormData {
  return {
    purpose: data.purpose || defaultFormData.purpose,
    effectiveDate: data.effectiveDate || defaultFormData.effectiveDate,
    mndaTermType: data.mndaTermType === 'perpetual' ? 'perpetual' : 'fixed',
    mndaTermYears: parseInt(data.mndaTermYears) || 1,
    confidentialityTermType: data.confidentialityTermType === 'perpetual' ? 'perpetual' : 'fixed',
    confidentialityTermYears: parseInt(data.confidentialityTermYears) || 1,
    governingLaw: data.governingLaw || '',
    jurisdiction: data.jurisdiction || '',
    modifications: data.modifications || '',
    party1Name: data.party1Name || '',
    party1Title: data.party1Title || '',
    party1Company: data.party1Company || '',
    party1NoticeAddress: data.party1NoticeAddress || '',
    party1Date: data.party1Date || '',
    party2Name: data.party2Name || '',
    party2Title: data.party2Title || '',
    party2Company: data.party2Company || '',
    party2NoticeAddress: data.party2NoticeAddress || '',
    party2Date: data.party2Date || '',
  };
}

export interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
}
