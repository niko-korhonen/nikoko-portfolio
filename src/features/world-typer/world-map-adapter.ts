/**
 * amCharts 5 globe + world polygons. See:
 * https://www.amcharts.com/docs/v5/charts/map-chart/
 * https://www.amcharts.com/docs/v5/tutorials/rotate-and-zoom-the-globe-to-a-clicked-country/
 *
 * Note: `datavalidated` can fire in the same turn as series creation (Component._afterChanged).
 * The ready handler must be registered before any later work that could let that frame complete,
 * otherwise the event is missed and onReady never runs.
 */
import * as am5 from '@amcharts/amcharts5';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import type { GamePhase } from './game-state.ts';
import { matchCountryAlias } from './country-aliases.ts';
import { normalizeGuessName } from './guess-normalize.ts';

export type CountryCatalogEntry = {
  id: string;
  name: string;
  normalized: string;
};

function cssRgbaVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Globe strokes: game-only fixed colors (not design-system tokens).
 * Light: country #808080, grid #EDEDED — Dark: country #555555, grid #2A2A2A
 */
const WORLD_MAP_STROKE_POLYGON_LIGHT = 'rgba(128, 128, 128, 1)'; // #808080
const WORLD_MAP_STROKE_GRATICULE_LIGHT = 'rgba(237, 237, 237, 1)'; // #EDEDED
const WORLD_MAP_STROKE_POLYGON_DARK = 'rgba(85, 85, 85, 1)'; // #555555
const WORLD_MAP_STROKE_GRATICULE_DARK = 'rgba(42, 42, 42, 1)'; // #2A2A2A

