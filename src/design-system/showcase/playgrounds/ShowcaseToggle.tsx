/** Matches Toggle.astro markup for use in control tables. */
export function ShowcaseToggle(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label': string;
}) {
  return (
    <label class="ds-toggle" style={{ display: 'inline-flex' }}>
      <input
        type="checkbox"
        class="ds-toggle__input"
        role="switch"
        checked={props.checked}
        disabled={props.disabled}
        aria-label={props['aria-label']}
        onChange={(e) => props.onChange((e.target as HTMLInputElement).checked)}
      />
      <span class="ds-toggle__track" aria-hidden="true">
        <span class="ds-toggle__knob"></span>
      </span>
    </label>
  );
}
