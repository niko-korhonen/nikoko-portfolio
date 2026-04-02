import type { PrimitiveSlug } from './navigation';

export const primitiveMeta: Record<
  PrimitiveSlug,
  { title: string; description: string }
> = {
  breakpoints: {
    title: 'Breakpoints',
    description: 'Responsive width bands: S, M, L, XL. Pair with layout primitives and media queries.',
  },
  colors: {
    title: 'Colors',
    description: 'Semantic tokens for UI; palette reference for documentation. Never use raw palette values in components.',
  },
  spacing: {
    title: 'Spacing',
    description: 'Density spacing scale for gaps, padding, and layout rhythm.',
  },
  radius: {
    title: 'Radius',
    description: 'Corner radii from density tokens, including pill/infinite for buttons.',
  },
  typography: {
    title: 'Typography',
    description: 'Saans, Google Sans Flex, and Google Sans Code tied to density text styles.',
  },
  icons: {
    title: 'Icons',
    description: 'SVG icon set in /public/icons with mask-based Icon component and size tokens.',
  },
  grid: {
    title: 'Grid',
    description: 'Two-dimensional layouts for galleries, cards, and structured regions.',
  },
  container: {
    title: 'Container',
    description: 'Readable max width and horizontal gutters for page content.',
  },
  stack: {
    title: 'Stack',
    description: 'Vertical flex layout with tokenized gap; parent owns spacing between children.',
  },
  inline: {
    title: 'Inline',
    description: 'Horizontal flex layout with optional wrap and tokenized gap.',
  },
  center: {
    title: 'Center',
    description: 'Axis alignment for empty states, heroes, and modals without extra layout chrome.',
  },
  split: {
    title: 'Split',
    description: 'Primary + secondary regions with fixed side width and responsive collapse.',
  },
  overlay: {
    title: 'Overlay',
    description: 'Temporary layers with scrim, placement, and dismissal — modals, drawers, nav.',
  },
  'navigation-model': {
    title: 'Navigation model',
    description: 'Shared data for all navigation patterns: one source of truth for labels, icons, and routes.',
  },
};