function worldMapIsDarkSurface(): boolean {
  const t = document.documentElement.getAttribute('data-theme');
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function worldMapStrokeRgba(): { polygon: string; graticule: string } {
  if (worldMapIsDarkSurface()) {
    return { polygon: WORLD_MAP_STROKE_POLYGON_DARK, graticule: WORLD_MAP_STROKE_GRATICULE_DARK };
  }
  return { polygon: WORLD_MAP_STROKE_POLYGON_LIGHT, graticule: WORLD_MAP_STROKE_GRATICULE_LIGHT };
}

export type WorldMapApi = {
  catalog: CountryCatalogEntry[];
  totalGuessable: number;
  /** First wins on normalized-name collisions. */
  matchNormalized: (normalized: string) => string | null;
  markGuessed: (id: string) => void;
  resetVisuals: () => void;
  applyReview: (guessedIds: Set<string>) => void;
  /** Align tooltips + base fills with game phase (call when phase changes and after map is ready). */
  syncPhase: (phase: GamePhase) => void;
  dispose: () => void;
};

let previousPolygon: am5map.MapPolygon | null = null;

export function createWorldMap(
  container: HTMLElement,
  onReady: (api: WorldMapApi) => void,
): void {
  /** Default / not guessed (idle + playing). */
  let fillBase = am5.color(cssRgbaVar('--color-content-secondary-inverse', 'rgba(128, 128, 128, 1)'));
  /** Guessed correctly. */
  let fillPositive = am5.color(cssRgbaVar('--color-content-positive', 'rgba(65, 192, 124, 1)'));
  /** Not guessed (review only). */
  let fillNegative = am5.color(cssRgbaVar('--color-content-negative', 'rgba(221, 81, 81, 1)'));
  const strokes0 = worldMapStrokeRgba();
  let strokeColor = am5.color(strokes0.polygon);
  let graticuleStrokeColor = am5.color(strokes0.graticule);

  const root = am5.Root.new(container);
  root.setThemes([am5themes_Animated.new(root)]);

  /** Play mode: countries guessed this round (for re-tinting after theme change). */
  const guessedInPlay = new Set<string>();
  let reviewMode = false;
  let lastReviewGuessedIds: Set<string> | null = null;
  /** Mirrors game phase for tooltips + fill rules. */
  let mapPhase: GamePhase = 'preStart';

  const chart = root.container.children.push(
    am5map.MapChart.new(root, {
      projection: am5map.geoOrthographic(),
      panX: 'rotateX',
      panY: 'rotateY',
      wheelY: 'zoom',
      wheelSensitivity: 0.7,
      minZoomLevel: 1,
      maxZoomLevel: 8,
    }),
  );

  const chartBgRect = am5.Rectangle.new(root, {
    fill: am5.color(cssRgbaVar('--color-surface-base', '#ffffff')),
    fillOpacity: 1,
  });
  chart.chartContainer.set('background', chartBgRect);

  const graticuleSeries = chart.series.unshift(
    am5map.GraticuleSeries.new(root, {
      step: 10,
    }),
  );
  /** Stroke color carries all softness; keep opacity at 1 (no extra multiplier). */
  graticuleSeries.mapLines.template.setAll({
    stroke: graticuleStrokeColor,
    strokeOpacity: 1,
  });

  const polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
      exclude: ['AQ'],
      fill: fillBase,
      stroke: strokeColor,
    }),
  );

  const catalog: CountryCatalogEntry[] = [];
  const nameToId = new Map<string, string>();

  /**
   * MapPolygonSeries registers `id` / geometry on DataItem settings, but not `name`.
   * GeoJSON `properties.name` lives on `dataContext` (see MapSeries._parseGeoJSON softCopyProperties).
   * Tooltips use `{name}` because placeholders resolve from dataContext; `dataItem.get('name')` is undefined.
   */
  function readCountryFromDataItem(dataItem: (typeof polygonSeries.dataItems)[number]): {
    id: string;
    name: string;
  } | null {
    const ctx = dataItem.dataContext as { id?: string; name?: string } | undefined;
    const id = (dataItem.get('id') as string | undefined) ?? ctx?.id;
    const name = ctx?.name ?? (dataItem.get('name') as string | undefined);
    if (!id || !name) return null;
    return { id, name };
  }

  function buildCatalog(): void {
    catalog.length = 0;
    nameToId.clear();
    for (const dataItem of polygonSeries.dataItems) {
      const row = readCountryFromDataItem(dataItem);
      if (!row) continue;
      const normalized = normalizeGuessName(row.name);
      if (!normalized) continue;
      catalog.push({ id: row.id, name: row.name, normalized });
      if (!nameToId.has(normalized)) {
        nameToId.set(normalized, row.id);
      }
    }
  }

  function matchNormalized(normalized: string): string | null {
    const fromOfficialName = nameToId.get(normalized);
    if (fromOfficialName) return fromOfficialName;
    return matchCountryAlias(normalized);
  }

  function setPolygonFill(id: string, fill: am5.Color): void {
    const di = polygonSeries.getDataItemById(id);
    const poly = di?.get('mapPolygon') as am5map.MapPolygon | undefined;
    poly?.set('fill', fill);
  }

  function applyTooltipForPhase(): void {
    const showNames = mapPhase === 'review';
    polygonSeries.mapPolygons.template.setAll({
      tooltipText: showNames ? '{name}' : undefined,
    });
  }

  function applyPolygonTemplateBase(): void {
    polygonSeries.mapPolygons.template.setAll({
      interactive: true,
      fill: fillBase,
      stroke: strokeColor,
      strokeWidth: 0.35,
      strokeOpacity: 1,
    });
    applyTooltipForPhase();
  }

  /** All countries use secondary-inverse (pre-start / idle). */
  function paintAllBase(): void {
    previousPolygon = null;
    polygonSeries.mapPolygons.each((polygon) => {
      polygon.set('fill', fillBase);
    });
  }

  /** Playing / paused / ended: base for unknown, positive for guessed. */
  function applyPlayingFills(): void {
    previousPolygon = null;
    polygonSeries.mapPolygons.each((polygon) => {
      polygon.set('fill', fillBase);
    });
    guessedInPlay.forEach((id) => {
      setPolygonFill(id, fillPositive);
    });
  }

  function syncPhase(phase: GamePhase): void {
    mapPhase = phase;
    applyTooltipForPhase();
    if (phase === 'review') {
      return;
    }
    if (phase === 'preStart') {
      paintAllBase();
      return;
    }
    if (phase === 'playing' || phase === 'paused' || phase === 'ended') {
      if (!reviewMode) {
        applyPlayingFills();
      }
    }
  }

  function resetVisuals(): void {
    reviewMode = false;
    lastReviewGuessedIds = null;
    guessedInPlay.clear();
    previousPolygon = null;
    paintAllBase();
  }

  /**
   * Rotate the globe so the country faces the viewer. Does not change zoom — wheel / pinch
   * level is preserved (fully zoomed out stays fully zoomed out; closer stays closer).
   */
  function focusMapOnCountryById(id: string): void {
    const dataItem = polygonSeries.getDataItemById(id);
    if (!dataItem) return;
    const mapPolygon = dataItem.get('mapPolygon') as am5map.MapPolygon | undefined;
    if (!mapPolygon) return;

    if (previousPolygon && previousPolygon !== mapPolygon) {
      previousPolygon.set('active', false);
    }
    mapPolygon.set('active', true);
    previousPolygon = mapPolygon;

    const centroid = mapPolygon.geoCentroid();
    if (centroid) {
      chart.animate({
        key: 'rotationX',
        to: -centroid.longitude,
        duration: 1200,
        easing: am5.ease.inOut(am5.ease.cubic),
      });
      chart.animate({
        key: 'rotationY',
        to: -centroid.latitude,
        duration: 1200,
        easing: am5.ease.inOut(am5.ease.cubic),
      });
    }
  }

  function markGuessed(id: string): void {
    guessedInPlay.add(id);
    setPolygonFill(id, fillPositive);
    focusMapOnCountryById(id);
  }

  function applyReview(guessedIds: Set<string>): void {
    reviewMode = true;
    lastReviewGuessedIds = new Set(guessedIds);
    previousPolygon = null;

    for (const dataItem of polygonSeries.dataItems) {
      const id = dataItem.get('id') as string | undefined;
      if (!id) continue;
      const poly = dataItem.get('mapPolygon') as am5map.MapPolygon | undefined;
      if (!poly) continue;
      if (guessedIds.has(id)) {
        poly.set('fill', fillPositive);
      } else {
        poly.set('fill', fillNegative);
      }
    }
  }

  function readThemeFills(): void {
    fillBase = am5.color(cssRgbaVar('--color-content-secondary-inverse', 'rgba(128, 128, 128, 1)'));
    fillPositive = am5.color(cssRgbaVar('--color-content-positive', 'rgba(65, 192, 124, 1)'));
    fillNegative = am5.color(cssRgbaVar('--color-content-negative', 'rgba(221, 81, 81, 1)'));
    const strokes = worldMapStrokeRgba();
    strokeColor = am5.color(strokes.polygon);
    graticuleStrokeColor = am5.color(strokes.graticule);
  }

  function applyThemeFromDocument(): void {
    if (root.isDisposed()) return;
    readThemeFills();
    chartBgRect.set('fill', am5.color(cssRgbaVar('--color-surface-base', '#ffffff')));
    graticuleSeries.mapLines.template.setAll({
      stroke: graticuleStrokeColor,
      strokeOpacity: 1,
    });
    applyPolygonTemplateBase();
    if (reviewMode && lastReviewGuessedIds) {
      applyReview(lastReviewGuessedIds);
    } else if (mapPhase === 'preStart') {
      paintAllBase();
    } else if (mapPhase === 'playing' || mapPhase === 'paused' || mapPhase === 'ended') {
      applyPlayingFills();
    }
  }

  function scheduleThemeFromDocument(): void {
    requestAnimationFrame(() => applyThemeFromDocument());
  }

  const themeObserver = new MutationObserver(() => scheduleThemeFromDocument());
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  const colorSchemeMql = window.matchMedia('(prefers-color-scheme: dark)');
  const onColorSchemeChange = () => scheduleThemeFromDocument();
  colorSchemeMql.addEventListener('change', onColorSchemeChange);

  let readyOnce = false;
  function finalizeReady(): void {
    if (readyOnce) return;
    buildCatalog();
    if (polygonSeries.dataItems.length === 0) return;
    if (catalog.length === 0) return;
    readyOnce = true;
    const api: WorldMapApi = {
      catalog,
      totalGuessable: catalog.length,
      matchNormalized,
      markGuessed,
      resetVisuals,
      applyReview,
      syncPhase,
      dispose: () => {
        themeObserver.disconnect();
        colorSchemeMql.removeEventListener('change', onColorSchemeChange);
        root.dispose();
      },
    };
    onReady(api);
  }

  polygonSeries.events.on('datavalidated', finalizeReady);
  queueMicrotask(finalizeReady);

  applyPolygonTemplateBase();

  /** No hover/active fill overrides — they caused “random” colors over per-polygon fills. */
  polygonSeries.mapPolygons.template.states.create('hover', {});
  polygonSeries.mapPolygons.template.states.create('active', {});

  polygonSeries.mapPolygons.template.events.on('click', (ev) => {
    const target = ev.target as am5map.MapPolygon;
    const dataItem = target.dataItem;
    if (!dataItem) return;
    const id = dataItem.get('id') as string | undefined;
    if (!id) return;
    focusMapOnCountryById(id);
  });
}
