import { ButtonDropdown } from '../../components/ui/ButtonDropdown';

const items = [
  { id: 'one', label: 'First option' },
  { id: 'two', label: 'Second option' },
  { id: 'three', label: 'Third option' },
];

export function ButtonDropdownDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-24)' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-16)',
          alignItems: 'center',
        }}
      >
        <ButtonDropdown variant="fill" size="l" aria-label="Fill size L" items={items}>
          Label L
        </ButtonDropdown>
        <ButtonDropdown variant="fill" size="m" aria-label="Fill size M" items={items}>
          Label M
        </ButtonDropdown>
        <ButtonDropdown variant="fill" size="s" aria-label="Fill size S" items={items}>
          Label S
        </ButtonDropdown>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-16)',
          alignItems: 'center',
        }}
      >
        <ButtonDropdown variant="fill" aria-label="Fill" items={items}>
          Fill
        </ButtonDropdown>
        <ButtonDropdown variant="outline" aria-label="Outline" items={items}>
          Outline
        </ButtonDropdown>
        <ButtonDropdown variant="subtle" aria-label="Subtle" items={items}>
          Subtle
        </ButtonDropdown>
        <ButtonDropdown variant="ghost" aria-label="Ghost" items={items}>
          Ghost
        </ButtonDropdown>
        <span
          style={{
            display: 'inline-flex',
            padding: 'var(--spacing-8)',
            background: 'var(--surface-inverse)',
            borderRadius: 'var(--radius-m)',
          }}
        >
          <ButtonDropdown variant="ghost-inverse" aria-label="Ghost inverse" items={items}>
            Ghost inv.
          </ButtonDropdown>
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-16)',
          alignItems: 'center',
        }}
      >
        <ButtonDropdown variant="fill" disabled aria-label="Disabled" items={items}>
          Disabled
        </ButtonDropdown>
      </div>
    </div>
  );
}
