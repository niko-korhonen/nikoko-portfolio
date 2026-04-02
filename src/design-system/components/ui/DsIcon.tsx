export type IconSize = 'xxl' | 'xl' | 'l' | 'm' | 's';

export function DsIcon({ name, size = 'm' }: { name: string; size?: IconSize }) {
  const src = `/icons/${name}.svg`;
  return (
    <span
      class={`ds-icon ds-icon--${size}`}
      style={{ ['--icon-src' as string]: `url('${src}')` }}
      aria-hidden
    />
  );
}
