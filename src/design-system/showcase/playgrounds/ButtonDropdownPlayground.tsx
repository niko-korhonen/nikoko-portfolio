import { useState } from 'preact/hooks';
import { ButtonDropdown } from '../../components/ui/ButtonDropdown';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
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

const items = [
  { id: 'one', label: 'First option' },
  { id: 'two', label: 'Second option' },
  { id: 'three', label: 'Third option' },
];

export function ButtonDropdownPlayground() {
  const [size, setSize] = useState<'l' | 'm' | 's'>('m');
  const [variant, setVariant] = useState<
    'fill' | 'outline' | 'subtle' | 'ghost' | 'ghost-inverse'
  >('fill');
  const [disabled, setDisabled] = useState(false);

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
        <ButtonDropdown
          variant={variant}
          size={size}
          disabled={disabled}
          aria-label="Example dropdown"
          items={items}
        >
          Options
        </ButtonDropdown>
      </span>
    ) : (
      <ButtonDropdown
        variant={variant}
        size={size}
        disabled={disabled}
        aria-label="Example dropdown"
        items={items}
      >
        Options
      </ButtonDropdown>
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
