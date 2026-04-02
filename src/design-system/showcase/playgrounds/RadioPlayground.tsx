import { useState } from 'preact/hooks';
import { DsIcon } from '../../components/ui/DsIcon';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseToggle } from './ShowcaseToggle';
import { ShowcaseSelect } from './ShowcaseSelect';

function RadioInput(props: {
  name: string;
  value: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
  'aria-label': string;
}) {
  return (
    <label class="ds-radio">
      <input
        type="radio"
        class="ds-radio__input"
        name={props.name}
        value={props.value}
        checked={props.checked}
        disabled={props.disabled}
        aria-label={props['aria-label']}
        onChange={props.onChange}
      />
      <span class="ds-radio__visual" aria-hidden="true">
        <DsIcon name="radio-filled" size="xl" class="ds-radio__icon" />
      </span>
    </label>
  );
}

const selectOpts = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
];

export function RadioPlayground() {
  const [selected, setSelected] = useState<'a' | 'b'>('a');
  const [disabled, setDisabled] = useState(false);

  const preview = (
    <div style={{ display: 'inline-flex', gap: 'var(--spacing-16)', alignItems: 'center' }}>
      <RadioInput
        name="radio-playground"
        value="a"
        checked={selected === 'a'}
        disabled={disabled}
        aria-label="Option A"
        onChange={() => setSelected('a')}
      />
      <RadioInput
        name="radio-playground"
        value="b"
        checked={selected === 'b'}
        disabled={disabled}
        aria-label="Option B"
        onChange={() => setSelected('b')}
      />
    </div>
  );

  return (
    <ShowcasePlayground preview={preview}>
      <ShowcaseControlRow
        name="Selected"
        control={
          <ShowcaseSelect
            aria-label="Selected option"
            value={selected}
            options={selectOpts}
            onChange={(id) => setSelected(id as 'a' | 'b')}
          />
        }
      />
      <ShowcaseControlRow
        name="Disabled"
        control={
          <ShowcaseToggle
            aria-label="Disabled"
            checked={disabled}
            onChange={setDisabled}
          />
        }
      />
    </ShowcasePlayground>
  );
}
