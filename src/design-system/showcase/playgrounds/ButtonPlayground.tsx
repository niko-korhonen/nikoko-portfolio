import { useState } from 'preact/hooks';
import { DsIcon } from '../../components/ui/DsIcon';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseTextField } from './ShowcaseTextField';
import { ShowcaseToggle } from './ShowcaseToggle';
import { ShowcaseSelect } from './ShowcaseSelect';

const sizeOpts = [
  { id: 'l', label: 'L' },
  { id: 'm', label: 'M' },
  { id: 's', label: 'S' },
];

const variantOpts = [
  { id: 'fill', label: 'Fill' },
  { id: 'outline', label: 'Outline' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'ghost', label: 'Ghost' },
  { id: 'ghost-inverse', label: 'Ghost inv.' },
];

export function ButtonPlayground() {
  const [size, setSize] = useState<'l' | 'm' | 's'>('m');
  const [variant, setVariant] = useState<
    'fill' | 'outline' | 'subtle' | 'ghost' | 'ghost-inverse'
  >('fill');
  const [label, setLabel] = useState('Button');
  const [leading, setLeading] = useState(false);
  const [trailing, setTrailing] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const v =
    variant === 'ghost-inverse'
      ? 'ghost-inverse'
      : variant === 'ghost'
        ? 'ghost'
        : variant;
  const cls = ['ds-btn', `ds-btn--${v}`, `ds-btn--${size}`].join(' ');
  const iconSize = size === 'l' ? 'xl' : size === 'm' ? 'l' : 'm';

  const inner = (
    <button type="button" class={cls} disabled={disabled}>
      {leading && <DsIcon name="search-outlined" size={iconSize} />}
      <span class="ds-btn__label">{label}</span>
      {trailing && <DsIcon name="chevron-right-outlined" size={iconSize} />}
    </button>
  );

  const preview =
    variant === 'ghost-inverse' ? (
      <span
        style={{
          display: 'inline-flex',
          padding: 'var(--spacing-8)',
          background: 'var(--surface-inverse)',
          borderRadius: 'var(--radius-m)',
        }}
      >
        {inner}
      </span>
    ) : (
      inner
    );

  return (
    <ShowcasePlayground preview={preview}>
      <ShowcaseControlRow
        name="Size"
        control={
          <ShowcaseSelect
            aria-label="Size"
            value={size}
            options={sizeOpts}
            onChange={(id) => setSize(id as 'l' | 'm' | 's')}
          />
        }
      />
      <ShowcaseControlRow
        name="Variant"
        control={
          <ShowcaseSelect
            aria-label="Variant"
            value={variant}
            options={variantOpts}
            onChange={(id) =>
              setVariant(
                id as 'fill' | 'outline' | 'subtle' | 'ghost' | 'ghost-inverse',
              )
            }
          />
        }
      />
      <ShowcaseControlRow
        name="Label"
        control={<ShowcaseTextField value={label} onChange={setLabel} placeholder="Label" />}
      />
      <ShowcaseControlRow
        name="Leading icon"
        control={
          <ShowcaseToggle
            aria-label="Leading icon"
            checked={leading}
            onChange={setLeading}
          />
        }
      />
      <ShowcaseControlRow
        name="Trailing icon"
        control={
          <ShowcaseToggle
            aria-label="Trailing icon"
            checked={trailing}
            onChange={setTrailing}
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
