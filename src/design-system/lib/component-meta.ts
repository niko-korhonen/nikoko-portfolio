import type { ComponentSlug } from './navigation';

export const componentMeta: Record<
  ComponentSlug,
  { title: string; description: string }
> = {
  button: {
    title: 'Button',
    description: 'Five variants, three sizes, optional icons, pill radius, token-driven interactive states.',
  },
  'button-dropdown': {
    title: 'Button dropdown',
    description:
      'Same sizes and variants as Button with a trailing chevron; opens a menu and uses selected tokens while open.',
  },
  'button-icon': {
    title: 'Button icon',
    description: 'Icon-only button with the same variants plus a selected state.',
  },
  toggle: {
    title: 'Toggle',
    description:
      'Binary switch with outline track when off and solid fill when on; token-driven hover, press, and disabled states.',
  },
  radio: {
    title: 'Radio',
    description:
      '20×20 control: outline ring on surface-1 when unselected; solid fill with radio-filled dot in inverse when selected.',
  },
  'item-row-action': {
    title: 'Item row (action)',
    description: 'Interactive row with label, optional description, detail, slots, and chevron.',
  },
  'item-row-static': {
    title: 'Item row (static)',
    description: 'Read-only row matching action layout without interaction or chevron.',
  },
  'item-row-divider': {
    title: 'Item row divider',
    description: 'Muted 1px divider with vertical padding for stacked rows.',
  },
  'item-row-header': {
    title: 'Item row header',
    description: 'Section label for row groups using secondary body text.',
  },
  'menu-dropdown': {
    title: 'Menu dropdown',
    description: 'Anchored menu with viewport clamping, scroll, and surface-5 elevation.',
  },
};
