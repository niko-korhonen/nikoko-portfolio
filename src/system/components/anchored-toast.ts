/**
 * Anchored toast queue: max visible items, pending queue when full, exit animations
 * before removal. Handles rapid clicks without stacking duplicate dismissals on the
 * same node (dismisses first toast that is not already exiting).
 */

export type AnchoredToastVariant = 'success' | 'error' | 'info' | 'neutral';

interface ToastState {
  el: HTMLElement;
  timer: ReturnType<typeof setTimeout>;
}

function parseVariant(raw: string | undefined): AnchoredToastVariant {
  if (raw === 'success' || raw === 'error' || raw === 'info' || raw === 'neutral') return raw;
  return 'neutral';
}

export function initAnchoredToasts(scope: ParentNode = document) {
  scope.querySelectorAll<HTMLElement>('[data-anchored-toast]:not([data-anchored-toast-ready])').forEach((root) => {
    root.dataset.anchoredToastReady = 'true';
    initRoot(root);
  });
}

function initRoot(root: HTMLElement) {
  const max = Math.min(10, Math.max(1, Number(root.dataset.anchoredToastMax) || 4));
  const dwell = Math.max(400, Number(root.dataset.anchoredToastDwell) || 2800);
  const stack = root.querySelector<HTMLElement>('[data-anchored-toast-stack]');
  const trigger = root.querySelector<HTMLElement>('[data-anchored-toast-trigger]');
  if (!stack || !trigger) return;

  const pending: { variant: AnchoredToastVariant; message: string }[] = [];
  const active: ToastState[] = [];

  const exitClass = 'ui-anchored-toast__item--exit';

  function getIconFragment(variant: AnchoredToastVariant): DocumentFragment | null {
    if (variant === 'neutral') return null;
    const tpl = root.querySelector<HTMLTemplateElement>(`template[data-anchored-toast-icon="${variant}"]`);
    if (!tpl) return null;
    return tpl.content.cloneNode(true) as DocumentFragment;
  }

  function createToastElement(variant: AnchoredToastVariant, message: string): HTMLElement {
    const item = document.createElement('div');
    item.className = `ui-anchored-toast__item ui-anchored-toast__item--${variant}`;
    item.setAttribute('role', variant === 'error' ? 'alert' : 'status');
    item.setAttribute('data-variant', variant);

    const inner = document.createElement('div');
    inner.className = 'ui-anchored-toast__inner text-label-xs-plain';

    const iconFrag = getIconFragment(variant);
    if (iconFrag) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'ui-anchored-toast__icon';
      iconSpan.appendChild(iconFrag);
      inner.appendChild(iconSpan);
    }

    const label = document.createElement('span');
    label.className = 'ui-anchored-toast__label';
    label.textContent = message;
    inner.appendChild(label);

    item.appendChild(inner);
    return item;
  }

  function drainPending() {
    while (pending.length > 0 && active.length < max) {
      const next = pending.shift()!;
      mountToast(next.variant, next.message);
    }
  }

  function mountToast(variant: AnchoredToastVariant, message: string) {
    const el = createToastElement(variant, message);
    stack.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.add('ui-anchored-toast__item--shown');
    });

    const timer = setTimeout(() => {
      dismissToast(el);
    }, dwell);

    active.push({ el, timer });
  }

  function dismissToast(el: HTMLElement) {
    if (el.classList.contains(exitClass)) return;

    const idx = active.findIndex((t) => t.el === el);
    if (idx === -1) return;
    clearTimeout(active[idx].timer);

    el.classList.add(exitClass);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(fallback);
      el.removeEventListener('animationend', onEnd);
      const i2 = active.findIndex((t) => t.el === el);
      if (i2 !== -1) active.splice(i2, 1);
      el.remove();
      drainPending();
    };
    /** Exit animation runs on `.ui-anchored-toast__inner`; ignore enter keyframes. */
    const onEnd = (e: AnimationEvent) => {
      if (!el.contains(e.target as Node)) return;
      if (e.animationName !== 'anchored-toast-exit') return;
      finish();
    };
    el.addEventListener('animationend', onEnd);
    const fallback = setTimeout(finish, 450);
  }

  function dismissOldestNonExiting() {
    const t = active.find((s) => !s.el.classList.contains(exitClass));
    if (!t) return;
    dismissToast(t.el);
  }

  function enqueue(variant: AnchoredToastVariant, message: string) {
    if (active.length < max) {
      mountToast(variant, message);
      return;
    }
    pending.push({ variant, message });
    dismissOldestNonExiting();
  }

  trigger.addEventListener('click', () => {
    const variant = parseVariant(trigger.dataset.anchoredToastVariant);
    const message = trigger.dataset.anchoredToastMessage?.trim() || 'Label';
    enqueue(variant, message);
  });
}
