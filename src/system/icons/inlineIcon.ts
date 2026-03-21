/**
 * Prepares raw SVG markup for inline use so `color` / semantic tokens apply.
 * Replaces hardcoded black strokes/fills with currentColor (assets may still use #000).
 */
export function sanitizeSvg(svg: string): string {
  let s = svg;
  s = s.replace(/stroke="#000000"/gi, 'stroke="currentColor"');
  s = s.replace(/stroke="#000"/gi, 'stroke="currentColor"');
  s = s.replace(/stroke="black"/gi, 'stroke="currentColor"');
  s = s.replace(/stroke='(#000000|#000|black)'/gi, "stroke='currentColor'");
  s = s.replace(/fill="#000000"/gi, 'fill="currentColor"');
  s = s.replace(/fill="#000"/gi, 'fill="currentColor"');
  s = s.replace(/fill="black"/gi, 'fill="currentColor"');
  s = s.replace(/fill='(#000000|#000|black)'/gi, "fill='currentColor'");
  return s;
}

/** Strip root width/height so CSS controls size; tag SVG for layout CSS. */
export function prepareInlineIcon(svg: string): string {
  const cleaned = sanitizeSvg(svg);
  return cleaned.replace(/<svg(\s[^>]*)>/i, (_, attrs: string) => {
    const withoutDims = attrs
      .replace(/\s+width="[^"]*"/gi, '')
      .replace(/\s+height="[^"]*"/gi, '');
    return `<svg${withoutDims} class="ui-icon__svg" focusable="false" aria-hidden="true">`;
  });
}
