/**
 * Native <dialog> behavior: backdrop click + Escape respect dismissible;
 * [data-modal-dialog-close] always closes (explicit actions / toolbar).
 */
export function initModalDialogs(): void {
  for (const el of document.querySelectorAll<HTMLDialogElement>('dialog[data-modal-dialog]')) {
    if (el.hasAttribute('data-modal-dialog-init')) continue;
    el.setAttribute('data-modal-dialog-init', '');
    initModalDialog(el);
  }
}

function initModalDialog(dialog: HTMLDialogElement): void {
  const dismissible = dialog.getAttribute('data-dismissible') !== 'false';

  dialog.addEventListener('cancel', (e) => {
    if (!dismissible) e.preventDefault();
  });

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog && dismissible) dialog.close();
  });

  dialog.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target.closest('[data-modal-dialog-close]') : null;
    if (t && dialog.contains(t)) dialog.close();
  });
}
