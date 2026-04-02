import { ShowcasePlayground } from './ShowcasePlayground';

export function ItemRowDividerPlayground() {
  const preview = (
    <div style={{ width: '100%', maxWidth: '24rem' }}>
      <p class="ds-type-code-m-tall" style={{ margin: 0, color: 'var(--foreground-secondary)' }}>
        Content above
      </p>
      <div class="ds-item-row-divider" role="separator" aria-hidden="true"></div>
      <p class="ds-type-code-m-tall" style={{ margin: 0, color: 'var(--foreground-secondary)' }}>
        Content below
      </p>
    </div>
  );

  return <ShowcasePlayground preview={preview} />;
}
