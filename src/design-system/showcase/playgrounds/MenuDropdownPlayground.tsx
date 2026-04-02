import { useState } from 'preact/hooks';
import { MenuDropdown } from '../../components/ui/MenuDropdown';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseSelect } from './ShowcaseSelect';

const placementOpts = [
  { id: 'bottom', label: 'Bottom' },
  { id: 'top', label: 'Top' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
];

const items = [
  { id: 'one', label: 'First option' },
  { id: 'two', label: 'Second option' },
  { id: 'three', label: 'Third option' },
];

export function MenuDropdownPlayground() {
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  const preview = (
    <MenuDropdown
      aria-label="Example menu"
      trigger={<span class="ds-type-label-m-short">Open menu</span>}
      triggerClass="ds-btn ds-btn--outline ds-btn--m"
      items={items}
      placement={placement}
    />
  );

  return (
    <ShowcasePlayground preview={preview}>
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
    </ShowcasePlayground>
  );
}
