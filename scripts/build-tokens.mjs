/**
 * Flattens Figma Variables JSON into CSS custom properties.
 *
 * Light/dark: Semantic colors resolve through Theme (Core.tokens.json as bridge)
 * to Palette entries, then look up paired values in Light.tokens.json vs Dark.tokens.json.
 * No separate Semantic.dark export required.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'design-tokens', 'source');
const OUT_DIR = path.join(ROOT, 'src', 'design-system', 'generated');
const OUT_FILE = path.join(OUT_DIR, 'tokens.css');

function kebab(str) {
  return String(str)
    .replace(/\u2013/g, '-')
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function colorToCss(val) {
  if (!val || typeof val !== 'object') return null;
  const { components, alpha = 1, hex } = val;
  if (Array.isArray(components) && components.length >= 3) {
    const r = Math.round(components[0] * 255);
    const g = Math.round(components[1] * 255);
    const b = Math.round(components[2] * 255);
    const a = typeof alpha === 'number' ? alpha : 1;
    if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (hex && typeof hex === 'string') {
    if (typeof alpha === 'number' && alpha < 1) {
      const h = hex.replace('#', '');
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex.startsWith('#') ? hex : `#${hex}`;
  }
  return null;
}

function walkDensity(obj, parts, out, skipSubtree) {
  if (!obj || typeof obj !== 'object') return;
  if (skipSubtree && parts[0] === 'Figma Hack') return;

  for (const [key, val] of Object.entries(obj)) {
    if (key === '$extensions' || key.startsWith('$')) continue;
    const next = [...parts, key];

    if (val && typeof val === 'object' && '$value' in val && '$type' in val) {
      const name = next.map(kebab).join('-');
      const v = val.$value;
      const t = val.$type;

      if (t === 'number') {
        const isTypography =
          parts[0] === 'Typography' ||
          (parts.length >= 2 && parts[0] === 'Typography');
        const isFontWeight = key === 'weight' || key === 'tracking';
        const unit =
          isTypography && (key === 'size' || key.includes('line-height'))
            ? 'px'
            : isTypography && isFontWeight
              ? ''
              : 'px';
        out.push({
          name,
          value: v,
          unit,
          raw: unit === 'px' ? `${v}px` : String(v),
        });
      }
      continue;
    }

    walkDensity(val, next, out, skipSubtree);
  }
}

/** Recursively index palette: "core-100" -> { light, dark } CSS strings */
function buildPaletteDualMap(lightRoot, darkRoot) {
  const map = new Map();

  function walk(lObj, dObj, parts) {
    if (!lObj || typeof lObj !== 'object') return;
    for (const key of Object.keys(lObj)) {
      if (key === '$extensions' || key.startsWith('$')) continue;
      const lVal = lObj[key];
      const dVal = dObj && typeof dObj === 'object' ? dObj[key] : undefined;
      const next = [...parts, key];

      if (lVal && typeof lVal === 'object' && lVal.$type === 'color' && lVal.$value) {
        const k = next.map(kebab).join('-');
        const lc = colorToCss(lVal.$value);
        const dc =
          dVal && typeof dVal === 'object' && dVal.$type === 'color' && dVal.$value
            ? colorToCss(dVal.$value)
            : lc;
        if (lc) map.set(k, { light: lc, dark: dc });
      } else if (lVal && typeof lVal === 'object') {
        walk(lVal, dVal && typeof dVal === 'object' ? dVal : {}, next);
      }
    }
  }

  walk(lightRoot, darkRoot, []);
  return map;
}

function figmaPalettePathToKey(pathStr) {
  return pathStr
    .split('/')
    .map((s) => kebab(s.trim()))
    .join('-');
}

/** Walk Theme JSON by "A/B/C" path to a leaf color token */
function getThemeLeaf(themeJson, pathStr) {
  if (!pathStr || !themeJson) return null;
  const segments = pathStr.split('/').map((s) => s.trim());
  let n = themeJson;
  for (const seg of segments) {
    if (!n || typeof n !== 'object') return null;
    n = n[seg];
  }
  return n && typeof n === 'object' && n.$type === 'color' ? n : null;
}

function getAlias(node) {
  return node?.$extensions?.['com.figma.aliasData'] ?? null;
}

