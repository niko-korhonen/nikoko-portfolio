# Design Token Usage Rules

## Typography

- Always default to `-plain` typography tokens.
- When in doubt:
  - Use **Label S** for UI labels, buttons, navigation and compact interface text.
  - Use **Body S** for longer readable text blocks.
- Do not invent custom font sizes or weights.
- Always use predefined typography tokens.

## Colors

- Never hardcode color values (hex, rgb, hsl) in components or layouts.
- Always use semantic color tokens.

### Content

Used only for:

- text
- icons

### Container

Used for:

- interactive elements such as buttons, toggles, inputs
- emphasized UI blocks

### Surface

Used for:

- page backgrounds
- panels, cards, modals
- elevation layers

### Outline

Used for:

- borders
- dividers
- input outlines

### Component (State)

Used for:

- hover, pressed, focus, active overlays
- modifying visual state of an element without changing its base color

### Overlay

Used for:

- dimming the UI behind dialogs or modal surfaces

## Corner Radius

- Always use corner radius tokens.
- Do not apply arbitrary radius values.

## Icon Sizes

- Always use icon size tokens (`L`, `M`, `S`, `XS`).
- Icons should inherit color from content tokens.

## Layout and Spacing (Principle)

- Prefer consistent spacing values.
- Avoid random pixel spacing.
- Prefer composing layouts from reusable layout primitives rather than writing one-off CSS.
