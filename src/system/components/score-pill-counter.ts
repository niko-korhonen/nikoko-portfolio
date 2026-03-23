/**
 * Client helper for ScorePillCounter: slot-style digit animation when the value changes.
 * Use with markup from ScorePillCounter.astro (root has data-ui-score-pill).
 *
 * Rapid updates: any in-flight transition is committed to its target, then the next
 * animation runs from that value—so spamming +1 never stacks competing transitions.
 */

function normalizeInt(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function updateAriaLabel(root: HTMLElement, value: number): void {
  const leading = root.querySelector('.ui-score-pill__leading')?.textContent?.trim() ?? '';
  const trailing = root.querySelector('.ui-score-pill__trailing')?.textContent?.trim() ?? '';
  const parts: string[] = [];
  if (leading) parts.push(leading);
  parts.push(String(value));
  if (trailing) parts.push(trailing);
  root.setAttribute('aria-label', parts.join(' '));
}

type Flight = {
  /** Destination of the active transition */
  to: number;
  /** Monotonic id so stale rAF / transitionend from a replaced flight are ignored */
  id: number;
  cleanup: () => void;
};

const activeFlight = new WeakMap<HTMLElement, Flight>();

let flightIdSeq = 0;

function readSettledDigit(root: HTMLElement): number {
  const digit = root.querySelector('.ui-score-pill__digit');
  if (digit?.textContent != null && digit.textContent.trim() !== '') {
    return normalizeInt(Number.parseInt(digit.textContent, 10));
  }
  return normalizeInt(Number.parseInt(root.dataset.value ?? '0', 10));
}

/** Cancel listeners/timeouts only; does not change DOM. */
function cancelFlightListeners(root: HTMLElement): void {
  const f = activeFlight.get(root);
  if (!f) return;
  f.cleanup();
  activeFlight.delete(root);
}

/**
 * If a transition is running, snap the DOM to its target and return that value.
 * Otherwise return the current digit on screen.
 */
function commitOrReadSettled(root: HTMLElement): number {
  const f = activeFlight.get(root);
  if (!f) {
    return readSettledDigit(root);
  }
  f.cleanup();
  activeFlight.delete(root);

  const track = root.querySelector('.ui-score-pill__value-track') as HTMLElement | null;
  if (!track) return readSettledDigit(root);

  track.style.transition = 'none';
  track.style.transform = '';
  track.innerHTML = `<span class="ui-score-pill__digit">${f.to}</span>`;
  void track.offsetHeight;
  return f.to;
}

function snapToValue(root: HTMLElement, next: number): void {
  cancelFlightListeners(root);
  const track = root.querySelector('.ui-score-pill__value-track') as HTMLElement | null;
  if (!track) return;
  track.style.transition = 'none';
  track.style.transform = '';
  track.innerHTML = `<span class="ui-score-pill__digit">${next}</span>`;
}

export function setScorePillValue(
  root: HTMLElement,
  nextRaw: number,
  opts?: { animate?: boolean },
): void {
  const next = normalizeInt(nextRaw);
  const track = root.querySelector('.ui-score-pill__value-track') as HTMLElement | null;
  const windowEl = root.querySelector('.ui-score-pill__value-window') as HTMLElement | null;
  if (!track || !windowEl) return;

  if (opts?.animate === false) {
    root.dataset.value = String(next);
    updateAriaLabel(root, next);
    snapToValue(root, next);
    return;
  }

  const from = commitOrReadSettled(root);

  root.dataset.value = String(next);
  updateAriaLabel(root, next);
  if (from === next) {
    track.style.transition = 'none';
    track.style.transform = '';
    track.innerHTML = `<span class="ui-score-pill__digit">${next}</span>`;
    return;
  }

  track.style.transition = 'none';
  track.style.transform = '';
  void track.offsetHeight;

  const flightId = ++flightIdSeq;

  let oldDigit = track.querySelector('.ui-score-pill__digit') as HTMLElement | null;
  if (!oldDigit) {
    oldDigit = document.createElement('span');
    oldDigit.className = 'ui-score-pill__digit';
    track.appendChild(oldDigit);
  }
  oldDigit.textContent = String(from);

  const newDigit = document.createElement('span');
  newDigit.className = 'ui-score-pill__digit';
  newDigit.textContent = String(next);
  track.appendChild(newDigit);

  const h = oldDigit.offsetHeight;
  if (h <= 0) {
    snapToValue(root, next);
    return;
  }

  track.style.transition = 'none';
  track.style.transform = 'translateY(0)';
  void track.offsetHeight;

  let finished = false;
  let fallbackTimer = 0;

  const isCurrentFlight = () => activeFlight.get(root)?.id === flightId;

  const done = () => {
    if (finished) return;
    if (!isCurrentFlight()) return;
    finished = true;
    track.removeEventListener('transitionend', onEnd);
    window.clearTimeout(fallbackTimer);
    activeFlight.delete(root);
    track.innerHTML = `<span class="ui-score-pill__digit">${next}</span>`;
    track.style.transform = '';
    track.style.transition = '';
  };

  const onEnd = (e: TransitionEvent) => {
    if (e.target !== track || e.propertyName !== 'transform') return;
    if (!isCurrentFlight()) return;
    done();
  };

  const cleanup = () => {
    track.removeEventListener('transitionend', onEnd);
    window.clearTimeout(fallbackTimer);
  };

  activeFlight.set(root, { to: next, id: flightId, cleanup });

  track.style.transition = 'transform 0.38s cubic-bezier(0.33, 1, 0.68, 1)';
  requestAnimationFrame(() => {
    if (!isCurrentFlight()) return;
    track.style.transform = `translateY(-${h}px)`;
  });

  track.addEventListener('transitionend', onEnd);
  fallbackTimer = window.setTimeout(done, 500);
}
