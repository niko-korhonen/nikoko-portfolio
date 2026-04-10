import { useState } from 'preact/hooks';
import { DsIcon } from '../../components/ui/DsIcon';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseTextField } from './ShowcaseTextField';
import { ShowcaseSelect } from './ShowcaseSelect';
import { ShowcaseToggle } from './ShowcaseToggle';

const placementOpts = [
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

const alignOpts = [
  { id: 'start', label: 'Start' },
  { id: 'center', label: 'Center' },
  { id: 'end', label: 'End' },
];

export function TooltipPlayground() {
  const [label, setLabel] = useState('Tooltip');
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [align, setAlign] = useState<'start' | 'center' | 'end'>('center');
  const [open, setOpen] = useState(true);

  const preview = (
    <span
      class={`ds-tooltip ds-tooltip--${placement} ds-tooltip--align-${align}`}
      data-open={open ? 'true' : undefined}
    >
      <span class="ds-tooltip__trigger">
        <button type="button" class="ds-btn-icon ds-btn-icon--subtle ds-btn-icon--m" aria-label="Tooltip trigger">
          <DsIcon name="info-circle-outlined" size="l" />
        </button>
      </span>
      <span class="ds-tooltip__content ds-type-label-m-short" role="tooltip">
        {label}
      </span>
    </span>
  );

  return (
    <ShowcasePlayground preview={preview}>
      <ShowcaseControlRow
        name="Label"
        control={<ShowcaseTextField value={label} onChange={setLabel} placeholder="Tooltip" />}
      />
      <ShowcaseControlRow
        name="Placement"
        control={
          <ShowcaseSelect
            aria-label="Placement"
            value={placement}
            options={placementOpts}
            onChange={(id) => setPlacement(id as 'top' | 'bottom' | 'left' | 'right')}
          />
        }
      />
      <ShowcaseControlRow
        name="Align"
        control={
          <ShowcaseSelect
            aria-label="Align"
            value={align}
            options={alignOpts}
            onChange={(id) => setAlign(id as 'start' | 'center' | 'end')}
          />
        }
      />
      <ShowcaseControlRow
        name="Always show"
        control={<ShowcaseToggle aria-label="Always show" checked={open} onChange={setOpen} />}
      />
    </ShowcasePlayground>
  );
}
