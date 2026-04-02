import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import {
  closeOtherMenuDropdowns,
  registerMenuDropdown,
} from '../../lib/menu-dropdown-registry';

export type MenuPlacement = 'top' | 'bottom' | 'left' | 'right';
export type MenuAlign = 'start' | 'center' | 'end';

export interface MenuItem {
  id: string;
  label: string;
}

const GAP = 8;

function nextMenuId() {
  return `ds-md-${Math.random().toString(36).slice(2, 11)}`;
}

export interface MenuDropdownProps {
  /** Visual trigger (icon, text); must not be a nested interactive element. */
  trigger: ComponentChildren;
  triggerClass?: string;
  /** When true, the trigger is inert and the menu cannot open. */
  disabled?: boolean;
  items: MenuItem[];
  placement?: MenuPlacement;
  align?: MenuAlign;
  onSelect?: (id: string) => void;
  'aria-label': string;
}

export function MenuDropdown(props: MenuDropdownProps) {
  const {
    trigger,
    triggerClass = 'ds-btn-icon ds-btn-icon--ghost ds-btn-icon--m',
    disabled = false,
    items,
    placement = 'bottom',
    align = 'start',
    onSelect,
    'aria-label': ariaLabel,
  } = props;

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const idRef = useRef<string | null>(null);
  if (!idRef.current) idRef.current = nextMenuId();
  const myId = idRef.current;

  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;

  useEffect(() => {
    return registerMenuDropdown(myId, {
      getRoot: () => wrapRef.current,
      close: () => setOpenRef.current(false),
    });
  }, [myId]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    // Opening sets inline display/visibility/position; those beat attribute CSS.
    // Clear them when closed or panels stay visible and steal clicks from the page.
    if (!open) {
      menu.style.removeProperty('display');
      menu.style.removeProperty('visibility');
      menu.style.removeProperty('top');
      menu.style.removeProperty('left');
      menu.style.removeProperty('max-height');
      return;
    }

    const tr = triggerRef.current?.getBoundingClientRect();
    if (!tr) return;

    const pad = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    menu.style.visibility = 'hidden';
    menu.style.display = 'block';
    const mr = menu.getBoundingClientRect();
    let top = 0;
    let left = 0;

    if (placement === 'bottom' || placement === 'top') {
      if (placement === 'bottom') top = tr.bottom + GAP;
      else top = tr.top - GAP - mr.height;

      if (align === 'start') left = tr.left;
      else if (align === 'end') left = tr.right - mr.width;
      else left = tr.left + (tr.width - mr.width) / 2;

      if (left + mr.width > vw - pad) left = vw - pad - mr.width;
      if (left < pad) left = pad;

      if (top + mr.height > vh - pad) {
        top = Math.max(pad, tr.top - GAP - mr.height);
      }
      if (top < pad) top = pad;

      const maxH = vh - top - pad;
      menu.style.maxHeight = `${Math.max(120, maxH)}px`;
    } else {
      if (placement === 'right') left = tr.right + GAP;
      else left = tr.left - GAP - mr.width;

      if (align === 'start') top = tr.top;
      else if (align === 'end') top = tr.bottom - mr.height;
      else top = tr.top + (tr.height - mr.height) / 2;

      if (left + mr.width > vw - pad) left = tr.left - GAP - mr.width;
      if (left < pad) left = pad;
      if (top + mr.height > vh - pad) top = vh - pad - mr.height;
      if (top < pad) top = pad;

      const maxH = vh - top - pad;
      menu.style.maxHeight = `${Math.max(120, maxH)}px`;
    }

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.visibility = 'visible';
  }, [open, placement, align, items.length]);

  function toggle() {
    if (disabled) return;
    setOpen((prev) => {
      if (prev) return false;
      closeOtherMenuDropdowns(myId);
      return true;
    });
  }

  return (
    <div
      ref={wrapRef}
      class="ds-menu-dropdown-root"
      data-open={open ? 'true' : 'false'}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      <div
        ref={triggerRef}
        onClick={() => toggle()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="menu"
        aria-expanded={disabled ? false : open}
        aria-disabled={disabled ? true : undefined}
        aria-label={ariaLabel}
        class={[
          triggerClass,
          disabled ? 'ds-menu-dropdown-trigger--disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {trigger}
      </div>
      <ul
        ref={menuRef}
        class="ds-menu-dropdown"
        role="menu"
        data-open={open ? 'true' : 'false'}
        style={{ overflowY: 'auto' }}
      >
        {items.map((item) => (
          <li key={item.id} role="none" class="ds-menu-dropdown__option">
            <button
              type="button"
              role="menuitem"
              class="ds-item-row ds-item-row--ghost"
              onClick={() => {
                onSelect?.(item.id);
                setOpen(false);
              }}
            >
              <span class="ds-item-row__inner">
                <span class="ds-item-row__main">
                  <span
                    class="ds-type-label-l-short"
                    style={{ color: 'var(--foreground-primary)' }}
                  >
                    {item.label}
                  </span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
