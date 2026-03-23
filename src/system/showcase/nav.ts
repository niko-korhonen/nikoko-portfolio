export type NavItem = {
  label: string;
  /** `null` = Intro at `/system` only */
  slug: string | null;
  href: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

function pathMatches(current: string, href: string): boolean {
  const a = current.replace(/\/$/, '') || '/';
  const b = href.replace(/\/$/, '') || '/';
  return a === b;
}

export function isNavItemActive(currentPath: string, item: NavItem): boolean {
  return pathMatches(currentPath, item.href);
}

function sortNavItemsByLabel(items: NavItem[]): NavItem[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }));
}

/** Intro lives above the Primitives section in the drawer (see NavigationDrawer). */
export const INTRO_NAV_ITEM: NavItem = { label: 'Intro', slug: null, href: '/system' };

const PRIMITIVES_NAV_ITEMS: NavItem[] = [
  { label: 'Colors', slug: 'colors', href: '/system/colors' },
  { label: 'Typography', slug: 'typography', href: '/system/typography' },
  { label: 'Radius', slug: 'radius', href: '/system/radius' },
  { label: 'Icon', slug: 'icon', href: '/system/icon' },
  { label: 'Spacing', slug: 'spacing', href: '/system/spacing' },
  { label: 'Layout', slug: 'layout', href: '/system/layout' },
  { label: 'Shadows', slug: 'shadows', href: '/system/shadows' },
];

const COMPONENTS_NAV_ITEMS: NavItem[] = [
  { label: 'Button', slug: 'button', href: '/system/button' },
  { label: 'ButtonIcon', slug: 'button-icon', href: '/system/button-icon' },
  { label: 'ButtonDropdown', slug: 'button-dropdown', href: '/system/button-dropdown' },
  { label: 'MenuDropdown', slug: 'menu-dropdown', href: '/system/menu-dropdown' },
  { label: 'Badge', slug: 'badge', href: '/system/badge' },
  { label: 'Toggle', slug: 'toggle', href: '/system/toggle' },
  { label: 'SegmentControl', slug: 'segment-control', href: '/system/segment-control' },
  { label: 'Radio', slug: 'radio', href: '/system/radio' },
  { label: 'TextField', slug: 'text-field', href: '/system/text-field' },
  { label: 'Tooltip', slug: 'tooltip', href: '/system/tooltip' },
  { label: 'AnchoredToast', slug: 'anchored-toast', href: '/system/anchored-toast' },
  { label: 'ModalDialog', slug: 'modal-dialog', href: '/system/modal-dialog' },
  { label: 'ItemAction', slug: 'item-action', href: '/system/item-action' },
  { label: 'ItemStatic', slug: 'item-static', href: '/system/item-static' },
  { label: 'ItemDivider', slug: 'item-divider', href: '/system/item-divider' },
  { label: 'ItemHeader', slug: 'item-header', href: '/system/item-header' },
  { label: 'ElevatedPanel', slug: 'elevated-panel', href: '/system/elevated-panel' },
];

/** Ordered groups for the drawer and documentation (items sorted A–Z by label within each group) */
export const SYSTEM_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Primitives',
    items: sortNavItemsByLabel(PRIMITIVES_NAV_ITEMS),
  },
  {
    title: 'Components',
    items: sortNavItemsByLabel(COMPONENTS_NAV_ITEMS),
  },
];

export const SYSTEM_DEMO_SLUGS = SYSTEM_NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => i.slug).filter((s): s is string => s != null),
);

export function getDemoPageTitle(slug: string): string {
  for (const g of SYSTEM_NAV_GROUPS) {
    const found = g.items.find((i) => i.slug === slug);
    if (found) return `Niko UI — ${found.label}`;
  }
  return 'Niko UI';
}
