export type IconSize = 'xxl' | 'xl' | 'l' | 'm' | 's';

export function DsIcon({
  name,
  size = 'm',
  class: className = '',
}: {
  name: string;
  size?: IconSize;
  class?: string;
}) {
  const src = `/icons/${name}.svg`;
  return (
    <span
      class={['ds-icon', `ds-icon--${size}`, className].filter(Boolean).join(' ')}
      style={{ ['--icon-src' as string]: `url('${src}')` }}
      aria-hidden
    />
  );
}
