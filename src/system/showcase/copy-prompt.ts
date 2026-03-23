/**
 * Build paste-friendly strings for LLM prompts from showcase control state.
 */

export type CopyPromptOptions = {
  component: string;
  /** Props / settings to describe (values should be JSON-serializable) */
  props?: Record<string, string | number | boolean | null | undefined>;
  /** Extra sentence, e.g. slot usage */
  note?: string;
};

const PROP_ORDER_HINTS = [
  'variant',
  'size',
  'semantic',
  'tone',
  'position',
  'align',
  'disabled',
  'label',
  'placeholder',
  'pattern',
  'name',
];

function sortPropKeys(keys: string[]): string[] {
  const rank = (k: string) => {
    const i = PROP_ORDER_HINTS.indexOf(k);
    return i >= 0 ? i : 1000;
  };
  return [...keys].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

/** Stable key order for readable prompts */
export function serializePropsForPrompt(props: Record<string, string | number | boolean | null | undefined>): string {
  const entries = sortPropKeys(Object.keys(props))
    .map((k) => {
      const v = props[k];
      if (v === undefined || v === '') return null;
      if (typeof v === 'boolean') return `${k} ${v ? 'true' : 'false'}`;
      if (typeof v === 'number') return `${k} ${v}`;
      return `${k} "${String(v)}"`;
    })
    .filter(Boolean);
  return entries.join(', ');
}

export function buildCopyPrompt({ component, props = {}, note }: CopyPromptOptions): string {
  const parts: string[] = [`Use the ${component} component`];
  const serialized = serializePropsForPrompt(props);
  if (serialized) {
    parts.push(`with ${serialized}`);
  }
  parts.push('.');
  if (note?.trim()) {
    parts.push(` ${note.trim()}`);
  }
  return parts.join(' ').replace(/\s+\./g, '.').trim();
}
