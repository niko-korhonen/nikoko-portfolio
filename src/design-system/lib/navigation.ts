/**
 * Single source of truth for navigation: labels, icons, destinations stay consistent
 * across Rail, SidebarNav, MobileAppBarNav, and NavOverlay.
 */
export type NavPriority = 'primary' | 'secondary';

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  destination: string;
  group?: string;
  priority: NavPriority;
  order: number;
  children?: NavItem[];
}

/** Normalize path for comparison (handles /s vs /s/, trailing slashes). */
export function normalizeNavPath(path: string): string {
  const t = path.trim();
  if (t === '' || t === '/') return '/';
  return t.replace(/\/+$/, '') || '/';
}

/** True when this nav link targets the current page (e.g. TOC current item). */
export function isNavItemCurrent(destination: string, pathname: string): boolean {
  return normalizeNavPath(destination) === normalizeNavPath(pathname);
}

/** Showcase (/s/) routes — expand as you add primitives or components */
export const primitiveSlugs = [
  'breakpoints',
  'colors',
  'spacing',
  'radius',
  'typography',
  'icons',
  'grid',
  'container',
  'stack',
  'inline',
  'center',
  'split',
  'overlay',
  'navigation-model',
] as const;

export type PrimitiveSlug = (typeof primitiveSlugs)[number];

export const componentSlugs = [
  'button',
  'button-icon',
  'item-row-action',
  'item-row-static',
  'item-row-divider',
  'item-row-header',
  'menu-dropdown',
] as const;

export type ComponentSlug = (typeof componentSlugs)[number];

function primitiveNavItems(): NavItem[] {
  return primitiveSlugs.map((slug, i) => ({
    id: `primitive-${slug}`,
    label: titleCase(slug.replace(/-/g, ' ')),
    destination: `/s/primitive/${slug}`,
    group: 'Primitives',
    priority: 'secondary',
    order: 100 + i,
  }));
}

function componentNavItems(): NavItem[] {
  return componentSlugs.map((slug, i) => ({
    id: `component-${slug}`,
    label: titleCase(slug.replace(/-/g, ' ')),
    destination: `/s/component/${slug}`,
    group: 'Components',
    priority: 'secondary',
    order: 200 + i,
  }));
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

const showcaseNav: NavItem[] = [
  {
    id: 'intro',
    label: 'Intro',
    icon: 'house-outlined',
    destination: '/s/',
    group: 'Welcome',
    priority: 'primary',
    order: 0,
  },
  ...primitiveNavItems(),
  ...componentNavItems(),
  {
    id: 'exit-home',
    label: 'Exit to site',
    icon: 'arrow-box-right-outline',
    destination: '/',
    group: 'Welcome',
    priority: 'primary',
    order: 50,
  },
];

export function getAllNavItems(): NavItem[] {
  return [...showcaseNav].sort((a, b) => a.order - b.order);
}

export function getPrimaryItems(): NavItem[] {
  return getAllNavItems().filter((i) => i.priority === 'primary');
}

export function getSecondaryItems(): NavItem[] {
  return getAllNavItems().filter((i) => i.priority === 'secondary');
}

/** Grouped sections for SidebarNav / overlay (headers + links) */
export function getShowcaseTocSections(): { header: string; items: NavItem[] }[] {
  const items = getAllNavItems();
  const intro = items.filter((i) => i.id === 'intro');
  const primitives = items.filter((i) => i.group === 'Primitives');
  const components = items.filter((i) => i.group === 'Components');
  return [
    { header: 'Welcome', items: intro },
    { header: 'Primitives', items: primitives },
    { header: 'Components', items: components },
  ];
}

/** First four primary + overflow as "more" for mobile bar */
export function getMobileBarItems(): { main: NavItem[]; overflow: NavItem[] } {
  const primary = getPrimaryItems().sort((a, b) => a.order - b.order);
  const maxVisible = 4;
  if (primary.length <= maxVisible) {
    return { main: primary, overflow: [] };
  }
  return {
    main: primary.slice(0, maxVisible),
    overflow: primary.slice(maxVisible),
  };
}
