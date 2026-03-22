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

/** Ordered groups for the drawer and documentation */
export const SYSTEM_NAV_GROUPS: NavGroup[] = [
  {
    title: 'Primitives',
    items: [
      { label: 'Intro', slug: null, href: '/system' },
      { label: 'Colors', slug: 'colors', href: '/system/colors' },
      { label: 'Typography', slug: 'typography', href: '/system/typography' },
      { label: 'Radius', slug: 'radius', href: '/system/radius' },
      { label: 'Icon', slug: 'icon', href: '/system/icon' },
      { label: 'Spacing', slug: 'spacing', href: '/system/spacing' },
      { label: 'Layout', slug: 'layout', href: '/system/layout' },
      { label: 'Shadows', slug: 'shadows', href: '/system/shadows' },
    ],
  },
  {
    title: 'Components',
    items: [
      { label: 'Button', slug: 'button', href: '/system/button' },
      { label: 'ButtonIcon', slug: 'button-icon', href: '/system/button-icon' },
      { label: 'ButtonDropdown', slug: 'button-dropdown', href: '/system/button-dropdown' },
      { label: 'Badge', slug: 'badge', href: '/system/badge' },
      { label: 'Toggle', slug: 'toggle', href: '/system/toggle' },
      { label: 'Segment control', slug: 'segment-control', href: '/system/segment-control' },
      { label: 'Radio', slug: 'radio', href: '/system/radio' },
      { label: 'Text field', slug: 'text-field', href: '/system/text-field' },
      { label: 'Tooltip', slug: 'tooltip', href: '/system/tooltip' },
      { label: 'Anchored toast', slug: 'anchored-toast', href: '/system/anchored-toast' },
      { label: 'Modal dialog', slug: 'modal-dialog', href: '/system/modal-dialog' },
      { label: 'Item', slug: 'item', href: '/system/item' },
      { label: 'Elevated panel', slug: 'elevated-panel', href: '/system/elevated-panel' },
    ],
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
