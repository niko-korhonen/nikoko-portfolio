/**
 * Ensures only one MenuDropdown is open and coordinates outside / Escape dismissal
 * across all Preact islands (single document listener, shared registry).
 */

type Instance = {
  getRoot: () => HTMLElement | null;
  close: () => void;
};

const registry = new Map<string, Instance>();

let globalsAttached = false;

function closeAllExcept(keepId: string | null) {
  for (const [id, inst] of registry) {
    if (keepId !== null && id === keepId) continue;
    inst.close();
  }
}

function findContainingId(target: Node): string | null {
  for (const [id, inst] of registry) {
    const root = inst.getRoot();
    if (root && root.contains(target)) return id;
  }
  return null;
}

function onDocumentClick(e: MouseEvent) {
  const t = e.target;
  if (!t || !(t instanceof Node)) return;

  const inside = findContainingId(t);
  if (inside !== null) {
    closeAllExcept(inside);
  } else {
    closeAllExcept(null);
  }
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return;
  closeAllExcept(null);
}

function ensureGlobalListeners() {
  if (typeof document === 'undefined' || globalsAttached) return;
  globalsAttached = true;
  // Capture: run before Preact’s delegated handlers so others close before toggle opens.
  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('keydown', onDocumentKeydown, false);
}

export function registerMenuDropdown(id: string, inst: Instance): () => void {
  ensureGlobalListeners();
  registry.set(id, inst);
  return () => {
    registry.delete(id);
  };
}

/** Synchronously close every other instance before opening `keepId`. */
export function closeOtherMenuDropdowns(keepId: string) {
  closeAllExcept(keepId);
}
