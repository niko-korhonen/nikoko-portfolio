/**
 * Shared placement model for anchored overlays (menus, tooltips, future popovers).
 *
 * position — which side of the trigger the panel opens toward.
 * align    — how the panel lines up along the cross axis (horizontal for top/bottom, vertical for left/right).
 */

export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';

export type PopoverAlign = 'start' | 'center' | 'end';
