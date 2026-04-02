/** Map token key (e.g. "8") to var(--spacing-8) */
export function spacing(key: string): string {
  return `var(--spacing-${key})`;
}
