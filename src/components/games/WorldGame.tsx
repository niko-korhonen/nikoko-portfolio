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
  { fill: '#ea580c', w: 6, h: 9, x0: '22vw', y0: '11vh', x1: '28vw', y1: '90vh', rot: '-175deg', delay: '45ms' },
  { fill: '#171717', w: 4, h: 12, x0: '42vw', y0: '13vh', x1: '48vw', y1: '82vh', rot: '160deg', delay: '90ms' },
  { fill: '#2563eb', w: 5, h: 10, x0: '58vw', y0: '18vh', x1: '62vw', y1: '88vh', rot: '-210deg', delay: '20ms' },
  { fill: '#ca8a04', w: 5, h: 10, x0: '78vw', y0: '12vh', x1: '88vw', y1: '86vh', rot: '185deg', delay: '70ms' },
  { fill: '#009f38', w: 4, h: 9, x0: '88vw', y0: '20vh', x1: '92vw', y1: '80vh', rot: '-150deg', delay: '110ms' },
  { fill: '#ea580c', w: 5, h: 11, x0: '14vw', y0: '8vh', x1: '8vw', y1: '72vh', rot: '220deg', delay: '55ms' },
  { fill: '#171717', w: 5, h: 8, x0: '66vw', y0: '9vh', x1: '72vw', y1: '78vh', rot: '-190deg', delay: '100ms' },
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
    path.style.setProperty('stroke', MAP_STROKE, 'important');
    path.style.setProperty('fill', MAP_DEFAULT_FILL, 'important');
  }
}

type Phase = 'intro' | 'playing' | 'over';

const defaultDurationMs = 15 * 60 * 1000;

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

  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const guessedRef = useRef<Set<string>>(new Set());

  const mapInnerHtml = useMemo(() => (mapSvg ? { __html: mapSvg } : null), [mapSvg]);

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

  /** Re-apply greens after defaults: survives timer/input re-renders and any innerHTML churn. */
  useLayoutEffect(() => {
    if (phase !== 'playing' && phase !== 'over') return;
    const root = mapRef.current;
    if (!root || !mapSvg) return;
    for (const iso of guessedRef.current) {
      paintCountry(root, iso, GUESSED_FILL);
    }
  }, [phase, score, remainingMs, mapSvg, mapMountKey]);

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

  const resetRound = useCallback(() => {
    guessedRef.current = new Set();
    setScore(0);
    setInput('');
    setRemainingMs(durationMs);
    setPaused(false);
    setPhase('intro');
    setMapMountKey((k) => k + 1);
  }, [durationMs]);

  const startGame = useCallback(() => {
    guessedRef.current = new Set();
    setScore(0);
    setInput('');
    setRemainingMs(durationMs);
    setPaused(false);
    setPhase('playing');
    setMapMountKey((k) => k + 1);
  }, [durationMs]);

  const onInputChange = (raw: string) => {
    setInput(raw);
    if (phase !== 'playing' || paused) return;

    const key = raw.toLowerCase().trim();
    if (!key) return;

    const iso = COUNTRY_TO_ISO[key];
    if (!iso || guessedRef.current.has(iso)) return;

    guessedRef.current.add(iso);
    setScore((s) => s + 1);
    setInput('');
  };

  return (
    <div className="world-game">
      <div
        key={mapMountKey}
        ref={mapRef}
        className="world-game__map"
        style={{ opacity: phase === 'playing' ? 1 : 0.35 }}
        aria-hidden
        {...(mapInnerHtml ? { dangerouslySetInnerHTML: mapInnerHtml } : {})}
      />

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
          <label className="world-game__input-wrap">
            <span className="visually-hidden">Country name</span>
            <input
              ref={inputRef}
              className="world-game__input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type a country name…"
            />
          </label>
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
            className="world-game__modal"
            role="dialog"
            aria-labelledby="world-game-over-title"
            aria-describedby="world-game-over-desc"
          >
            <img
              className="world-game__globe"
              src="/games/world/icon-globe.svg"
              alt=""
              width={48}
              height={48}
            />
            <h1 id="world-game-over-title" className="world-game__modal-title">
              Game over
            </h1>
            <p id="world-game-over-desc" className="world-game__modal-text">
              You guessed {score} countries out of {WORLD_MAP_COUNTRY_COUNT} in{' '}
              {formatGameOverElapsed(durationMs - remainingMs)}. Great job!
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
