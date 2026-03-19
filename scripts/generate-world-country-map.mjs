/**
 * Reads `public/games/world/world-ios.svg` and writes `src/components/games/worldCountryMap.ts`.
 * Run: node scripts/generate-world-country-map.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const svgPath = path.join(root, 'public/games/world/world-ios.svg');
const outPath = path.join(root, 'src/components/games/worldCountryMap.ts');

const s = fs.readFileSync(svgPath, 'utf8');
const rows = [];
for (const m of s.matchAll(/<path\b[^>]*>/g)) {
  const tag = m[0];
  const idm = /\bid="([^"]+)"/.exec(tag);
  const nam = /data-name="([^"]*)"/.exec(tag);
  if (!idm) continue;
  const cid = idm[1];
  const name = nam ? nam[1] : '';
  if (cid.length === 2 && /^[A-Z]{2}$/.test(cid)) rows.push([cid, name]);
}

const LABEL_ALIASES = {
  'Antigua and Barb.': ['antigua and barbuda', 'antigua and barb'],
  'Bosnia and Herz.': ['bosnia and herzegovina', 'bosnia and herz', 'bosnia'],
  'Dem. Rep. Congo': ['democratic republic of the congo', 'dem rep congo', 'dr congo', 'drc'],
  'Central African Rep.': ['central african republic', 'car', 'central african rep'],
  'Czech Rep.': ['czech republic', 'czechia'],
  'Dominican Rep.': ['dominican republic'],
  'W. Sahara': ['western sahara'],
  'Falkland Is.': ['falkland islands', 'falklands'],
  'Faeroe Is.': ['faroe islands', 'faeroe islands'],
  'Eq. Guinea': ['equatorial guinea'],
  'St. Kitts and Nevis': ['saint kitts and nevis', 'st kitts and nevis'],
  'Dem. Rep. Korea': ['north korea', 'dprk', "democratic people's republic of korea"],
  'Cayman Is.': ['cayman islands'],
  'Fr. Polynesia': ['french polynesia'],
  'Pitcairn Is.': ['pitcairn islands', 'pitcairn'],
  'Solomon Is.': ['solomon islands'],
  'S. Sudan': ['south sudan'],
  'Turks and Caicos Is.': ['turks and caicos islands', 'turks and caicos'],
  'St. Vin. and Gren.': [
    'saint vincent and the grenadines',
    'st vincent and the grenadines',
    'st vincent',
  ],
  'British Virgin Is.': ['british virgin islands'],
  'U.S. Virgin Is.': ['united states virgin islands', 'us virgin islands'],
  Curaco: ['curacao', 'curaçao'],
};

const EXTRA = {
  usa: 'US',
  america: 'US',
  'united states of america': 'US',
  uk: 'GB',
  'great britain': 'GB',
  britain: 'GB',
  england: 'GB',
  scotland: 'GB',
  wales: 'GB',
  'northern ireland': 'GB',
  'south korea': 'KR',
  'korea republic': 'KR',
  'republic of korea': 'KR',
  myanmar: 'MM',
  burma: 'MM',
  'ivory coast': 'CI',
  'cote d ivoire': 'CI',
  "côte d'ivoire": 'CI',
  'east timor': 'TL',
  'timor leste': 'TL',
  eswatini: 'SZ',
  swaziland: 'SZ',
  'cabo verde': 'CV',
  'cape verde': 'CV',
  micronesia: 'FM',
  russia: 'RU',
  reunion: 'RE',
  réunion: 'RE',
  'canary islands': 'IC',
  vietnam: 'VN',
  'viet nam': 'VN',
  laos: 'LA',
  syria: 'SY',
  'sint maarten': 'SX',
  'saint martin': 'SX',
  curacao: 'CW',
  curaçao: 'CW',
};

const validIso = new Set(rows.map(([iso]) => iso));

function normLabel(str) {
  let x = str.trim().toLowerCase().replace(/\s+/g, ' ');
  x = x.replace(/\.$/, '');
  return x;
}

const out = {};

function add(key, iso) {
  const k = normLabel(key);
  if (!k || !validIso.has(iso)) return;
  out[k] = iso;
}

for (const [iso, label] of rows) {
  let L = label;
  if (!L && iso === 'RU') L = 'Russia';
  if (!L) continue;
  add(L, iso);
  const extras = LABEL_ALIASES[L];
  if (extras) for (const a of extras) add(a, iso);
}

for (const [key, iso] of Object.entries(EXTRA)) {
  if (validIso.has(iso)) add(key, iso);
}

function tsKey(k) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k) ? k : JSON.stringify(k);
}

const lines = [
  '/**',
  ' * Lowercase country/territory phrases → ISO 3166-1 alpha-2 ids from `world-ios.svg` paths.',
  ' * Regenerate when the SVG changes: `node scripts/generate-world-country-map.mjs`',
  ' */',
  '',
  'export const COUNTRY_TO_ISO: Record<string, string> = {',
];

for (const k of Object.keys(out).sort((a, b) => a.length - b.length || a.localeCompare(b))) {
  lines.push(`  ${tsKey(k)}: ${JSON.stringify(out[k])},`);
}
lines.push('};');
lines.push('');
lines.push(`export const WORLD_MAP_COUNTRY_COUNT = ${validIso.size};`);
lines.push('');

fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Wrote', path.relative(root, outPath), 'keys:', Object.keys(out).length, 'isos:', validIso.size);
