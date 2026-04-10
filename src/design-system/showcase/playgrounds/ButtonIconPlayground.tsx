import { useState } from 'preact/hooks';
import { DsIcon } from '../../components/ui/DsIcon';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseToggle } from './ShowcaseToggle';
import { ShowcaseSelect } from './ShowcaseSelect';
import { ShowcaseTextField } from './ShowcaseTextField';

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

const iconOpts = [
  { id: 'search-outlined', label: 'Search' },
  { id: 'settings-gear-outlined', label: 'Settings' },
  { id: 'heart-outlined', label: 'Heart' },
  { id: 'sun-outlined', label: 'Sun' },
];

const tooltipPlacementOpts = [
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

const tooltipAlignOpts = [
  { id: 'start', label: 'Start' },
  { id: 'center', label: 'Center' },
  { id: 'end', label: 'End' },
];

export function ButtonIconPlayground() {
  const [size, setSize] = useState<'l' | 'm' | 's'>('m');
  const [variant, setVariant] = useState<
    'fill' | 'outline' | 'subtle' | 'ghost' | 'ghost-inverse'
  >('fill');
  const [icon, setIcon] = useState('search-outlined');
  const [selected, setSelected] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipLabel, setTooltipLabel] = useState('Icon button');
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [tooltipAlign, setTooltipAlign] = useState<'start' | 'center' | 'end'>('center');

  const v =
    variant === 'ghost-inverse'
      ? 'ghost-inverse'
      : variant === 'ghost'
        ? 'ghost'
        : variant;
  const cls = [
    'ds-btn-icon',
    `ds-btn-icon--${v}`,
    `ds-btn-icon--${size}`,
    selected && 'ds-btn-icon--selected',
  ]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <button
      type="button"
      class={cls}
      disabled={disabled}
      aria-label="Icon button"
      aria-pressed={selected ? 'true' : undefined}
    >
      <DsIcon name={icon} size={size === 'l' ? 'xl' : size === 'm' ? 'l' : 'm'} />
    </button>
  );

  const withTooltip = showTooltip ? (
    <span
      class={`ds-tooltip ds-tooltip--${tooltipPlacement} ds-tooltip--align-${tooltipAlign}`}
      data-open="true"
    >
      <span class="ds-tooltip__trigger">{inner}</span>
      <span class="ds-tooltip__content ds-type-label-m-short" role="tooltip">
        {tooltipLabel}
      </span>
    </span>
  ) : (
    inner
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
        {withTooltip}
      </span>
    ) : (
      withTooltip
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
        name="Icon"
        control={
          <ShowcaseSelect
            aria-label="Icon"
            value={icon}
            options={iconOpts}
            onChange={setIcon}
          />
        }
      />
      <ShowcaseControlRow
        name="Selected"
        control={
          <ShowcaseToggle
            aria-label="Selected"
            checked={selected}
            onChange={setSelected}
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
      <ShowcaseControlRow
        name="Tooltip"
        control={
          <ShowcaseToggle
            aria-label="Tooltip"
            checked={showTooltip}
            onChange={setShowTooltip}
          />
        }
      />
      <ShowcaseControlRow
        name="Tooltip label"
        control={
          <ShowcaseTextField
            value={tooltipLabel}
            onChange={setTooltipLabel}
            placeholder="Tooltip label"
          />
        }
      />
      <ShowcaseControlRow
        name="Tooltip placement"
        control={
          <ShowcaseSelect
            aria-label="Tooltip placement"
            value={tooltipPlacement}
            options={tooltipPlacementOpts}
            onChange={(id) => setTooltipPlacement(id as 'top' | 'bottom' | 'left' | 'right')}
          />
        }
      />
      <ShowcaseControlRow
        name="Tooltip align"
        control={
          <ShowcaseSelect
            aria-label="Tooltip align"
            value={tooltipAlign}
            options={tooltipAlignOpts}
            onChange={(id) => setTooltipAlign(id as 'start' | 'center' | 'end')}
          />
        }
      />
    </ShowcasePlayground>
  );
}
