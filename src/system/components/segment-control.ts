/**
 * Segment control: sliding indicator, radiogroup / tablist semantics, keyboard nav.
 */

const ROOT = '[data-ui-segment]';
const TRACK = '.ui-segment__track';
const CELLS = '.ui-segment__cell';
const INDICATOR = '.ui-segment__indicator';
const FIELD = '.ui-segment__field';

function getSemantic(root: HTMLElement): 'radiogroup' | 'tablist' {
  return root.dataset.uiSemantic === 'tablist' ? 'tablist' : 'radiogroup';
}

function getCells(root: HTMLElement): HTMLButtonElement[] {
  return Array.from(root.querySelectorAll<HTMLButtonElement>(CELLS));
}

function findSelectedIndex(cells: HTMLButtonElement[]): number {
  const i = cells.findIndex((c) => c.dataset.selected === 'true');
  if (i >= 0) return i;
  const firstEnabled = cells.findIndex((c) => !c.disabled);
  return firstEnabled >= 0 ? firstEnabled : 0;
}

function firstEnabledIndex(cells: HTMLButtonElement[]): number {
  const i = cells.findIndex((c) => !c.disabled);
  return i >= 0 ? i : 0;
}

function lastEnabledIndex(cells: HTMLButtonElement[]): number {
  for (let i = cells.length - 1; i >= 0; i--) {
    if (!cells[i].disabled) return i;
  }
  return 0;
}

function setAriaState(
  root: HTMLElement,
  cells: HTMLButtonElement[],
  selectedIndex: number,
  semantic: 'radiogroup' | 'tablist',
  dispatchChange: boolean,
) {
  cells.forEach((cell, i) => {
    const selected = i === selectedIndex;
    cell.dataset.selected = selected ? 'true' : 'false';
    if (semantic === 'tablist') {
      cell.setAttribute('aria-selected', selected ? 'true' : 'false');
      cell.removeAttribute('aria-checked');
    } else {
      cell.setAttribute('aria-checked', selected ? 'true' : 'false');
      cell.removeAttribute('aria-selected');
    }
    cell.tabIndex = selected ? 0 : -1;
  });

  const field = root.querySelector<HTMLInputElement>(FIELD);
  if (field && cells[selectedIndex]) {
    field.value = cells[selectedIndex].dataset.value ?? '';
  }

  if (dispatchChange) {
    root.dispatchEvent(
      new CustomEvent('segment-change', {
        bubbles: true,
        detail: { value: cells[selectedIndex]?.dataset.value ?? '' },
      }),
    );
  }
}

const THEME_STORAGE_KEY = 'niko-ui-theme';

function layoutIndicator(
  root: HTMLElement,
  cells: HTMLButtonElement[],
  selectedIndex: number,
  animate: boolean,
) {
  const track = root.querySelector<HTMLElement>(TRACK);
  const indicator = root.querySelector<HTMLElement>(INDICATOR);
  const cell = cells[selectedIndex];
  if (!track || !indicator || !cell || cell.disabled) return;

  if (!animate) {
    indicator.style.transition = 'none';
  }

  const tr = track.getBoundingClientRect();
  const cr = cell.getBoundingClientRect();
  /* Integer px avoids subpixel gaps next to the track edge (border was removed; rounding still helps). */
  const left = Math.round(cr.left - tr.left);
  const top = Math.round(cr.top - tr.top);
  const width = Math.round(cr.width);
  const height = Math.round(cr.height);

  indicator.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  indicator.style.width = `${width}px`;
  indicator.style.height = `${height}px`;

  if (!animate) {
    requestAnimationFrame(() => {
      indicator.style.transition = '';
    });
  }
}

function nextEnabledIndex(cells: HTMLButtonElement[], from: number, delta: number): number {
  const len = cells.length;
  let i = from;
  let guard = 0;
  while (guard <= len) {
    i = (i + delta + len) % len;
    if (!cells[i]?.disabled) return i;
    guard += 1;
  }
  return from;
}

function bindRoot(root: HTMLElement) {
  if (root.dataset.uiSegmentBound === 'true') return;
  root.dataset.uiSegmentBound = 'true';

  const track = root.querySelector<HTMLElement>(TRACK);
  const cells = getCells(root);
  if (!track || cells.length === 0) return;

  let selectedIndex = findSelectedIndex(cells);

  if (root.classList.contains('js-theme-segment')) {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        const idx = cells.findIndex((c) => c.dataset.value === saved);
        if (idx >= 0) selectedIndex = idx;
      }
    } catch {
      /* ignore */
    }
  }

  const apply = (index: number, focus: boolean, animateLayout = true) => {
    const semantic = getSemantic(root);
    let i = index;
    if (cells[i]?.disabled) {
      i = nextEnabledIndex(cells, i, 1);
    }
    selectedIndex = i;
    setAriaState(root, cells, selectedIndex, semantic, true);
    layoutIndicator(root, cells, selectedIndex, animateLayout);
    if (focus) {
      cells[selectedIndex]?.focus();
    }
  };

  cells.forEach((cell, index) => {
    cell.addEventListener('click', () => {
      if (cell.disabled) return;
      apply(index, true, true);
    });
  });

  root.addEventListener('keydown', (e) => {
    if (!(e instanceof KeyboardEvent)) return;

    const semantic = getSemantic(root);
    const horizontalKeys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
    const verticalKeys = ['ArrowUp', 'ArrowDown'];
    const keys =
      semantic === 'tablist'
        ? [...horizontalKeys, ...verticalKeys]
        : [...horizontalKeys, ...verticalKeys];

    if (!keys.includes(e.key)) return;

    const current = cells.findIndex((c) => c === document.activeElement);
    if (current < 0) return;

    const isRtl = getComputedStyle(root).direction === 'rtl';
    const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
    const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';

    let handled = false;
    if (e.key === prevKey || e.key === 'ArrowUp') {
      apply(nextEnabledIndex(cells, current, -1), true, true);
      handled = true;
    } else if (e.key === nextKey || e.key === 'ArrowDown') {
      apply(nextEnabledIndex(cells, current, 1), true, true);
      handled = true;
    } else if (e.key === 'Home') {
      apply(firstEnabledIndex(cells), true, true);
      handled = true;
    } else if (e.key === 'End') {
      apply(lastEnabledIndex(cells), true, true);
      handled = true;
    }

    if (handled) {
      e.preventDefault();
    }
  });

  const ro = new ResizeObserver(() => {
    layoutIndicator(root, cells, selectedIndex, false);
  });
  ro.observe(track);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      apply(selectedIndex, false, false);
    });
  });
}

export function initSegmentControls(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>(ROOT).forEach(bindRoot);
}

if (typeof document !== 'undefined') {
  initSegmentControls(document);
}
