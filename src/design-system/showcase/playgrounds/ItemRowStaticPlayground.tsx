import { useState } from 'preact/hooks';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseTextField } from './ShowcaseTextField';
import { ShowcaseToggle } from './ShowcaseToggle';
import { ShowcaseSelect } from './ShowcaseSelect';

const variantOpts = [
  { id: 'subtle', label: 'Subtle' },
  { id: 'outline', label: 'Outline' },
  { id: 'ghost', label: 'Ghost' },
];

export function ItemRowStaticPlayground() {
  const [variant, setVariant] = useState<'subtle' | 'outline' | 'ghost'>('subtle');
  const [label, setLabel] = useState('Read-only row');
  const [description, setDescription] = useState('Optional description');
  const [showDescription, setShowDescription] = useState(true);
  const [detail, setDetail] = useState('42');
  const [showDetail, setShowDetail] = useState(true);

  const cls = ['ds-item-row', 'ds-item-row--static', `ds-item-row--${variant}`].join(' ');

  const preview = (
    <div class={cls} style={{ width: '100%', maxWidth: '24rem' }}>
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
      </span>
    </div>
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
    </ShowcasePlayground>
  );
}
