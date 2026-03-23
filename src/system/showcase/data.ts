import fs from 'node:fs';
import path from 'node:path';

export const colorGroups: { title: string; tokens: string[] }[] = [
  {
    title: 'Content',
    tokens: [
      'content-primary',
      'content-secondary',
      'content-tertiary',
      'content-primary-inverse',
      'content-secondary-inverse',
      'content-tertiary-inverse',
      'content-static-black',
      'content-static-white',
      'content-blue',
      'content-purple',
      'content-positive',
      'content-warning',
      'content-negative',
    ],
  },
  {
    title: 'Container',
    tokens: [
      'container-primary',
      'container-primary-inverse',
      'container-elevation',
      'container-floating',
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
    ],
  },
  {
    title: 'Surface',
    tokens: [
      'surface-base',
      'surface-elevation',
      'surface-floating',
      'surface-blue',
      'surface-purple',
      'surface-positive',
      'surface-warning',
      'surface-negative',
      'surface-subtle-blue',
      'surface-subtle-purple',
      'surface-subtle-positive',
      'surface-subtle-warning',
      'surface-subtle-negative',
    ],
  },
  {
    title: 'Outline',
    tokens: [
      'outline-primary',
      'outline-secondary',
      'outline-tertiary',
      'outline-blue',
      'outline-purple',
      'outline-positive',
      'outline-warning',
      'outline-negative',
      'outline-subtle-blue',
      'outline-subtle-purple',
      'outline-subtle-positive',
      'outline-subtle-warning',
      'outline-subtle-negative',
    ],
  },
  {
    title: 'Component',
    tokens: [
      'component-active',
      'component-hover',
      'component-hover-inverse',
      'component-pressed',
      'component-pressed-inverse',
      'component-focused',
    ],
  },
  {
    title: 'Overlay',
    tokens: ['overlay-primary'],
  },
];

export const radiusTokens = ['none', 'lowest', 'low', 'medium', 'high', 'highest'] as const;

export const iconSizes = [
  { key: 'l', label: 'L' },
  { key: 'm', label: 'M' },
  { key: 's', label: 'S' },
  { key: 'xs', label: 'XS' },
] as const;

export const iconGridSegmentItems = [
  { value: 'l', label: 'Large', content: 'label' as const },
  { value: 'm', label: 'Medium', content: 'label' as const },
  { value: 's', label: 'Small', content: 'label' as const },
  { value: 'xs', label: 'Extra Small', content: 'label' as const },
] as const;

export type TypoCat = {
  name: string;
  label: string;
  sizes: { classSuffix: string; sample: string }[];
};

export const typoCategories: TypoCat[] = [
  {
    name: 'display',
    label: 'Display',
    sizes: [
      { classSuffix: 'display-l', sample: 'Display L' },
      { classSuffix: 'display-m', sample: 'Display M' },
      { classSuffix: 'display-s', sample: 'Display S' },
    ],
  },
  {
    name: 'headline',
    label: 'Headline',
    sizes: [
      { classSuffix: 'headline-l', sample: 'Headline L' },
      { classSuffix: 'headline-m', sample: 'Headline M' },
      { classSuffix: 'headline-s', sample: 'Headline S' },
    ],
  },
  {
    name: 'label',
    label: 'Label',
    sizes: [
      { classSuffix: 'label-l', sample: 'Label L' },
      { classSuffix: 'label-m', sample: 'Label M' },
      { classSuffix: 'label-s', sample: 'Label S' },
      { classSuffix: 'label-xs', sample: 'Label XS' },
      { classSuffix: 'label-xxs', sample: 'Label XXS' },
    ],
  },
  {
    name: 'body',
    label: 'Body',
    sizes: [
      { classSuffix: 'body-l', sample: 'Body L' },
      { classSuffix: 'body-m', sample: 'Body M' },
      { classSuffix: 'body-s', sample: 'Body S' },
      { classSuffix: 'body-xs', sample: 'Body XS' },
      { classSuffix: 'body-xxs', sample: 'Body XXS' },
    ],
  },
  {
    name: 'code',
    label: 'Code',
    sizes: [
      { classSuffix: 'code-l', sample: 'Code L' },
      { classSuffix: 'code-m', sample: 'Code M' },
      { classSuffix: 'code-s', sample: 'Code S' },
      { classSuffix: 'code-xs', sample: 'Code XS' },
      { classSuffix: 'code-xxs', sample: 'Code XXS' },
    ],
  },
];

