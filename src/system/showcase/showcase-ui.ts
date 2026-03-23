/** Shared helpers for interactive showcase sections. */

/**
 * `define:vars` + `import` in the same Astro `<script>` breaks the build output (classic script with
 * imports). Pass server data via a preceding `is:inline` script and read it here once.
 */
export function takeInjectedIconHtmlMap(key: string): Record<string, string> {
  const w = globalThis as unknown as Record<string, Record<string, string> | undefined>;
  const m = w[key];
  if (m) delete w[key];
  return m ?? {};
}

export function bindFieldClear(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLButtonElement>('.js-ds-field-clear').forEach((btn) => {
    if (btn.dataset.dsClearBound === 'true') return;
    btn.dataset.dsClearBound = 'true';
    btn.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.dsClear;
        if (!id) return;
        const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
        if (!el) return;
        /** Reset to the field’s initial value from markup (showcase default), not an empty override. */
        el.value = el.defaultValue;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
      true,
    );
  });
}

/**
 * Scope for preview + controls table (picker buttons live outside preview root).
 * Pass a node inside the page (e.g. `[data-ds-demo]`) so scope resolves via `closest`
 * — more reliable than `document.querySelector` alone when the DOM is unusual.
 */
export function getShowcasePage(demoRoot?: Element | null): HTMLElement | null {
  if (demoRoot) {
    const fromClosest = demoRoot.closest('.ds-showcase-page');
    if (fromClosest instanceof HTMLElement) return fromClosest;
  }
  const fromDoc = document.querySelector('.ds-showcase-page');
  return fromDoc instanceof HTMLElement ? fromDoc : null;
}
