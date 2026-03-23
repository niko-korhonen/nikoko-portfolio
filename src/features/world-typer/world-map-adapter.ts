/**
 * amCharts 5 globe + world polygons. See:
 * https://www.amcharts.com/docs/v5/charts/map-chart/
 * https://www.amcharts.com/docs/v5/tutorials/rotate-and-zoom-the-globe-to-a-clicked-country/
 */
import * as am5 from '@amcharts/amcharts5';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
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

export type WorldMapApi = {
  catalog: CountryCatalogEntry[];
  totalGuessable: number;
  /** First wins on normalized-name collisions. */
  matchNormalized: (normalized: string) => string | null;
  markGuessed: (id: string) => void;
  resetVisuals: () => void;
  applyReview: (guessedIds: Set<string>) => void;
  dispose: () => void;
};

let previousPolygon: am5map.MapPolygon | null = null;

export function createWorldMap(
  container: HTMLElement,
  onReady: (api: WorldMapApi) => void,
): void {
  const root = am5.Root.new(container);
  root.setThemes([am5themes_Animated.new(root)]);

  const defaultLand = am5.color(cssRgbaVar('--color-container-accent-subtle-blue', 'rgba(193, 207, 246, 1)'));
  const defaultStroke = am5.color(cssRgbaVar('--color-content-tertiary', 'rgba(120, 120, 120, 1)'));
  const hoverFill = am5.color(cssRgbaVar('--color-container-accent-blue', 'rgba(39, 74, 171, 1)'));
  const guessedFill = am5.color(cssRgbaVar('--color-container-accent-subtle-positive', 'rgba(181, 235, 206, 1)'));
  const missedFill = am5.color(cssRgbaVar('--color-container-accent-subtle-negative', 'rgba(246, 193, 193, 1)'));

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

  chart.chartContainer.set(
    'background',
    am5.Rectangle.new(root, {
      fill: am5.color(cssRgbaVar('--color-surface-base', '#ffffff')),
      fillOpacity: 1,
    }),
  );

  const graticuleSeries = chart.series.unshift(
    am5map.GraticuleSeries.new(root, {
      step: 10,
    }),
  );
  graticuleSeries.mapLines.template.setAll({
    stroke: am5.color(0x888888),
    strokeOpacity: 0.15,
  });

  const polygonSeries = chart.series.push(
    am5map.MapPolygonSeries.new(root, {
      geoJSON: am5geodata_worldLow,
      exclude: ['AQ'],
      fill: defaultLand,
      stroke: defaultStroke,
    }),
  );

  polygonSeries.mapPolygons.template.setAll({
    tooltipText: '{name}',
    interactive: true,
    fill: defaultLand,
    stroke: defaultStroke,
    strokeWidth: 0.35,
  });

  polygonSeries.mapPolygons.template.states.create('hover', {
    fill: hoverFill,
  });

  polygonSeries.mapPolygons.template.states.create('active', {
    fill: hoverFill,
  });

  polygonSeries.mapPolygons.template.events.on('click', (ev) => {
    const target = ev.target as am5map.MapPolygon;
    const dataItem = target.dataItem;
    if (!dataItem) return;

    if (previousPolygon && previousPolygon !== target) {
      previousPolygon.set('active', false);
    }
    target.set('active', true);
    previousPolygon = target;

    const mapPolygon = dataItem.get('mapPolygon') as am5map.MapPolygon | undefined;
    const centroid = mapPolygon?.geoCentroid();
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

    window.setTimeout(() => {
      polygonSeries.zoomToDataItem(dataItem, false);
    }, 1200);
  });

  const catalog: CountryCatalogEntry[] = [];
  const nameToId = new Map<string, string>();

  function buildCatalog(): void {
    catalog.length = 0;
    nameToId.clear();
    polygonSeries.dataItems.each((dataItem) => {
      const id = dataItem.get('id') as string | undefined;
      const name = dataItem.get('name') as string | undefined;
      if (!id || !name) return;
      const normalized = normalizeGuessName(name);
      if (!normalized) return;
      catalog.push({ id, name, normalized });
      if (!nameToId.has(normalized)) {
        nameToId.set(normalized, id);
      }
    });
  }

  function matchNormalized(normalized: string): string | null {
    return nameToId.get(normalized) ?? null;
  }

  function setPolygonFill(id: string, fill: am5.Color): void {
    const di = polygonSeries.getDataItemById(id);
    const poly = di?.get('mapPolygon') as am5map.MapPolygon | undefined;
    poly?.set('fill', fill);
  }

  function resetVisuals(): void {
    previousPolygon = null;
    polygonSeries.mapPolygons.each((polygon) => {
      polygon.set('active', false);
      polygon.set('fill', defaultLand);
    });
  }

  function markGuessed(id: string): void {
    setPolygonFill(id, guessedFill);
  }

  function applyReview(guessedIds: Set<string>): void {
    polygonSeries.mapPolygons.each((polygon) => {
      polygon.set('active', false);
    });
    previousPolygon = null;

    polygonSeries.dataItems.each((dataItem) => {
      const id = dataItem.get('id') as string | undefined;
      if (!id) return;
      const poly = dataItem.get('mapPolygon') as am5map.MapPolygon | undefined;
      if (!poly) return;
      if (guessedIds.has(id)) {
        poly.set('fill', guessedFill);
      } else {
        poly.set('fill', missedFill);
      }
    });
  }

  let readyOnce = false;
  polygonSeries.events.on('datavalidated', () => {
    buildCatalog();
    if (readyOnce) return;
    readyOnce = true;
    const api: WorldMapApi = {
      catalog,
      totalGuessable: catalog.length,
      matchNormalized,
      markGuessed,
      resetVisuals,
      applyReview,
      dispose: () => {
        root.dispose();
      },
    };
    onReady(api);
  });
}
