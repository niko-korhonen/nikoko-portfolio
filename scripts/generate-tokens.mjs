/**
 * Reads src/system/tokens/*.tokens.json and writes:
 * - src/system/styles/tokens.css
 * - src/system/styles/typography.css (utility classes)
 * Run: node scripts/generate-tokens.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tokensDir = path.join(root, "src/system/tokens");
const outTokens = path.join(root, "src/system/styles/tokens.css");
const outTypography = path.join(root, "src/system/styles/typography.css");

function walkLeaves(obj, parts, visit) {
  if (!obj || typeof obj !== "object") return;
  if (obj.$type !== undefined && obj.$value !== undefined) {
    visit(parts, obj);
    return;
  }
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("$")) continue;
    walkLeaves(v, [...parts, k], visit);
  }
}

function cssName(parts) {
  return parts.map((p) => String(p).toLowerCase()).join("-");
}

function colorToCss(value) {
  if (typeof value !== "object" || !Array.isArray(value.components)) return null;
  const [r, g, b] = value.components;
  const a = value.alpha ?? 1;
  const ri = Math.round(r * 255);
  const gi = Math.round(g * 255);
  const bi = Math.round(b * 255);
  return `rgba(${ri}, ${gi}, ${bi}, ${a})`;
}

function emitColorVars(themeObj) {
  const lines = [];
  walkLeaves(themeObj, [], (parts, node) => {
    const name = cssName(parts);
    if (node.$type === "color") {
      const css = colorToCss(node.$value);
      if (css) lines.push(`  --color-${name}: ${css};`);
      return;
    }
    if (node.$type === "number" && parts.join("-") === "component-disabled") {
      const pct = Number(node.$value);
      const v = Number.isFinite(pct) ? pct / 100 : 0.4;
      lines.push(`  --opacity-component-disabled: ${v};`);
    }
  });
  return lines.join("\n");
}

const SIZE_MAP = { L: "l", M: "m", S: "s", XS: "xs", XXS: "xxs" };

/**
 * Spacing tokens from misc.spacing (e.g. space-16). If Figma exports 0, the number in the token name is used.
 */
function emitSpacingVars(misc) {
  const spacing = misc.spacing;
  if (!spacing) return "";
  const lines = [];
  for (const [k, v] of Object.entries(spacing)) {
    if (k.startsWith("$") || v?.$value === undefined || v?.$value === null) continue;
    let px = Number(v.$value);
    if (px === 0 && /^space-\d+$/.test(k)) {
      const n = parseInt(k.replace("space-", ""), 10);
      if (!Number.isNaN(n)) px = n;
    }
    lines.push(`  --${k}: ${px}px;`);
  }
  return lines.join("\n");
}

/**
 * Box-shadow tokens from misc.shadow (e.g. shadow-L → --shadow-l).
 */
function emitShadowVars(misc) {
  const shadowRoot = misc.shadow;
  if (!shadowRoot || typeof shadowRoot !== "object") return "";
  const lines = [];
  for (const [name, def] of Object.entries(shadowRoot)) {
    if (name.startsWith("$") || typeof def !== "object") continue;
    const x = def["position-x"]?.$value ?? 0;
    const y = def["position-y"]?.$value ?? 0;
    const blur = def["blur"]?.$value ?? 0;
    const spread = def["spread"]?.$value ?? 0;
    const colorNode = def["color"];
    let colorCss = "rgba(0, 0, 0, 0.15)";
    if (colorNode?.$type === "color" && colorNode.$value) {
      const c = colorToCss(colorNode.$value);
      if (c) colorCss = c;
    }
    const suffix = name.replace(/^shadow-/i, "").toLowerCase();
    lines.push(`  --shadow-${suffix}: ${x}px ${y}px ${blur}px ${spread}px ${colorCss};`);
  }
  return lines.join("\n");
}

