export function ShowcaseTextField(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      class="ds-showcase-textfield ds-type-body-m-short"
      value={props.value}
      placeholder={props.placeholder}
      onInput={(e) => props.onChange((e.target as HTMLInputElement).value)}
    />
  );
}
