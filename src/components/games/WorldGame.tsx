import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import './WorldGame.css';
import { COUNTRY_TO_ISO, WORLD_MAP_COUNTRY_COUNT } from './worldCountryMap';

const GUESSED_FILL = '#009F38';
const MAP_STROKE = '#FFFFFF';
const MAP_DEFAULT_FILL = '#CCCCCC';
/** End-game review only: fill for territories not guessed (softer than Give up button). */
const MAP_NOT_GUESSED_REVIEW_FILL = '#FFB89B';

function formatTime(totalMs: number): string {
  const s = Math.max(0, Math.ceil(totalMs / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/** Score HUD tooltip; also the core clause in the pause modal sentence. */
function formatScoreProgressSentence(score: number): string {
  return `${score} of ${WORLD_MAP_COUNTRY_COUNT} countries on the map`;
}

function formatPauseModalDescription(score: number): string {
  return `You have guessed ${formatScoreProgressSentence(score)} so far. Keep going!`;
}

/** Elapsed round time from countdown (time used before give-up or timer end). */
function formatGameOverElapsed(elapsedMs: number): string {
  const totalSec = Math.max(0, Math.round(elapsedMs / 1000));
  if (totalSec < 60) {
    if (totalSec === 0) return 'less than a minute';
    return totalSec === 1 ? '1 sec' : `${totalSec} sec`;
  }
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (s === 0) return m === 1 ? '1 min' : `${m} min`;
  return `${m} min ${s} sec`;
}

const GAME_OVER_CONFETTI: {
  fill: string;
  w: number;
  h: number;
  x0: string;
  y0: string;
  x1: string;
  y1: string;
  rot: string;
  delay: string;
}[] = [
  { fill: '#009f38', w: 5, h: 11, x0: '7vw', y0: '16vh', x1: '3vw', y1: '84vh', rot: '195deg', delay: '0ms' },
  { fill: '#ea580c', w: 6, h: 9, x0: '22vw', y0: '11vh', x1: '28vw', y1: '90vh', rot: '-175deg', delay: '14ms' },
  { fill: '#171717', w: 4, h: 12, x0: '42vw', y0: '13vh', x1: '48vw', y1: '82vh', rot: '160deg', delay: '28ms' },
  { fill: '#2563eb', w: 5, h: 10, x0: '58vw', y0: '18vh', x1: '62vw', y1: '88vh', rot: '-210deg', delay: '6ms' },
  { fill: '#ca8a04', w: 5, h: 10, x0: '78vw', y0: '12vh', x1: '88vw', y1: '86vh', rot: '185deg', delay: '22ms' },
  { fill: '#009f38', w: 4, h: 9, x0: '88vw', y0: '20vh', x1: '92vw', y1: '80vh', rot: '-150deg', delay: '35ms' },
  { fill: '#ea580c', w: 5, h: 11, x0: '14vw', y0: '8vh', x1: '8vw', y1: '72vh', rot: '220deg', delay: '17ms' },
  { fill: '#171717', w: 5, h: 8, x0: '66vw', y0: '9vh', x1: '72vw', y1: '78vh', rot: '-190deg', delay: '32ms' },
  { fill: '#2563eb', w: 5, h: 9, x0: '5vw', y0: '6vh', x1: '12vw', y1: '92vh', rot: '170deg', delay: '40ms' },
  { fill: '#ca8a04', w: 6, h: 10, x0: '33vw', y0: '22vh', x1: '38vw', y1: '75vh', rot: '-200deg', delay: '5ms' },
  { fill: '#009f38', w: 5, h: 8, x0: '50vw', y0: '5vh', x1: '45vw', y1: '88vh', rot: '200deg', delay: '48ms' },
  { fill: '#ea580c', w: 4, h: 11, x0: '72vw', y0: '15vh', x1: '68vw', y1: '70vh', rot: '-165deg', delay: '26ms' },
  { fill: '#171717', w: 5, h: 9, x0: '95vw', y0: '10vh', x1: '85vw', y1: '85vh', rot: '175deg', delay: '12ms' },
  { fill: '#2563eb', w: 4, h: 10, x0: '18vw', y0: '28vh', x1: '25vw', y1: '65vh', rot: '-185deg', delay: '44ms' },
  { fill: '#ca8a04', w: 5, h: 8, x0: '38vw', y0: '4vh', x1: '52vw', y1: '95vh', rot: '210deg', delay: '20ms' },
  { fill: '#009f38', w: 6, h: 9, x0: '61vw', y0: '25vh', x1: '55vw', y1: '60vh', rot: '-155deg', delay: '38ms' },
  { fill: '#ea580c', w: 5, h: 10, x0: '82vw', y0: '28vh', x1: '75vw', y1: '78vh', rot: '190deg', delay: '30ms' },
  { fill: '#171717', w: 5, h: 11, x0: '10vw', y0: '45vh', x1: '20vw', y1: '55vh', rot: '-220deg', delay: '42ms' },
  { fill: '#2563eb', w: 6, h: 8, x0: '48vw', y0: '35vh', x1: '58vw', y1: '68vh', rot: '165deg', delay: '8ms' },
  { fill: '#ca8a04', w: 4, h: 12, x0: '27vw', y0: '40vh', x1: '35vw', y1: '58vh', rot: '-175deg', delay: '46ms' },
  { fill: '#009f38', w: 5, h: 10, x0: '92vw', y0: '40vh', x1: '78vw', y1: '62vh', rot: '205deg', delay: '15ms' },
  { fill: '#ea580c', w: 5, h: 9, x0: '3vw', y0: '70vh', x1: '15vw', y1: '32vh', rot: '-160deg', delay: '48ms' },
  { fill: '#171717', w: 5, h: 10, x0: '55vw', y0: '48vh', x1: '48vw', y1: '42vh', rot: '180deg', delay: '24ms' },
  { fill: '#2563eb', w: 5, h: 11, x0: '74vw', y0: '52vh', x1: '65vw', y1: '48vh', rot: '-195deg', delay: '34ms' },
];

function GameOverConfetti() {
  return (
    <div className="world-game__confetti" aria-hidden>
      {GAME_OVER_CONFETTI.map((p, i) => (
        <span
          key={i}
          className="world-game__confetti-piece"
          style={
            {
              width: p.w * 2,
              height: p.h * 2,
              backgroundColor: p.fill,
              '--x0': p.x0,
              '--y0': p.y0,
              '--x1': p.x1,
              '--y1': p.y1,
              '--rot': p.rot,
              animationDelay: p.delay,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function paintNotGuessedCountriesReview(root: HTMLElement | null, guessed: Set<string>): void {
  if (!root) return;
  for (const path of root.querySelectorAll('path[id]')) {
    const id = path.getAttribute('id');
    if (!id || !/^[A-Z]{2}$/.test(id)) continue;
    if (guessed.has(id)) continue;
    paintCountry(root, id, MAP_NOT_GUESSED_REVIEW_FILL);
  }
}

function paintCountry(root: HTMLElement | null, iso: string, fill: string): void {
  if (!root) return;
  let node: Element | null = null;
  try {
    node = root.querySelector(`#${CSS.escape(iso)}`);
  } catch {
    return;
  }
  if (!node || !(node instanceof SVGElement)) return;
  // Paths in world-ios.svg use inline style fill; !important beats that and inherited svg { fill: none }.
  node.removeAttribute('fill');
  node.style.setProperty('fill', fill, 'important');
}

function configureMapSvg(container: HTMLElement | null): void {
  if (!container) return;
  const svg = container.querySelector('svg');
  if (svg) {
    svg.setAttribute('width', '100%');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.style.display = 'block';
    svg.style.height = 'auto';
    svg.style.width = '100%';
    svg.style.setProperty('stroke', MAP_STROKE, 'important');
    svg.style.setProperty('stroke-linejoin', 'round', 'important');
  }
}

/** ISO-like territory paths: white stroke, gray fill (greens applied after). */
function applyMapTerritoryDefaults(container: HTMLElement | null): void {
  if (!container) return;
  for (const path of container.querySelectorAll('path[id]')) {
    const id = path.getAttribute('id');
    if (!id || !/^[A-Z]{2}$/.test(id)) continue;
    if (!(path instanceof SVGElement)) continue;
    path.removeAttribute('fill');
    path.style.removeProperty('stroke-width');
    path.style.removeProperty('stroke-opacity');
    path.style.removeProperty('pointer-events');
    path.style.setProperty('stroke', MAP_STROKE, 'important');
    path.style.setProperty('fill', MAP_DEFAULT_FILL, 'important');
  }
}

/** Widen invisible strokes so small countries are easier to hit (game over review only). */
function applyReviewHitTargets(container: HTMLElement | null): void {
  if (!container) return;
  for (const path of container.querySelectorAll('path[id]')) {
    const id = path.getAttribute('id');
    if (!id || !/^[A-Z]{2}$/.test(id)) continue;
    if (!(path instanceof SVGElement)) continue;
    path.style.setProperty('stroke-width', '14', 'important');
    path.style.setProperty('stroke', '#ffffff', 'important');
    path.style.setProperty('stroke-opacity', '0', 'important');
    path.style.setProperty('pointer-events', 'all', 'important');
  }
}

function isIsoCountryPath(el: EventTarget | null): el is SVGPathElement {
  if (!(el instanceof SVGPathElement)) return false;
  const id = el.getAttribute('id');
  return !!id && /^[A-Z]{2}$/.test(id);
}

const MAP_ZOOM_MIN = 1;
const MAP_ZOOM_MAX_LEVEL = 3;
const MAP_DRAG_THRESHOLD_PX = 6;

type MapPan = { x: number; y: number };

function clampPanForZoom(
  px: number,
  py: number,
  zoom: number,
  vw: number,
  vh: number,
  cw: number,
  ch: number
): MapPan {
  if (zoom <= MAP_ZOOM_MIN) return { x: 0, y: 0 };
  const scaledW = cw * zoom;
  const scaledH = ch * zoom;
  const minX = Math.min(0, vw - scaledW);
  const minY = Math.min(0, vh - scaledH);
  return {
    x: Math.min(0, Math.max(minX, px)),
    y: Math.min(0, Math.max(minY, py)),
  };
}

function isMapZoomChromeTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest('button, a, input, textarea, select, label, [role="dialog"]');
}

type Phase = 'intro' | 'playing' | 'over';

type GuessToast = { id: number; variant: 'correct' | 'duplicate' };

type MapCountryHover = { iso: string; name: string; guessed: boolean; x: number; y: number };

const defaultDurationMs = 15 * 60 * 1000;

const TOAST_MS = 1150;
const TOAST_CAP = 8;

export interface WorldGameProps {
  /** Countdown length in milliseconds (default: 15 minutes). */
  durationMs?: number;
}

export default function WorldGame({ durationMs = defaultDurationMs }: WorldGameProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [mapSvg, setMapSvg] = useState<string | null>(null);
  /** Bumps remount so Start / Try again reset the SVG to its original fills. */
  const [mapMountKey, setMapMountKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [guessToasts, setGuessToasts] = useState<GuessToast[]>([]);
  const [mapCountryHover, setMapCountryHover] = useState<MapCountryHover | null>(null);
  const [mapZoom, setMapZoom] = useState(MAP_ZOOM_MIN);
  const [mapPan, setMapPan] = useState<MapPan>({ x: 0, y: 0 });

  const gameRef = useRef<HTMLDivElement>(null);
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const guessedRef = useRef<Set<string>>(new Set());
  const mapZoomRef = useRef(MAP_ZOOM_MIN);
  const mapPanRef = useRef<MapPan>({ x: 0, y: 0 });
  const mapDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const mapTapRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const toastIdRef = useRef(0);
  const toastTimeoutsRef = useRef<Map<number, number>>(new Map());

  const mapInnerHtml = useMemo(() => (mapSvg ? { __html: mapSvg } : null), [mapSvg]);

  const readMapMetrics = useCallback((): { vw: number; vh: number; cw: number; ch: number } => {
    const vp = mapViewportRef.current;
    const pz = panZoomRef.current;
    const mapEl = mapRef.current;
    if (!vp || !pz || !mapEl) return { vw: 0, vh: 0, cw: 0, ch: 0 };
    return {
      vw: vp.clientWidth,
      vh: vp.clientHeight,
      cw: pz.offsetWidth,
      ch: mapEl.offsetHeight,
    };
  }, []);

  const resetMapZoom = useCallback(() => {
    mapZoomRef.current = MAP_ZOOM_MIN;
    mapPanRef.current = { x: 0, y: 0 };
    setMapZoom(MAP_ZOOM_MIN);
    setMapPan({ x: 0, y: 0 });
  }, []);

  const refocusPlayingInput = useCallback(() => {
    if (phase !== 'playing' || paused) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, [phase, paused]);

  /** 100% → 200% → 300% → 100%; focal point stays under cursor between steps. */
  const cycleMapZoomAt = useCallback(
    (clientX: number, clientY: number) => {
      const zOld = mapZoomRef.current;
      const zNew = zOld >= MAP_ZOOM_MAX_LEVEL ? MAP_ZOOM_MIN : zOld + 1;

      if (zNew === MAP_ZOOM_MIN) {
        resetMapZoom();
        refocusPlayingInput();
        return;
      }

      const vp = mapViewportRef.current;
      const pz = panZoomRef.current;
      if (!vp || !pz) return;
      const vr = vp.getBoundingClientRect();
      const vx = clientX - vr.left;
      const vy = clientY - vr.top;

      let localX: number;
      let localY: number;
      if (zOld === MAP_ZOOM_MIN) {
        const pr = pz.getBoundingClientRect();
        localX = clientX - pr.left;
        localY = clientY - pr.top;
      } else {
        const pan = mapPanRef.current;
        localX = (vx - pan.x) / zOld;
        localY = (vy - pan.y) / zOld;
      }

      const panX = vx - localX * zNew;
      const panY = vy - localY * zNew;
      const m = readMapMetrics();
      const clamped = clampPanForZoom(panX, panY, zNew, m.vw, m.vh, m.cw, m.ch);
      mapZoomRef.current = zNew;
      mapPanRef.current = clamped;
      setMapZoom(zNew);
      setMapPan(clamped);
      refocusPlayingInput();
    },
    [readMapMetrics, resetMapZoom, refocusPlayingInput]
  );

  useEffect(() => {
    mapZoomRef.current = mapZoom;
    mapPanRef.current = mapPan;
  }, [mapZoom, mapPan]);

  useEffect(() => {
    let cancelled = false;
    fetch('/games/world/world-ios.svg')
      .then((r) => {
        if (!r.ok) throw new Error(`Map response ${r.status}`);
        return r.text();
      })
      .then((text) => {
        if (cancelled) return;
        const head = text.trimStart().slice(0, 400).toLowerCase();
        if (!head.includes('<svg')) return;
        setMapSvg(text);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    if (!mapSvg || !mapRef.current) return;
    configureMapSvg(mapRef.current);
    applyMapTerritoryDefaults(mapRef.current);
  }, [mapSvg, mapMountKey]);

  /** Pin shell to visual viewport so mobile keyboard does not shove map/HUD off-screen. */
  useLayoutEffect(() => {
    const root = gameRef.current;
    if (!root) return;

    const apply = () => {
      const vv = window.visualViewport;
      if (vv) {
        root.style.setProperty('--world-vv-top', `${vv.offsetTop}px`);
        root.style.setProperty('--world-vv-left', `${vv.offsetLeft}px`);
        root.style.setProperty('--world-vv-width', `${vv.width}px`);
        root.style.setProperty('--world-vv-height', `${vv.height}px`);
      } else {
        root.style.setProperty('--world-vv-top', '0px');
        root.style.setProperty('--world-vv-left', '0px');
        root.style.setProperty('--world-vv-width', `${window.innerWidth}px`);
        root.style.setProperty('--world-vv-height', `${window.innerHeight}px`);
      }
    };

    apply();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);

    return () => {
      vv?.removeEventListener('resize', apply);
      vv?.removeEventListener('scroll', apply);
      window.removeEventListener('resize', apply);
    };
  }, []);

  /** Re-apply greens after defaults: survives timer/input re-renders and any innerHTML churn. */
  useLayoutEffect(() => {
    if (phase !== 'playing' && phase !== 'over') return;
    const root = mapRef.current;
    if (!root || !mapSvg) return;
    for (const iso of guessedRef.current) {
      paintCountry(root, iso, GUESSED_FILL);
    }
    if (phase === 'over') {
      paintNotGuessedCountriesReview(root, guessedRef.current);
      applyReviewHitTargets(root);
    }
  }, [phase, score, remainingMs, mapSvg, mapMountKey]);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'over') {
      setMapCountryHover(null);
      return;
    }
    if (phase === 'playing' && paused) {
      setMapCountryHover(null);
      return;
    }

    const root = mapRef.current;
    const svg = root?.querySelector('svg');
    if (!svg) return;

    const updateFromPointer = (e: PointerEvent) => {
      const path = isIsoCountryPath(e.target) ? e.target : null;
      if (!path) {
        setMapCountryHover(null);
        return;
      }
      const iso = path.getAttribute('id')!;
      const name = path.getAttribute('data-name')?.trim() || iso;
      setMapCountryHover({
        iso,
        name,
        guessed: guessedRef.current.has(iso),
        x: e.clientX,
        y: e.clientY,
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      updateFromPointer(e);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      updateFromPointer(e);
    };

    const onPointerLeave = () => setMapCountryHover(null);

    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointerleave', onPointerLeave);
    svg.addEventListener('pointercancel', onPointerLeave);

    return () => {
      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointerleave', onPointerLeave);
      svg.removeEventListener('pointercancel', onPointerLeave);
    };
  }, [phase, paused, mapSvg, mapMountKey]);

  /** Update mystery tooltip when the hovered country is guessed mid-hover. */
  useEffect(() => {
    if (phase !== 'playing') return;
    setMapCountryHover((prev) => {
      if (!prev) return prev;
      const g = guessedRef.current.has(prev.iso);
      if (g === prev.guessed) return prev;
      return { ...prev, guessed: g };
    });
  }, [phase, score]);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'over') return;
    const vp = mapViewportRef.current;
    if (!vp) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (isMapZoomChromeTarget(e.target)) return;
      if (phase === 'playing' && !paused) {
        e.preventDefault();
      }

      if (mapZoomRef.current > MAP_ZOOM_MIN) {
        mapDragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startPanX: mapPanRef.current.x,
          startPanY: mapPanRef.current.y,
        };
        vp.classList.add('world-game__map-viewport--dragging');
        try {
          vp.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      } else {
        mapTapRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const d = mapDragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const z = mapZoomRef.current;
      const m = readMapMetrics();
      const next = clampPanForZoom(d.startPanX + dx, d.startPanY + dy, z, m.vw, m.vh, m.cw, m.ch);
      mapPanRef.current = next;
      setMapPan(next);
    };

    const finishPointer = (e: PointerEvent) => {
      const d = mapDragRef.current;
      if (d && d.pointerId === e.pointerId) {
        vp.classList.remove('world-game__map-viewport--dragging');
        try {
          if (vp.hasPointerCapture(e.pointerId)) vp.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
        mapDragRef.current = null;
        if (dist < MAP_DRAG_THRESHOLD_PX) {
          if (mapZoomRef.current >= MAP_ZOOM_MAX_LEVEL) {
            resetMapZoom();
            refocusPlayingInput();
          } else {
            cycleMapZoomAt(e.clientX, e.clientY);
          }
        }
        mapTapRef.current = null;
        return;
      }

      const tap = mapTapRef.current;
      if (tap && tap.pointerId === e.pointerId) {
        const z = mapZoomRef.current;
        const dist = Math.hypot(e.clientX - tap.x, e.clientY - tap.y);
        mapTapRef.current = null;
        if (dist < MAP_DRAG_THRESHOLD_PX) {
          if (z >= MAP_ZOOM_MAX_LEVEL) {
            resetMapZoom();
            refocusPlayingInput();
          } else {
            cycleMapZoomAt(e.clientX, e.clientY);
          }
        }
        return;
      }
      mapTapRef.current = null;
    };

    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', finishPointer);
    vp.addEventListener('pointercancel', finishPointer);

    return () => {
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', finishPointer);
      vp.removeEventListener('pointercancel', finishPointer);
      mapDragRef.current = null;
      mapTapRef.current = null;
      vp.classList.remove('world-game__map-viewport--dragging');
    };
  }, [phase, paused, readMapMetrics, cycleMapZoomAt, resetMapZoom, refocusPlayingInput]);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'over') return;
    const vp = mapViewportRef.current;
    if (!vp) return;

    const onWheel = (e: WheelEvent) => {
      if (mapZoomRef.current <= MAP_ZOOM_MIN) return;
      e.preventDefault();
      const mult = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vp.clientHeight : 1;
      const sdx = e.deltaX * mult;
      const sdy = e.deltaY * mult;
      setMapPan((prev) => {
        const z = mapZoomRef.current;
        const m = readMapMetrics();
        const next = clampPanForZoom(prev.x - sdx, prev.y - sdy, z, m.vw, m.vh, m.cw, m.ch);
        mapPanRef.current = next;
        return next;
      });
    };

    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [phase, readMapMetrics]);

  useEffect(() => {
    if (phase !== 'playing' || paused) return;
    inputRef.current?.focus();
  }, [phase, paused]);

  useEffect(() => {
    if (phase !== 'playing' || paused) return;
    const id = window.setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, paused]);

  useEffect(() => {
    if (phase === 'playing' && remainingMs === 0) setPhase('over');
  }, [phase, remainingMs]);

  const clearGuessToasts = useCallback(() => {
    for (const tid of toastTimeoutsRef.current.values()) window.clearTimeout(tid);
    toastTimeoutsRef.current.clear();
    setGuessToasts([]);
  }, []);

  useEffect(() => {
    if (phase === 'playing') return;
    clearGuessToasts();
  }, [phase, clearGuessToasts]);

  const pushGuessToast = useCallback((variant: GuessToast['variant']) => {
    const id = ++toastIdRef.current;
    setGuessToasts((prev) => {
      const next = [...prev, { id, variant }];
      if (next.length <= TOAST_CAP) return next;
      const evicted = next.slice(0, next.length - TOAST_CAP);
      for (const t of evicted) {
        const oldTid = toastTimeoutsRef.current.get(t.id);
        if (oldTid !== undefined) {
          window.clearTimeout(oldTid);
          toastTimeoutsRef.current.delete(t.id);
        }
      }
      return next.slice(-TOAST_CAP);
    });
    const timeoutId = window.setTimeout(() => {
      toastTimeoutsRef.current.delete(id);
      setGuessToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_MS);
    toastTimeoutsRef.current.set(id, timeoutId);
  }, []);

  useEffect(
    () => () => {
      for (const tid of toastTimeoutsRef.current.values()) window.clearTimeout(tid);
      toastTimeoutsRef.current.clear();
    },
    []
  );

  const resetRound = useCallback(() => {
    guessedRef.current = new Set();
    setScore(0);
    setInput('');
    setRemainingMs(durationMs);
    setPaused(false);
    setPhase('intro');
    setMapMountKey((k) => k + 1);
    clearGuessToasts();
    mapZoomRef.current = MAP_ZOOM_MIN;
    mapPanRef.current = { x: 0, y: 0 };
    setMapZoom(MAP_ZOOM_MIN);
    setMapPan({ x: 0, y: 0 });
  }, [durationMs, clearGuessToasts]);

  const startGame = useCallback(() => {
    guessedRef.current = new Set();
    setScore(0);
    setInput('');
    setRemainingMs(durationMs);
    setPaused(false);
    setPhase('playing');
    setMapMountKey((k) => k + 1);
    clearGuessToasts();
    mapZoomRef.current = MAP_ZOOM_MIN;
    mapPanRef.current = { x: 0, y: 0 };
    setMapZoom(MAP_ZOOM_MIN);
    setMapPan({ x: 0, y: 0 });
  }, [durationMs, clearGuessToasts]);

  const onInputChange = (raw: string) => {
    setInput(raw);
    if (phase !== 'playing' || paused) return;

    const key = raw.toLowerCase().trim();
    if (!key) return;

    const iso = COUNTRY_TO_ISO[key];
    if (!iso) return;

    if (guessedRef.current.has(iso)) {
      pushGuessToast('duplicate');
      return;
    }

    guessedRef.current.add(iso);
    setScore((s) => s + 1);
    setInput('');
    pushGuessToast('correct');
  };

  return (
    <div className="world-game" ref={gameRef}>
      <div
        ref={mapViewportRef}
        className={[
          'world-game__map-viewport',
          phase === 'over' ? 'world-game__map-viewport--review' : '',
          mapZoom === MAP_ZOOM_MIN
            ? 'world-game__map-viewport--fit'
            : 'world-game__map-viewport--zoomed',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ opacity: phase === 'intro' ? 0.35 : 1 }}
      >
        <div
          ref={panZoomRef}
          className="world-game__map-panzoom"
          style={{
            transform: `translate3d(${mapPan.x}px, ${mapPan.y}px, 0) scale(${mapZoom})`,
          }}
        >
          <div
            key={mapMountKey}
            ref={mapRef}
            className={[
              'world-game__map',
              phase === 'over' && 'world-game__map--review',
              phase === 'playing' && !paused && 'world-game__map--playing-hover',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden
            {...(mapInnerHtml ? { dangerouslySetInnerHTML: mapInnerHtml } : {})}
          />
        </div>
      </div>

      {(phase === 'playing' || phase === 'over') && (
        <button
          type="button"
          className="world-game__hud world-game__hud--center world-game__hud--zoom"
          aria-label={mapZoom >= MAP_ZOOM_MAX_LEVEL ? 'Reset map zoom' : 'Zoom map in'}
          onClick={(e) => {
            e.stopPropagation();
            const vp = mapViewportRef.current;
            if (!vp) return;
            const r = vp.getBoundingClientRect();
            cycleMapZoomAt(r.left + r.width / 2, r.top + r.height / 2);
          }}
        >
          <img
            className="world-game__hud-zoom-icon"
            src={mapZoom >= MAP_ZOOM_MAX_LEVEL ? '/games/world/icon-zoomOut.svg' : '/games/world/icon-zoomIn.svg'}
            alt=""
            width={18}
            height={18}
            draggable={false}
          />
          <span>{mapZoom * 100}%</span>
        </button>
      )}

      {(phase === 'playing' || phase === 'over') && mapCountryHover && (
        <div
          className={
            mapCountryHover.guessed
              ? 'world-game__review-toast world-game__review-toast--guessed'
              : phase === 'over'
                ? 'world-game__review-toast world-game__review-toast--missed-review'
                : 'world-game__review-toast world-game__review-toast--missed'
          }
          style={{ left: mapCountryHover.x, top: mapCountryHover.y }}
          role="status"
        >
          {phase === 'playing' && !mapCountryHover.guessed ? '?' : mapCountryHover.name}
        </div>
      )}

      {phase === 'playing' && (
        <>
          <button
            type="button"
            className="world-game__hud world-game__hud--left world-game__hud--timer"
            aria-label="Pause game"
            onClick={() => setPaused(true)}
          >
            {formatTime(remainingMs)}
          </button>
          <div
            className="world-game__hud world-game__hud--right world-game__hud--score"
            tabIndex={0}
            aria-describedby="world-game-score-tip"
          >
            Score: {score}
            <span id="world-game-score-tip" className="world-game__score-tooltip" role="tooltip">
              {formatScoreProgressSentence(score)}
            </span>
          </div>
          <div className="world-game__input-wrap">
            <label htmlFor="world-game-country-input" className="visually-hidden">
              Country name
            </label>
            <div className="world-game__toast-stack" aria-live="polite" aria-relevant="additions">
              {guessToasts.map((t) => (
                <div
                  key={t.id}
                  className={
                    t.variant === 'correct'
                      ? 'world-game__guess-toast world-game__guess-toast--correct'
                      : 'world-game__guess-toast world-game__guess-toast--duplicate'
                  }
                >
                  <span className="world-game__guess-toast-label">
                    {t.variant === 'correct' ? 'Correct' : 'Already guessed'}
                  </span>
                </div>
              ))}
            </div>
            <form
              className="world-game__guess-form"
              autoComplete="off"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                id="world-game-country-input"
                ref={inputRef}
                className="world-game__input"
                type="text"
                name="world-country-guess"
                inputMode="text"
                enterKeyHint="done"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Type a country name…"
              />
            </form>
          </div>
        </>
      )}

      {phase === 'playing' && paused && (
        <div className="world-game__modal-backdrop world-game__modal-backdrop--pause">
          <div
            className="world-game__modal"
            role="dialog"
            aria-labelledby="world-game-pause-title"
            aria-describedby="world-game-pause-desc"
          >
            <img
              className="world-game__globe"
              src="/games/world/icon-globe.svg"
              alt=""
              width={48}
              height={48}
            />
            <h1 id="world-game-pause-title" className="world-game__modal-title">
              Paused
            </h1>
            <p id="world-game-pause-desc" className="world-game__modal-text">
              {formatPauseModalDescription(score)}
            </p>
            <div className="world-game__modal-actions">
              <button type="button" className="world-game__btn" onClick={() => setPaused(false)}>
                Resume
              </button>
              <button
                type="button"
                className="world-game__btn world-game__btn--danger"
                onClick={() => {
                  setPaused(false);
                  setPhase('over');
                }}
              >
                Give up
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'intro' && (
        <div className="world-game__modal-backdrop">
          <div className="world-game__modal" role="dialog" aria-labelledby="world-game-intro-title">
            <img
              className="world-game__globe"
              src="/games/world/icon-globe.svg"
              alt=""
              width={48}
              height={48}
            />
            <h1 id="world-game-intro-title" className="world-game__modal-title">
              World typing
            </h1>
            <p className="world-game__modal-text">
              Test your geography skills and type as many countries as you can in 15 min.
            </p>
            <button type="button" className="world-game__btn" onClick={startGame} disabled={!mapSvg}>
              Start
            </button>
          </div>
        </div>
      )}

      {phase === 'over' && (
        <div className="world-game__modal-backdrop world-game__modal-backdrop--game-over">
          <GameOverConfetti />
          <div
            className="world-game__modal world-game__modal--game-over-sheet"
            role="dialog"
            aria-labelledby="world-game-over-title"
            aria-describedby="world-game-over-desc"
          >
            <img
              className="world-game__globe world-game__globe--sheet"
              src="/games/world/icon-globe.svg"
              alt=""
              width={40}
              height={40}
            />
            <h1 id="world-game-over-title" className="world-game__modal-title world-game__modal-title--sheet">
              Game over
            </h1>
            <p id="world-game-over-desc" className="world-game__modal-text world-game__modal-text--sheet">
              You guessed {score} countries out of {WORLD_MAP_COUNTRY_COUNT} in{' '}
              {formatGameOverElapsed(durationMs - remainingMs)}. Hover or tap the map to review.
            </p>
            <button type="button" className="world-game__btn" onClick={resetRound}>
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
