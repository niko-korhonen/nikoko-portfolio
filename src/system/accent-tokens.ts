/** Tokens under `--color-container-accent-*` for accent UI variants (no Node deps). */
export const accentContainerTokens = [
  'container-accent-blue',
  'container-accent-purple',
  'container-accent-positive',
  'container-accent-warning',
  'container-accent-negative',
  'container-accent-subtle-blue',
  'container-accent-subtle-purple',
  'container-accent-subtle-positive',
  'container-accent-subtle-warning',
  'container-accent-subtle-negative',
] as const;

export function accentTokenCssVar(token: (typeof accentContainerTokens)[number]): string {
  return `var(--color-${token})`;
}
