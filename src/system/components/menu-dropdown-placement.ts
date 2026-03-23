/**
 * Viewport-aware placement for MenuDropdown: optional flip + max-height so long menus
 * scroll inside instead of extending the page scroll.
 *
 * When open, the panel uses position:fixed + viewport coordinates so it does not expand
 * overflow:auto ancestors (e.g. system shell main scroll area).
 */

import type { PopoverAlign, PopoverPosition } from '../placement';

const PAD = 8;
const MIN_VIEWPORT_MAX = 120;
const MAX_VH_RATIO = 0.62;
const FIXED_Z = 320;
/** Rough ItemAction row height; used to prefer flipping when the list would show fewer rows. */
const EST_MENU_ROW_PX = 40;
const MIN_ROWS_COMFORTABLE = 4;

function getGapPx(panel: HTMLElement): number {
  const raw = getComputedStyle(panel).getPropertyValue('--popover-gap').trim();
  if (raw.endsWith('px')) return Math.max(0, parseFloat(raw)) || 8;
  return 8;
}

function viewportSize(): { w: number; h: number } {
  const vv = window.visualViewport;
  return {
    w: vv?.width ?? window.innerWidth,
    h: vv?.height ?? window.innerHeight,
  };
}

function clearFixedPanelStyles(panel: HTMLElement): void {
  panel.style.removeProperty('position');
  panel.style.removeProperty('top');
  panel.style.removeProperty('left');
  panel.style.removeProperty('right');
  panel.style.removeProperty('bottom');
  panel.style.removeProperty('transform');
  panel.style.removeProperty('z-index');
  panel.style.removeProperty('min-width');
  panel.style.removeProperty('inset-inline-start');
  panel.style.removeProperty('inset-inline-end');
}

/**
 * Positions the panel in viewport space so it does not affect scrollable layout ancestors.
 */
