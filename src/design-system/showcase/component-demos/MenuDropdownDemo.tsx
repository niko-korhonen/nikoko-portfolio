import { MenuDropdown } from '../../components/ui/MenuDropdown';

export function MenuDropdownDemo() {
  return (
    <MenuDropdown
      aria-label="Example menu"
      trigger={<span class="ds-type-label-m-short">Open menu</span>}
      triggerClass="ds-btn ds-btn--outline ds-btn--m"
      items={[
        { id: 'one', label: 'First option' },
        { id: 'two', label: 'Second option' },
        { id: 'three', label: 'Third option' },
      ]}
    />
  );
}
