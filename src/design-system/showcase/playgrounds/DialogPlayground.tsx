import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Dialog } from '../../components/ui/Dialog';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseToggle } from './ShowcaseToggle';
import { ShowcaseSelect } from './ShowcaseSelect';

type FooterChoice = 'none' | 'single' | 'two' | 'three';
type ContentChoice = 'short' | 'medium' | 'long';

const footerOpts = [
  { id: 'none', label: 'None' },
  { id: 'single', label: 'Single button' },
  { id: 'two', label: 'Two buttons' },
  { id: 'three', label: 'Three buttons' },
];

const contentOpts = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long (scrolls)' },
];

function ShortContent() {
  return (
    <p
      class="ds-type-body-l-tall"
      style={{ color: 'var(--foreground-primary)', margin: 0 }}
    >
      Are you sure you want to continue? This action cannot be undone.
    </p>
  );
}

function MediumContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
      <p class="ds-type-body-l-tall" style={{ color: 'var(--foreground-primary)', margin: 0 }}>
        The dialog imposes no headline, icon, or hero. Drop in any content.
      </p>
      <p class="ds-type-body-m-tall" style={{ color: 'var(--foreground-secondary)', margin: 0 }}>
        Spacing and overflow are the only opinions: the content region scrolls when needed and the
        footer stays anchored to the bottom of the panel.
      </p>
    </div>
  );
}

function LongContent() {
  const paragraphs = Array.from({ length: 14 }, (_, i) => i + 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-12)' }}>
      <p class="ds-type-body-l-tall" style={{ color: 'var(--foreground-primary)', margin: 0 }}>
        This dialog is intentionally tall to demonstrate the scrollable content region.
      </p>
      {paragraphs.map((n) => (
        <p
          key={n}
          class="ds-type-body-m-tall"
          style={{ color: 'var(--foreground-secondary)', margin: 0 }}
        >
          {`Paragraph ${n}: lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
          tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
          exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`}
        </p>
      ))}
    </div>
  );
}

export function DialogPlayground() {
  const [open, setOpen] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [showClose, setShowClose] = useState(true);
  const [dismissOnBackdrop, setDismissOnBackdrop] = useState(true);
  const [dismissOnEscape, setDismissOnEscape] = useState(true);
  const [footerChoice, setFooterChoice] = useState<FooterChoice>('two');
  const [contentChoice, setContentChoice] = useState<ContentChoice>('medium');

  const close = () => setOpen(false);

  let footer: ComponentChildren | undefined;
  if (footerChoice === 'single') {
    footer = (
      <button type="button" class="ds-btn ds-btn--fill ds-btn--m" onClick={close}>
        <span class="ds-btn__label">Done</span>
      </button>
    );
  } else if (footerChoice === 'two') {
    footer = (
      <>
        <button type="button" class="ds-btn ds-btn--subtle ds-btn--m" onClick={close}>
          <span class="ds-btn__label">Cancel</span>
        </button>
        <button type="button" class="ds-btn ds-btn--fill ds-btn--m" onClick={close}>
          <span class="ds-btn__label">Confirm</span>
        </button>
      </>
    );
  } else if (footerChoice === 'three') {
    footer = (
      <>
        <button type="button" class="ds-btn ds-btn--ghost ds-btn--m" onClick={close}>
          <span class="ds-btn__label">Help</span>
        </button>
        <button type="button" class="ds-btn ds-btn--subtle ds-btn--m" onClick={close}>
          <span class="ds-btn__label">Cancel</span>
        </button>
        <button type="button" class="ds-btn ds-btn--fill ds-btn--m" onClick={close}>
          <span class="ds-btn__label">Save</span>
        </button>
      </>
    );
  }

  const content =
    contentChoice === 'short' ? (
      <ShortContent />
    ) : contentChoice === 'long' ? (
      <LongContent />
    ) : (
      <MediumContent />
    );

  const preview = (
    <>
      <button
        type="button"
        class="ds-btn ds-btn--fill ds-btn--m"
        onClick={() => setOpen(true)}
      >
        <span class="ds-btn__label">Open dialog</span>
      </button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        showBack={showBack}
        showClose={showClose}
        dismissOnBackdrop={dismissOnBackdrop}
        dismissOnEscape={dismissOnEscape}
        aria-label="Demo dialog"
        footer={footer}
      >
        {content}
      </Dialog>
    </>
  );

  return (
    <ShowcasePlayground preview={preview}>
      <ShowcaseControlRow
        name="Open"
        control={
          <ShowcaseToggle
            aria-label="Open"
            checked={open}
            onChange={setOpen}
          />
        }
      />
      <ShowcaseControlRow
        name="Show back"
        control={
          <ShowcaseToggle
            aria-label="Show back"
            checked={showBack}
            onChange={setShowBack}
          />
        }
      />
      <ShowcaseControlRow
        name="Show close"
        control={
          <ShowcaseToggle
            aria-label="Show close"
            checked={showClose}
            onChange={setShowClose}
          />
        }
      />
      <ShowcaseControlRow
        name="Dismiss on backdrop"
        control={
          <ShowcaseToggle
            aria-label="Dismiss on backdrop"
            checked={dismissOnBackdrop}
            onChange={setDismissOnBackdrop}
          />
        }
      />
      <ShowcaseControlRow
        name="Dismiss on escape"
        control={
          <ShowcaseToggle
            aria-label="Dismiss on escape"
            checked={dismissOnEscape}
            onChange={setDismissOnEscape}
          />
        }
      />
      <ShowcaseControlRow
        name="Footer"
        control={
          <ShowcaseSelect
            aria-label="Footer"
            value={footerChoice}
            options={footerOpts}
            onChange={(id) => setFooterChoice(id as FooterChoice)}
          />
        }
      />
      <ShowcaseControlRow
        name="Content length"
        control={
          <ShowcaseSelect
            aria-label="Content length"
            value={contentChoice}
            options={contentOpts}
            onChange={(id) => setContentChoice(id as ContentChoice)}
          />
        }
      />
    </ShowcasePlayground>
  );
}