export const spacingTokens = [
  'space-2',
  'space-4',
  'space-6',
  'space-8',
  'space-10',
  'space-12',
  'space-14',
  'space-16',
  'space-18',
  'space-20',
  'space-22',
  'space-24',
  'space-28',
  'space-32',
  'space-36',
  'space-40',
  'space-44',
  'space-50',
  'space-56',
  'space-62',
  'space-68',
  'space-74',
] as const;

import { accentContainerTokens, accentTokenCssVar } from '../accent-tokens';

export { accentContainerTokens, accentTokenCssVar } from '../accent-tokens';

export function accentTokenMenuLabel(token: (typeof accentContainerTokens)[number]): string {
  return token
    .replace(/^container-accent-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export const btnMatrixVariants = ['primary', 'secondary', 'ghost', 'accent'] as const;
export const btnMatrixSizes = ['l', 'm', 's'] as const;
export const btnMatrixRows = [
  { id: 'default', label: 'Default' },
  { id: 'disabled', label: 'Disabled' },
] as const;

export const btnIconMatrixRows = [
  { id: 'default', label: 'Default' },
  { id: 'disabled', label: 'Disabled' },
] as const;

export const segmentShowcaseItems = [
  {
    value: 'only-icon',
    icon: 'placeholder',
    content: 'icon' as const,
    ariaLabel: 'Icon only',
  },
  {
    value: 'icon-label',
    icon: 'placeholder',
    label: 'Label',
    content: 'both' as const,
  },
  {
    value: 'only-label',
    label: 'Text',
    content: 'label' as const,
  },
] as const;

export const btnDropdownVariants = ['primary', 'secondary', 'ghost', 'accent'] as const;
export const btnDropdownSizes = ['l', 'm', 's'] as const;

export function variantLabel(v: string) {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

export function iconSizeForButton(size: 'l' | 'm' | 's'): 'm' | 's' {
  return size === 'l' ? 'm' : 's';
}

/** Grouped icon names for showcase picker (outline and/or fill assets). */
export type IconBaseCatalogEntry = {
  name: string;
  hasOutline: boolean;
  hasFill: boolean;
};

export function buildIconBaseCatalog(
  entries: { name: string; style: 'fill' | 'outline' }[],
): IconBaseCatalogEntry[] {
  const map = new Map<string, { outline: boolean; fill: boolean }>();
  for (const e of entries) {
    const cur = map.get(e.name) ?? { outline: false, fill: false };
    if (e.style === 'outline') cur.outline = true;
    else cur.fill = true;
    map.set(e.name, cur);
  }
  return [...map.entries()]
    .filter(([, v]) => v.outline || v.fill)
    .map(([name, v]) => ({ name, hasOutline: v.outline, hasFill: v.fill }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadAllIconEntries(): { name: string; style: 'fill' | 'outline' }[] {
  const iconsDir = path.join(process.cwd(), 'public/icons');
  const iconSvgFiles = fs.existsSync(iconsDir)
    ? fs.readdirSync(iconsDir).filter((f) => f.endsWith('.svg'))
    : [];
  const allIconEntries: { name: string; style: 'fill' | 'outline' }[] = [];
  for (const f of iconSvgFiles) {
    const m = f.match(/^icon-(.+)-(fill|outline)\.svg$/);
    if (!m) continue;
    allIconEntries.push({ name: m[1], style: m[2] as 'fill' | 'outline' });
  }
  allIconEntries.sort((a, b) => `${a.name}-${a.style}`.localeCompare(`${b.name}-${b.style}`));
  return allIconEntries;
}
