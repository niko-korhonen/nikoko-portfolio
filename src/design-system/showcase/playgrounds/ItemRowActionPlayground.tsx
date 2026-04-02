import { useState } from 'preact/hooks';
import { DsIcon } from '../../components/ui/DsIcon';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseTextField } from './ShowcaseTextField';
import { ShowcaseToggle } from './ShowcaseToggle';
import { ShowcaseSelect } from './ShowcaseSelect';

const variantOpts = [
  { id: 'subtle', label: 'Subtle' },
  { id: 'outline', label: 'Outline' },
  { id: 'ghost', label: 'Ghost' },
];

export function ItemRowActionPlayground() {
  const [variant, setVariant] = useState<'subtle' | 'outline' | 'ghost'>('subtle');
  const [label, setLabel] = useState('Label');
  const [description, setDescription] = useState('Description');
  const [showDescription, setShowDescription] = useState(true);
  const [detail, setDetail] = useState('Detail');
  const [showDetail, setShowDetail] = useState(false);
  const [showChevron, setShowChevron] = useState(true);
  const [selected, setSelected] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const cls = [
    'ds-item-row',
    `ds-item-row--${variant}`,
    selected && 'ds-item-row--selected',
  ]
    .filter(Boolean)
    .join(' ');

  const preview = (
    <button type="button" class={cls} disabled={disabled} style={{ width: '100%', maxWidth: '24rem' }}>
      <span class="ds-item-row__inner">
        <span class="ds-item-row__main">
          <span class="ds-type-label-l-short" style={{ color: 'var(--foreground-primary)' }}>
            {label}
          </span>
          {showDescription && (
            <span class="ds-type-body-l-short" style={{ color: 'var(--foreground-secondary)' }}>
              {description}
            </span>
          )}
        </span>
        {showDetail && (
          <span class="ds-item-row__detail ds-type-body-l-short" style={{ color: 'var(--foreground-secondary)' }}>
            {detail}
          </span>
        )}
        {showChevron && (
          <span class="ds-item-row__chevron" aria-hidden="true">
            <DsIcon name="chevron-right-outlined" size="m" />
          </span>
        )}
      </span>
    </button>
  );

  return (
    <ShowcasePlayground preview={preview}>
      <ShowcaseControlRow
        name="Variant"
        control={
          <ShowcaseSelect
            aria-label="Variant"
            value={variant}
            options={variantOpts}
            onChange={(id) => setVariant(id as 'subtle' | 'outline' | 'ghost')}
          />
        }
      />
      <ShowcaseControlRow
        name="Label"
        control={<ShowcaseTextField value={label} onChange={setLabel} placeholder="Label" />}
      />
      <ShowcaseControlRow
        name="Description"
        control={
          <ShowcaseToggle
            aria-label="Show description"
            checked={showDescription}
            onChange={setShowDescription}
          />
        }
      />
      {showDescription && (
        <ShowcaseControlRow
          name="Description text"
          control={
            <ShowcaseTextField value={description} onChange={setDescription} placeholder="Description" />
          }
        />
      )}
      <ShowcaseControlRow
        name="Detail"
        control={
          <ShowcaseToggle aria-label="Show detail" checked={showDetail} onChange={setShowDetail} />
        }
      />
      {showDetail && (
        <ShowcaseControlRow
          name="Detail text"
          control={<ShowcaseTextField value={detail} onChange={setDetail} placeholder="Detail" />}
        />
      )}
      <ShowcaseControlRow
        name="Chevron"
        control={
          <ShowcaseToggle
            aria-label="Show chevron"
            checked={showChevron}
            onChange={setShowChevron}
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
