import type { NdaFormData } from './types';
import type { Setter } from 'solid-js';
import { Show } from 'solid-js';

interface Props {
  data: NdaFormData;
  setData: Setter<NdaFormData>;
}

export default function NdaForm(props: Props) {
  const set = <K extends keyof NdaFormData>(key: K) =>
    (e: Event) => {
      const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      props.setData(prev => ({ ...prev, [key]: target.value }));
    };

  const setNum = (key: 'mndaTermYears' | 'confidentialityTermYears') =>
    (e: Event) => {
      const val = parseInt((e.currentTarget as HTMLInputElement).value, 10);
      props.setData(prev => ({ ...prev, [key]: isNaN(val) || val < 1 ? 1 : val }));
    };

  const setRadio = (key: 'mndaTermType' | 'confidentialityTermType', value: 'fixed' | 'perpetual') =>
    () => props.setData(prev => ({ ...prev, [key]: value }));

  return (
    <form class="nda-form" onSubmit={e => e.preventDefault()}>

      <section class="form-section">
        <h2>Agreement Terms</h2>

        <div class="field-group">
          <label for="purpose">Purpose</label>
          <p class="hint">How Confidential Information may be used</p>
          <textarea
            id="purpose"
            rows="3"
            value={props.data.purpose}
            onInput={set('purpose')}
          />
        </div>

        <div class="field-group">
          <label for="effectiveDate">Effective Date</label>
          <input
            id="effectiveDate"
            type="date"
            value={props.data.effectiveDate}
            onInput={set('effectiveDate')}
          />
        </div>

        <div class="field-group">
          <label>MNDA Term</label>
          <p class="hint">The length of this MNDA</p>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                name="mndaTerm"
                checked={props.data.mndaTermType === 'fixed'}
                onChange={setRadio('mndaTermType', 'fixed')}
              />
              Expires after
              <Show when={props.data.mndaTermType === 'fixed'}>
                <input
                  type="number"
                  class="inline-number"
                  min="1"
                  max="99"
                  value={props.data.mndaTermYears}
                  onInput={setNum('mndaTermYears')}
                />
              </Show>
              <Show when={props.data.mndaTermType !== 'fixed'}>
                <span class="inline-placeholder">N</span>
              </Show>
              year(s) from Effective Date
            </label>
            <label class="radio-label">
              <input
                type="radio"
                name="mndaTerm"
                checked={props.data.mndaTermType === 'perpetual'}
                onChange={setRadio('mndaTermType', 'perpetual')}
              />
              Continues until terminated
            </label>
          </div>
        </div>

        <div class="field-group">
          <label>Term of Confidentiality</label>
          <p class="hint">How long Confidential Information is protected</p>
          <div class="radio-group">
            <label class="radio-label">
              <input
                type="radio"
                name="confTerm"
                checked={props.data.confidentialityTermType === 'fixed'}
                onChange={setRadio('confidentialityTermType', 'fixed')}
              />
              <Show when={props.data.confidentialityTermType === 'fixed'}>
                <input
                  type="number"
                  class="inline-number"
                  min="1"
                  max="99"
                  value={props.data.confidentialityTermYears}
                  onInput={setNum('confidentialityTermYears')}
                />
              </Show>
              <Show when={props.data.confidentialityTermType !== 'fixed'}>
                <span class="inline-placeholder">N</span>
              </Show>
              year(s) from Effective Date + trade secrets
            </label>
            <label class="radio-label">
              <input
                type="radio"
                name="confTerm"
                checked={props.data.confidentialityTermType === 'perpetual'}
                onChange={setRadio('confidentialityTermType', 'perpetual')}
              />
              In perpetuity
            </label>
          </div>
        </div>

        <div class="field-group">
          <label for="governingLaw">Governing Law (State)</label>
          <input
            id="governingLaw"
            type="text"
            placeholder="e.g. Delaware"
            value={props.data.governingLaw}
            onInput={set('governingLaw')}
          />
        </div>

        <div class="field-group">
          <label for="jurisdiction">Jurisdiction</label>
          <input
            id="jurisdiction"
            type="text"
            placeholder='e.g. courts located in New Castle, DE'
            value={props.data.jurisdiction}
            onInput={set('jurisdiction')}
          />
        </div>

        <div class="field-group">
          <label for="modifications">MNDA Modifications</label>
          <p class="hint">Optional — list any modifications to the standard terms</p>
          <textarea
            id="modifications"
            rows="3"
            placeholder="Leave blank if none"
            value={props.data.modifications}
            onInput={set('modifications')}
          />
        </div>
      </section>

      <section class="form-section">
        <h2>Party 1</h2>

        <div class="field-row">
          <div class="field-group">
            <label for="p1Name">Print Name</label>
            <input id="p1Name" type="text" value={props.data.party1Name} onInput={set('party1Name')} />
          </div>
          <div class="field-group">
            <label for="p1Title">Title</label>
            <input id="p1Title" type="text" value={props.data.party1Title} onInput={set('party1Title')} />
          </div>
        </div>

        <div class="field-group">
          <label for="p1Company">Company</label>
          <input id="p1Company" type="text" value={props.data.party1Company} onInput={set('party1Company')} />
        </div>

        <div class="field-group">
          <label for="p1Notice">Notice Address</label>
          <p class="hint">Email or postal address for legal notices</p>
          <input id="p1Notice" type="text" value={props.data.party1NoticeAddress} onInput={set('party1NoticeAddress')} />
        </div>

        <div class="field-group">
          <label for="p1Date">Signing Date</label>
          <input id="p1Date" type="date" value={props.data.party1Date} onInput={set('party1Date')} />
        </div>
      </section>

      <section class="form-section">
        <h2>Party 2</h2>

        <div class="field-row">
          <div class="field-group">
            <label for="p2Name">Print Name</label>
            <input id="p2Name" type="text" value={props.data.party2Name} onInput={set('party2Name')} />
          </div>
          <div class="field-group">
            <label for="p2Title">Title</label>
            <input id="p2Title" type="text" value={props.data.party2Title} onInput={set('party2Title')} />
          </div>
        </div>

        <div class="field-group">
          <label for="p2Company">Company</label>
          <input id="p2Company" type="text" value={props.data.party2Company} onInput={set('party2Company')} />
        </div>

        <div class="field-group">
          <label for="p2Notice">Notice Address</label>
          <p class="hint">Email or postal address for legal notices</p>
          <input id="p2Notice" type="text" value={props.data.party2NoticeAddress} onInput={set('party2NoticeAddress')} />
        </div>

        <div class="field-group">
          <label for="p2Date">Signing Date</label>
          <input id="p2Date" type="date" value={props.data.party2Date} onInput={set('party2Date')} />
        </div>
      </section>

    </form>
  );
}
