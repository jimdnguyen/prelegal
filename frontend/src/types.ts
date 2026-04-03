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
