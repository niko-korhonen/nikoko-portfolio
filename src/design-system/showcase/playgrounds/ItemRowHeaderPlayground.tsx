import { useState } from 'preact/hooks';
import { ShowcasePlayground, ShowcaseControlRow } from './ShowcasePlayground';
import { ShowcaseTextField } from './ShowcaseTextField';

export function ItemRowHeaderPlayground() {
  const [text, setText] = useState('Section title');

  const preview = (
    <div class="ds-item-row-header ds-type-body-l-short" style={{ maxWidth: '24rem' }}>
      {text}
    </div>
  );

  return (
    <ShowcasePlayground preview={preview}>
      <ShowcaseControlRow
        name="Text"
        control={<ShowcaseTextField value={text} onChange={setText} placeholder="Section title" />}
      />
    </ShowcasePlayground>
  );
}