function applyFixedPanelPosition(
  panel: HTMLElement,
  trigger: HTMLElement,
  effective: PopoverPosition,
  align: PopoverAlign,
  vw: number,
  vh: number,
  gap: number,
): void {
  const tr = trigger.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  const panelW = pr.width;
  const panelH = pr.height;

  panel.style.position = 'fixed';
  panel.style.zIndex = String(FIXED_Z);
  panel.style.minWidth = `${Math.ceil(tr.width)}px`;

  if (effective === 'bottom' || effective === 'top') {
    let left = tr.left;
    if (align === 'center') {
      left = tr.left + tr.width / 2 - panelW / 2;
    } else if (align === 'end') {
      left = tr.right - panelW;
    }
    left = Math.max(PAD, Math.min(left, vw - panelW - PAD));

    if (effective === 'bottom') {
      let top = tr.bottom + gap;
      if (top + panelH > vh - PAD) {
        top = Math.max(PAD, Math.min(top, vh - panelH - PAD));
      }
      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
    } else {
      let top = tr.top - gap - panelH;
      if (top < PAD) top = PAD;
      if (top + panelH > vh - PAD) top = Math.max(PAD, vh - panelH - PAD);
      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
    }
    return;
  }

  if (effective === 'right' || effective === 'left') {
    let top = tr.top;
    if (align === 'center') {
      top = tr.top + tr.height / 2 - panelH / 2;
    } else if (align === 'end') {
      top = tr.bottom - panelH;
    }
    top = Math.max(PAD, Math.min(top, vh - panelH - PAD));

    if (effective === 'right') {
      let left = tr.right + gap;
      if (left + panelW > vw - PAD) {
        left = Math.max(PAD, vw - panelW - PAD);
      }
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    } else {
      let left = tr.left - gap - panelW;
      if (left < PAD) left = PAD;
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.transform = 'none';
  }
}

function bindMenuDropdown(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-menu-dropdown-panel]');
  const trigger =
    root.querySelector<HTMLElement>('[data-menu-dropdown-trigger]') ??
    root.querySelector<HTMLElement>('.ui-menu-dropdown__trigger-wrap > :first-child');
  if (!panel || !trigger) return;

  /** Author intent when the menu was opened (restore on close after flip). */
  let authorPosition: PopoverPosition = 'bottom';
  let authorAlign: PopoverAlign = 'start';

  let rafRef = 0;
  let whileOpenListenersBound = false;

  function isOpen(): boolean {
    return !panel.hasAttribute('hidden');
  }

  function layout(): void {
    if (!isOpen()) return;

    const { w: vw, h: vh } = viewportSize();
    const tr = trigger.getBoundingClientRect();
    const gap = getGapPx(panel);

    const spaceBelow = vh - tr.bottom - gap - PAD;
    const spaceAbove = tr.top - gap - PAD;
    const spaceRight = vw - tr.right - gap - PAD;
    const spaceLeft = tr.left - gap - PAD;

    const pref = authorPosition;
    let effective: PopoverPosition = pref;

    if (pref === 'bottom' || pref === 'top') {
      const cap = vh * MAX_VH_RATIO;
      const maxHBottom = Math.min(spaceBelow, cap);
      const maxHTop = Math.min(spaceAbove, cap);
      const minComfortH = MIN_ROWS_COMFORTABLE * EST_MENU_ROW_PX;

      if (pref === 'bottom') {
        const flipForTinyViewport =
          spaceBelow < MIN_VIEWPORT_MAX && spaceAbove > spaceBelow;
        const flipForCrampedList =
          maxHBottom < minComfortH && maxHTop > maxHBottom + EST_MENU_ROW_PX * 0.5;
        if (flipForTinyViewport || flipForCrampedList) effective = 'top';
      } else {
        const flipForTinyViewport =
          spaceAbove < MIN_VIEWPORT_MAX && spaceBelow > spaceAbove;
        const flipForCrampedList =
          maxHTop < minComfortH && maxHBottom > maxHTop + EST_MENU_ROW_PX * 0.5;
        if (flipForTinyViewport || flipForCrampedList) effective = 'bottom';
      }

      const maxH =
        effective === 'bottom' ? Math.min(spaceBelow, cap) : Math.min(spaceAbove, cap);
      panel.setAttribute('data-popover-position', effective);
      panel.style.setProperty(
        '--menu-dropdown-max-height',
        `${Math.max(MIN_VIEWPORT_MAX, Math.floor(maxH))}px`,
      );
    } else if (pref === 'left' || pref === 'right') {
      if (pref === 'right') {
        if (spaceRight < MIN_VIEWPORT_MAX && spaceLeft > spaceRight) effective = 'left';
      } else {
        if (spaceLeft < MIN_VIEWPORT_MAX && spaceRight > spaceLeft) effective = 'right';
      }
      panel.setAttribute('data-popover-position', effective);

      const align = authorAlign;
      let maxH: number;
      if (align === 'start') {
        maxH = vh - tr.top - PAD;
      } else if (align === 'end') {
        maxH = tr.bottom - PAD;
      } else {
        maxH = vh - 2 * PAD;
      }
      maxH = Math.min(maxH, vh * MAX_VH_RATIO, vh - 2 * PAD);
      panel.style.setProperty(
        '--menu-dropdown-max-height',
        `${Math.max(MIN_VIEWPORT_MAX, Math.floor(maxH))}px`,
      );
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!isOpen()) return;
        const eff = (panel.getAttribute('data-popover-position') || 'bottom') as PopoverPosition;
        const al = (panel.getAttribute('data-popover-align') || 'start') as PopoverAlign;
        const { w: vw2, h: vh2 } = viewportSize();
        applyFixedPanelPosition(panel, trigger, eff, al, vw2, vh2, gap);
      });
    });
  }

  function scheduleLayout(): void {
    if (!isOpen()) return;
    if (rafRef) cancelAnimationFrame(rafRef);
    rafRef = requestAnimationFrame(() => {
      rafRef = 0;
      layout();
    });
  }

  function bindWhileOpenListeners(): void {
    if (whileOpenListenersBound) return;
    whileOpenListenersBound = true;
    window.addEventListener('resize', scheduleLayout);
    window.visualViewport?.addEventListener('resize', scheduleLayout);
    window.visualViewport?.addEventListener('scroll', scheduleLayout);
    document.addEventListener('scroll', scheduleLayout, true);
  }

  function unbindWhileOpenListeners(): void {
    if (!whileOpenListenersBound) return;
    whileOpenListenersBound = false;
    window.removeEventListener('resize', scheduleLayout);
    window.visualViewport?.removeEventListener('resize', scheduleLayout);
    window.visualViewport?.removeEventListener('scroll', scheduleLayout);
    document.removeEventListener('scroll', scheduleLayout, true);
  }

  function setOpen(open: boolean): void {
    if (open) {
      if (activeMenuRoot && activeMenuRoot !== root) {
        closeDropdownByRoot.get(activeMenuRoot)?.();
      }

      authorPosition = (panel.getAttribute('data-popover-position') || 'bottom') as PopoverPosition;
      authorAlign = (panel.getAttribute('data-popover-align') || 'start') as PopoverAlign;

      panel.removeAttribute('hidden');
      trigger.setAttribute('aria-expanded', 'true');
      activeMenuRoot = root;
      bindWhileOpenListeners();
      requestAnimationFrame(() => {
        requestAnimationFrame(layout);
      });
    } else {
      unbindWhileOpenListeners();
      panel.setAttribute('hidden', '');
      trigger.setAttribute('aria-expanded', 'false');
      panel.setAttribute('data-popover-position', authorPosition);
      panel.setAttribute('data-popover-align', authorAlign);
      panel.style.removeProperty('--menu-dropdown-max-height');
      clearFixedPanelStyles(panel);
      if (activeMenuRoot === root) activeMenuRoot = null;
    }
  }

  closeDropdownByRoot.set(root, () => {
    if (isOpen()) setOpen(false);
  });

  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  const panelId = panel.id;
  if (panelId) trigger.setAttribute('aria-controls', panelId);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!isOpen());
  });

  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (e.target instanceof Node && root.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      trigger.focus();
    }
  });

  panel.addEventListener('click', (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.closest('button, a[href], [role="menuitem"]')) {
      setOpen(false);
    }
  });
}

/** At most one open menu at a time (avoids stacked panels / missing surface). */
let activeMenuRoot: HTMLElement | null = null;
const closeDropdownByRoot = new WeakMap<HTMLElement, () => void>();

export function initAllMenuDropdowns(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-menu-dropdown]:not([data-menu-dd-bound])').forEach((el) => {
    el.dataset.menuDdBound = 'true';
    bindMenuDropdown(el);
  });
}
