import fs from 'node:fs';
import path from 'node:path';
import { loadAllIconEntries } from './data';
import { prepareInlineIcon } from '../icons/inlineIcon';

/** Every `icon-{name}-{outline|fill}.svg` variant, keyed `{name}-{style}` (e.g. `placeholder-outline`). */
export function loadAllIconVariantInlineMap(): Record<string, string> {
  const entries = loadAllIconEntries();
  const out: Record<string, string> = {};
  for (const e of entries) {
    const key = `${e.name}-${e.style}`;
    const filePath = path.join(process.cwd(), 'public/icons', `icon-${e.name}-${e.style}.svg`);
    if (fs.existsSync(filePath)) {
      out[key] = prepareInlineIcon(fs.readFileSync(filePath, 'utf8'));
    }
  }
  return out;
}

export type IconVariantMenuEntry = {
  key: string;
  fileName: string;
  /** Same as file name without `.svg` (e.g. icon-placeholder-outline). */
  menuLabel: string;
  name: string;
  style: 'outline' | 'fill';
};

/** Sorted menu rows for full variant pickers (fileName includes icon- prefix and .svg). */
export function getAllIconVariantMenuEntries(): IconVariantMenuEntry[] {
  const entries = loadAllIconEntries();
  return entries
    .map((e) => {
      const fileName = `icon-${e.name}-${e.style}.svg`;
      return {
        key: `${e.name}-${e.style}`,
        fileName,
        menuLabel: fileName.replace(/\.svg$/i, ''),
        name: e.name,
        style: e.style,
      };
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName));
}
