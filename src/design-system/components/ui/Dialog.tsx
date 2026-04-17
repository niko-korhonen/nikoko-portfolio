import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { DsIcon } from './DsIcon';

export interface DialogProps {
  /** Controlled open state. */
  open: boolean;
  /** Called when the dialog requests dismissal (close button, escape, backdrop). */
  onOpenChange?: (open: boolean) => void;
  /** Show the leading back action in the top bar. */
  showBack?: boolean;
  /** Show the trailing close action in the top bar. */
  showClose?: boolean;
  /** Optional explicit back handler; falls back to onOpenChange(false) if absent. */
  onBack?: () => void;
  /** Close the dialog when the backdrop is clicked. */
  dismissOnBackdrop?: boolean;
  /** Close the dialog when Escape is pressed. */
  dismissOnEscape?: boolean;
  /** Accessible label when content has no headline element to reference. */
  'aria-label'?: string;
  /** Id of an element that labels the dialog. */
  'aria-labelledby'?: string;
  /** Id of an element that describes the dialog. */
  'aria-describedby'?: string;
  /** DOM id on the dialog root. */
  id?: string;
  /** Footer slot — full-width region with 8px gap; intended for action buttons. Omit for no footer. */
  footer?: ComponentChildren;
  /** Content slot — arbitrary children rendered inside the scrollable content region. */
  children?: ComponentChildren;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('inert') && el.offsetParent !== null,
  );
}

export function Dialog(props: DialogProps) {
  const {
    open,
    onOpenChange,
    showBack = false,
    showClose = true,
    onBack,
    dismissOnBackdrop = true,
    dismissOnEscape = true,
    footer,
    children,
    id,
  } = props;

  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const requestClose = () => onOpenChange?.(false);

  // Lock body scroll while open; restore previous overflow when closed.
  useLayoutEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Save the focused element on open; move focus into the panel; restore on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) {
      const first = getFocusable(panel)[0];
      (first ?? panel).focus();
    }
    return () => {
      const target = previouslyFocused.current;
      if (target && typeof target.focus === 'function') target.focus();
    };
  }, [open]);

  // Escape + focus trap.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissOnEscape) {
        // Defer to nested menus that handle their own Escape (close menu first).
        if (document.querySelector('.ds-menu-dropdown[data-open="true"]')) return;
        e.stopPropagation();
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key === 'Tab') {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = getFocusable(panel);
        if (focusables.length === 0) {
          e.preventDefault();
          panel.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        const inside = active ? panel.contains(active) : false;
        if (e.shiftKey) {
          if (!inside || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (!inside || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, dismissOnEscape]);

  return (
    <div
      class="ds-dialog"
      id={id}
      data-open={open ? 'true' : 'false'}
      aria-hidden={open ? undefined : 'true'}
    >
      <button
        type="button"
        class="ds-dialog__backdrop"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={() => {
          if (dismissOnBackdrop) requestClose();
        }}
      />
      <div
        ref={panelRef}
        class="ds-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
        tabIndex={-1}
      >
        {(showBack || showClose) && (
          <div class="ds-dialog__topbar">
            <div class="ds-dialog__topbar-leading">
              {showBack && (
                <button
                  type="button"
                  class="ds-btn-icon ds-btn-icon--ghost ds-btn-icon--m"
                  aria-label="Back"
                  onClick={() => (onBack ? onBack() : requestClose())}
                >
                  <DsIcon name="arrow-left-outlined" size="l" />
                </button>
              )}
            </div>
            <div class="ds-dialog__topbar-trailing">
              {showClose && (
                <button
                  type="button"
                  class="ds-btn-icon ds-btn-icon--ghost ds-btn-icon--m"
                  aria-label="Close"
                  onClick={requestClose}
                >
                  <DsIcon name="cross-large-outlined" size="l" />
                </button>
              )}
            </div>
          </div>
        )}
        <div class="ds-dialog__content">{children}</div>
        {footer != null && footer !== false ? (
          <div class="ds-dialog__footer">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
