import type { ComponentChildren } from 'preact';

export function ShowcasePlayground(props: {
  preview: ComponentChildren;
  /** Control table rows; omit for preview-only demos. */
  children?: ComponentChildren;
}) {
  return (
    <div class="ds-showcase-playground">
      <div class="ds-showcase-playground__preview">{props.preview}</div>
      {props.children != null && props.children !== false ? (
        <table class="ds-showcase-controls">
          <thead>
            <tr>
              <th
                class="ds-showcase-controls__head-name ds-type-code-m-tall"
                style={{ color: 'var(--foreground-secondary)' }}
              >
                Name
              </th>
              <th
                class="ds-showcase-controls__head-control ds-type-code-m-tall"
                style={{ color: 'var(--foreground-secondary)', textAlign: 'end' }}
              >
                Control
              </th>
            </tr>
          </thead>
          <tbody>{props.children}</tbody>
        </table>
      ) : null}
    </div>
  );
}

export function ShowcaseControlRow(props: { name: string; control: ComponentChildren }) {
  return (
    <tr class="ds-showcase-controls__row">
      <td class="ds-showcase-controls__name ds-type-code-m-tall" style={{ color: 'var(--foreground-secondary)' }}>
        {props.name}
      </td>
      <td class="ds-showcase-controls__control">{props.control}</td>
    </tr>
  );
}