/**
 * Resolve a semantic/theme color node's light+dark CSS from palette dual map,
 * using coreTheme as bridge when alias points at Theme collection.
 */
function resolveColorDual(node, paletteDual, coreTheme) {
  const fallback = colorToCss(node.$value);
  const ad = getAlias(node);
  if (!ad) {
    return fallback ? { light: fallback, dark: fallback } : null;
  }

  const setName = ad.targetVariableSetName;
  const varName = ad.targetVariableName;
  if (!varName) return fallback ? { light: fallback, dark: fallback } : null;

  if (setName === 'Palette') {
    const key = figmaPalettePathToKey(varName);
    const pair = paletteDual.get(key);
    if (pair) return pair;
    console.warn(`[build-tokens] Missing palette key "${key}" (from ${varName})`);
    return fallback ? { light: fallback, dark: fallback } : null;
  }

  if (setName === 'Theme') {
    const bridge = getThemeLeaf(coreTheme, varName);
    if (!bridge) {
      console.warn(`[build-tokens] Missing theme path "${varName}"`);
      return fallback ? { light: fallback, dark: fallback } : null;
    }
    const ad2 = getAlias(bridge);
    if (ad2 && ad2.targetVariableSetName === 'Palette' && ad2.targetVariableName) {
      const key = figmaPalettePathToKey(ad2.targetVariableName);
      const pair = paletteDual.get(key);
      if (pair) return pair;
    }
    const direct = colorToCss(bridge.$value);
    if (direct) return { light: direct, dark: direct };
    return fallback ? { light: fallback, dark: fallback } : null;
  }

  return fallback ? { light: fallback, dark: fallback } : null;
}

function collectSemanticEntries(obj, parts, colors, numbers) {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, val] of Object.entries(obj)) {
    if (key === '$extensions' || key.startsWith('$')) continue;
    const next = [...parts, key];
    if (val && val.$type === 'color' && val.$value !== undefined) {
      colors.push({ parts: next, node: val });
    } else if (val && val.$type === 'number' && val.$value !== undefined) {
      numbers.push({ parts: next, node: val });
    } else if (val && typeof val === 'object') {
      collectSemanticEntries(val, next, colors, numbers);
    }
  }
}

function semanticPartsToCssName(parts) {
  return parts.map(kebab).join('-');
}

function walkThemeColorLeaves(themeJson, parts, out) {
  if (!themeJson || typeof themeJson !== 'object') return;
  for (const [key, val] of Object.entries(themeJson)) {
    if (key === '$extensions' || key.startsWith('$')) continue;
    const next = [...parts, key];
    if (val && val.$type === 'color' && val.$value !== undefined) {
      out.push({ parts: next, node: val });
    } else if (val && typeof val === 'object') {
      walkThemeColorLeaves(val, next, out);
    }
  }
}

