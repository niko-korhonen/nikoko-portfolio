/**
 * Curated alternate names → amCharts `worldLow` country ids (ISO 3166-1 alpha-2).
 *
 * Policy: common English / Western colloquial names only — not ISO 2-letter codes
 * (e.g. no "SE" → Sweden). Official display names from geodata still match first via
 * `nameToId`; these only fill gaps where the map label is formal or diacritic-heavy.
 *
 * Keep this list small and intentional; extend with care to avoid geopolitical or
 * ambiguous shortcuts (e.g. "America" for the US is omitted).
 */
import { normalizeGuessName } from './guess-normalize.ts';

const RAW_ALIAS_PAIRS: [string, string][] = [
  // United States
  ['USA', 'US'],
  ['U.S.A.', 'US'],
  ['U.S.', 'US'],
  ['United States of America', 'US'],

  // Lao PDR
  ['Laos', 'LA'],

  // Palestinian Territories
  ['Palestine', 'PS'],

  // Türkiye (geodata spelling)
  ['Turkey', 'TR'],

  // United Kingdom
  ['Britain', 'GB'],
  ['Great Britain', 'GB'],

  // Netherlands
  ['Holland', 'NL'],

  // Côte d'Ivoire
  ['Ivory Coast', 'CI'],

  // Czechia (formerly Czech Republic in casual speech)
  ['Czech Republic', 'CZ'],

  // Myanmar
  ['Burma', 'MM'],

  // Eswatini
  ['Swaziland', 'SZ'],

  // North Macedonia
  ['Macedonia', 'MK'],

  // Democratic Republic of the Congo
  ['DR Congo', 'CD'],
  ['DRC', 'CD'],

  // United Arab Emirates
  ['UAE', 'AE'],

  // Bosnia and Herzegovina
  ['Bosnia', 'BA'],
];

const normalizedAliasToId = new Map<string, string>();

for (const [phrase, id] of RAW_ALIAS_PAIRS) {
  const key = normalizeGuessName(phrase);
  if (!key) continue;
  normalizedAliasToId.set(key, id);
}

/** Resolve a normalized guess to a country id, or null if no alias applies. */
export function matchCountryAlias(normalized: string): string | null {
  return normalizedAliasToId.get(normalized) ?? null;
}
