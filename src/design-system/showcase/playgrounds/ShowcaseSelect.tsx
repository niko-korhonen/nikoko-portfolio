import { ButtonDropdown } from '../../components/ui/ButtonDropdown';

export function ShowcaseSelect(props: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  'aria-label': string;
}) {
  const label = props.options.find((o) => o.id === props.value)?.label ?? props.value;
  return (
    <div style={{ display: 'inline-flex', justifyContent: 'flex-end', width: '100%' }}>
      <ButtonDropdown
        variant="subtle"
        size="s"
        aria-label={props['aria-label']}
        items={props.options.map((o) => ({ id: o.id, label: o.label }))}
        onSelect={props.onChange}
      >
        {label}
      </ButtonDropdown>
    </div>
  );
}