function varsToCssBlock(selector, vars) {
  if (vars.length === 0) return '';
  const lines = vars.map(({ name, value, raw }) => {
    const v = raw !== undefined ? raw : value;
    return `  --${name}: ${v};`;
  });
  return `${selector} {\n${lines.join('\n')}\n}\n\n`;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const densityPath = path.join(SOURCE, 'density', 'Density.tokens.json');
  const density = readJson(densityPath);
  const densityOut = [];
  walkDensity(density, [], densityOut, true);

  const densityVars = [];
  for (const row of densityOut) {
    let name = row.name;
    if (name.startsWith('typography-')) {
      const rest = name.slice('typography-'.length);
      name = `type-${rest}`;
    }
    if (name.startsWith('icon-')) {
      densityVars.push({ name, raw: `${row.value}px` });
    } else if (name.startsWith('spacing-')) {
      densityVars.push({ name, raw: `${row.value}px` });
    } else if (name.startsWith('radius-')) {
      densityVars.push({ name, raw: `${row.value}px` });
    } else if (name.startsWith('type-')) {
      if (row.name.includes('weight') || row.name.endsWith('-tracking')) {
        densityVars.push({ name, raw: row.value });
      } else {
        densityVars.push({ name, raw: `${row.value}px` });
      }
    } else {
      densityVars.push({ name, raw: `${row.value}px` });
    }
  }

  const lightPalette = readJson(path.join(SOURCE, 'palette', 'Light.tokens.json'));
  const darkPalette = readJson(path.join(SOURCE, 'palette', 'Dark.tokens.json'));
  const paletteDual = buildPaletteDualMap(lightPalette, darkPalette);

  const coreThemePath = path.join(SOURCE, 'theme', 'Core.tokens.json');
  const coreTheme = readJson(coreThemePath);

  const semanticPath = path.join(SOURCE, 'semantic', 'Semantic.tokens.json');
  const semantic = readJson(semanticPath);
  const colorEntries = [];
  const numberEntries = [];
  collectSemanticEntries(semantic, [], colorEntries, numberEntries);

  const rootExtras = [];

  const lightSemantic = [];
  const darkSemantic = [];
  const lightPaletteVars = [];
  const darkPaletteVars = [];

  for (const [key, pair] of paletteDual.entries()) {
    lightPaletteVars.push({ name: `palette-${key}`, value: pair.light });
    darkPaletteVars.push({ name: `palette-${key}`, value: pair.dark });
  }

  for (const { parts, node } of colorEntries) {
    let name = semanticPartsToCssName(parts);
    const dual = resolveColorDual(node, paletteDual, coreTheme);
    if (!dual) continue;

    if (name === 'misc-focus-ring') {
      name = 'focus-ring';
    } else if (name.startsWith('misc-')) {
      /* keep misc-* */
    }

    lightSemantic.push({ name, value: dual.light });
    darkSemantic.push({ name, value: dual.dark });
  }

  for (const { parts, node } of numberEntries) {
    const name = semanticPartsToCssName(parts);
    if (name === 'misc-disabled') {
      const num = Number(node.$value);
      const opacity = Number.isFinite(num) ? num / 100 : 0.3;
      rootExtras.push({ name: 'disabled-opacity', raw: String(opacity) });
    } else {
      rootExtras.push({ name, raw: String(node.$value) });
    }
  }

  const themeDir = path.join(SOURCE, 'theme');
  const themeFiles = fs.readdirSync(themeDir).filter((f) => f.endsWith('.tokens.json'));

  const themeBlocks = [];
  for (const file of themeFiles) {
    const base = file.replace('.tokens.json', '');
    const themeKey = kebab(base);
    if (themeKey === 'core') continue;

    const themeJson = readJson(path.join(themeDir, file));
    const leaves = [];
    walkThemeColorLeaves(themeJson, [], leaves);

    const lightOvr = [];
    const darkOvr = [];
    for (const { parts, node } of leaves) {
      const name = semanticPartsToCssName(parts);
      const dual = resolveColorDual(node, paletteDual, coreTheme);
      if (!dual) continue;
      lightOvr.push({ name, value: dual.light });
      darkOvr.push({ name, value: dual.dark });
    }
    if (lightOvr.length) {
      themeBlocks.push(
        varsToCssBlock(`[data-theme="${themeKey}"][data-color-scheme="light"]`, lightOvr),
      );
    }
    if (darkOvr.length) {
      themeBlocks.push(
        varsToCssBlock(`[data-theme="${themeKey}"][data-color-scheme="dark"]`, darkOvr),
      );
    }
  }

  const foundationVars = [
    { name: 'bp-s-max', raw: '599px' },
    { name: 'bp-m-min', raw: '600px' },
    { name: 'bp-m-max', raw: '1023px' },
    { name: 'bp-l-min', raw: '1024px' },
    { name: 'bp-l-max', raw: '1439px' },
    { name: 'bp-xl-min', raw: '1440px' },
    { name: 'container-max-width', raw: '1200px' },
  ];

  let css = '/* AUTO-GENERATED by scripts/build-tokens.mjs — do not edit */\n\n';
  css +=
    '/* Color tokens: set data-color-scheme="light"|"dark" on <html>. Theme: data-theme. Palette resolves light/dark. */\n\n';
  css += varsToCssBlock(':root', [...foundationVars, ...densityVars, ...rootExtras]);
  css += varsToCssBlock('[data-color-scheme="light"]', [...lightPaletteVars, ...lightSemantic]);
  css += varsToCssBlock('[data-color-scheme="dark"]', [...darkPaletteVars, ...darkSemantic]);
  css += themeBlocks.join('');

  fs.writeFileSync(OUT_FILE, css, 'utf8');
  console.log(`[build-tokens] Wrote ${path.relative(ROOT, OUT_FILE)}`);
}

main();