function emitMiscVars(misc) {
  const lines = [];

  const spacingLines = emitSpacingVars(misc);
  if (spacingLines) lines.push(spacingLines);

  const radius = misc.radius;
  if (radius) {
    for (const [k, v] of Object.entries(radius)) {
      if (k.startsWith("$") || v?.$value === undefined || v?.$value === null) continue;
      lines.push(`  --radius-${cssName([k])}: ${v.$value}px;`);
    }
  }

  const icon = misc.icon;
  if (icon) {
    for (const [k, v] of Object.entries(icon)) {
      if (k.startsWith("$") || v?.$value === undefined || v?.$value === null) continue;
      const key = k.toLowerCase();
      lines.push(`  --icon-${key}: ${v.$value}px;`);
    }
  }

  const shadowLines = emitShadowVars(misc);
  if (shadowLines) lines.push(shadowLines);

  const typeRoot = misc.type;
  if (typeRoot) {
    for (const [category, sizes] of Object.entries(typeRoot)) {
      if (category.startsWith("$") || typeof sizes !== "object") continue;
      for (const [sizeKey, props] of Object.entries(sizes)) {
        if (sizeKey.startsWith("$") || typeof props !== "object") continue;
        const sz = SIZE_MAP[sizeKey];
        if (!sz) continue;
        const base = `text-${cssName([category])}-${sz}`;
        const size = props.size?.$value;
        const lh = props["line-height"]?.$value;
        const track = props.tracking?.$value;
        const wPlain = props["weight-plain"]?.$value;
        const wEm = props["weight-emphasized"]?.$value;
        if (size != null) lines.push(`  --${base}-size: ${size}px;`);
        if (lh != null) lines.push(`  --${base}-line-height: ${lh}px;`);
        if (track != null) {
          const ls = track === 0 ? "0" : `${track}px`;
          lines.push(`  --${base}-letter-spacing: ${ls};`);
        }
        if (wPlain != null) lines.push(`  --${base}-weight-plain: ${wPlain};`);
        if (wEm != null) lines.push(`  --${base}-weight-emphasized: ${wEm};`);
      }
    }
  }

  return lines.join("\n");
}

const FLEX_BLOCK = `  font-family: "Google Sans Flex", sans-serif;
  font-optical-sizing: auto;
  font-style: normal;
  font-variation-settings:
    "slnt" 0,
    "wdth" 100,
    "GRAD" 0,
    "ROND" 0;`;

const CODE_BLOCK = `  font-family: "Google Sans Code", monospace;
  font-optical-sizing: auto;
  font-style: normal;`;

function emitTypographyUtilities(misc) {
  const lines = [];
  const typeRoot = misc.type;
  if (!typeRoot) return "";
  for (const [category, sizes] of Object.entries(typeRoot)) {
    if (category.startsWith("$") || typeof sizes !== "object") continue;
    const isCode = category.toLowerCase() === "code";
    const fontBlock = isCode ? CODE_BLOCK : FLEX_BLOCK;
    for (const [sizeKey, props] of Object.entries(sizes)) {
      if (sizeKey.startsWith("$") || typeof props !== "object") continue;
      const sz = SIZE_MAP[sizeKey];
      if (!sz) continue;
      const base = `text-${cssName([category])}-${sz}`;
      const classPlain = `.text-${cssName([category])}-${sz}-plain`;
      const classEm = `.text-${cssName([category])}-${sz}-emphasized`;
      lines.push(`${classPlain} {
${fontBlock}
  font-size: var(--${base}-size);
  line-height: var(--${base}-line-height);
  letter-spacing: var(--${base}-letter-spacing);
  font-weight: var(--${base}-weight-plain);
}`);
      lines.push(`${classEm} {
${fontBlock}
  font-size: var(--${base}-size);
  line-height: var(--${base}-line-height);
  letter-spacing: var(--${base}-letter-spacing);
  font-weight: var(--${base}-weight-emphasized);
}`);
    }
  }
  return lines.join("\n\n");
}

const light = JSON.parse(fs.readFileSync(path.join(tokensDir, "light.tokens.json"), "utf8"));
const dark = JSON.parse(fs.readFileSync(path.join(tokensDir, "dark.tokens.json"), "utf8"));
const misc = JSON.parse(fs.readFileSync(path.join(tokensDir, "misc.tokens.json"), "utf8"));

const lightColors = emitColorVars(light);
const darkColors = emitColorVars(dark);
const miscBlock = emitMiscVars(misc);
const typographyBlock = emitTypographyUtilities(misc);

const header = `/* Generated by scripts/generate-tokens.mjs — do not edit by hand */\n`;

const css = `${header}
:root,
[data-theme="light"] {
${lightColors}

${miscBlock}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
${darkColors}
  }
}

[data-theme="dark"] {
${darkColors}
}
`;

fs.mkdirSync(path.dirname(outTokens), { recursive: true });
fs.writeFileSync(outTokens, css, "utf8");
console.log("Wrote", path.relative(root, outTokens));

const typoCss = `${header}${typographyBlock}\n`;
fs.writeFileSync(outTypography, typoCss, "utf8");
console.log("Wrote", path.relative(root, outTypography));
