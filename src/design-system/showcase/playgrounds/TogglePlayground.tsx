import { useState } from 'preact/hooks';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseToggle } from './ShowcaseToggle';

export function TogglePlayground() {
  const [checked, setChecked] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const preview = (
    <label class="ds-toggle">
      <input
        type="checkbox"
        class="ds-toggle__input"
        role="switch"
        checked={checked}
        disabled={disabled}
        aria-label="Preview toggle"
        onChange={(e) => setChecked((e.target as HTMLInputElement).checked)}
      />
      <span class="ds-toggle__track" aria-hidden="true">
        <span class="ds-toggle__knob"></span>
      </span>
    </label>
  );

  return (
    <ShowcasePlayground preview={preview}>
      <ShowcaseControlRow
        name="On"
        control={
          <ShowcaseToggle
            aria-label="On"
            checked={checked}
            onChange={setChecked}
            disabled={disabled}
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
