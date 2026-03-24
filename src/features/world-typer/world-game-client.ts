import { enqueueAnchoredToast, initAnchoredToasts } from '../../system/components/anchored-toast.ts';
import { setScorePillValue } from '../../system/components/score-pill-counter.ts';
import type { GamePhase } from './game-state.ts';
import { formatTimer, GameTimer } from './game-state.ts';
import { normalizeGuessName } from './guess-normalize.ts';
import { createWorldMap, type WorldMapApi } from './world-map-adapter.ts';

export type WorldGameDom = {
  mapHost: HTMLElement;
  timerBtn: HTMLButtonElement;
  scorePill: HTMLElement;
  guessInput: HTMLInputElement;
  guessWrap: HTMLElement;
  guessToastRoot: HTMLElement;
  startModal: HTMLDialogElement;
  pauseModal: HTMLDialogElement;
  overModal: HTMLDialogElement;
};

export function initWorldGame(dom: WorldGameDom): () => void {
  initAnchoredToasts();
  const timer = new GameTimer();
  let phase: GamePhase = 'preStart';
  const guessedIds = new Set<string>();
  let mapApi: WorldMapApi | null = null;

  function setTimerLabel(text: string): void {
    const label = dom.timerBtn.querySelector('.ui-btn__label');
    if (label) label.textContent = text;
  }

  function setPhase(next: GamePhase): void {
    phase = next;
    mapApi?.syncPhase(next);
    if (next === 'playing') {
      dom.timerBtn.disabled = false;
      dom.guessInput.disabled = false;
      dom.guessWrap.style.display = '';
    } else if (next === 'paused') {
      dom.timerBtn.disabled = false;
      dom.guessInput.disabled = true;
    } else if (next === 'preStart') {
      dom.timerBtn.disabled = true;
      dom.guessInput.disabled = true;
      dom.guessWrap.style.display = '';
    } else if (next === 'ended') {
      dom.timerBtn.disabled = true;
      dom.guessInput.disabled = true;
    } else if (next === 'review') {
      dom.timerBtn.disabled = false;
      dom.guessInput.disabled = true;
      dom.guessWrap.style.display = 'none';
    }
  }

  function updateScorePill(): void {
    if (!mapApi) return;
    setScorePillValue(dom.scorePill, guessedIds.size, { animate: true });
  }

  const gameOverDescriptionEl = document.getElementById('world-game-over-description');

  function updateGameOverDescription(): void {
    if (!gameOverDescriptionEl) return;
    const n = guessedIds.size;
    const lead =
      n === 1
        ? 'Well done, you made 1 correct guess!'
        : `Well done, you made ${n} correct guesses.`;
    gameOverDescriptionEl.textContent = `${lead} Review the map or jump straight into another round.`;
  }

  function showGameOverModal(): void {
    updateGameOverDescription();
    dom.overModal.showModal();
  }

  function onTimerTick(remainingMs: number): void {
    setTimerLabel(formatTimer(remainingMs));
    if (remainingMs <= 0 && phase === 'playing') {
      timer.dispose();
      setPhase('ended');
      showGameOverModal();
    }
  }

  function startGame(): void {
    guessedIds.clear();
    mapApi?.resetVisuals();
    setScorePillValue(dom.scorePill, 0, { animate: false });
    setPhase('playing');
    setTimerLabel(formatTimer(15 * 60 * 1000));
    timer.start(onTimerTick);
    dom.guessInput.focus();
  }

  function pauseGame(): void {
    if (phase !== 'playing') return;
    timer.pause();
    setPhase('paused');
    dom.pauseModal.showModal();
  }

  function resumeGame(): void {
    if (phase !== 'paused') return;
    setPhase('playing');
    timer.resume(onTimerTick);
    dom.guessInput.focus();
  }

  function giveUp(): void {
    timer.dispose();
    setPhase('ended');
    dom.pauseModal.close();
    showGameOverModal();
  }

  function enterReview(): void {
    mapApi?.applyReview(guessedIds);
    setTimerLabel('Play again');
    setPhase('review');
  }

  function resetForRestart(): void {
    guessedIds.clear();
    mapApi?.resetVisuals();
    setScorePillValue(dom.scorePill, 0, { animate: false });
    setTimerLabel('15:00');
    setPhase('preStart');
    dom.startModal.showModal();
  }

  function onGuessSubmit(): void {
    if (phase !== 'playing' || !mapApi) return;
    const raw = dom.guessInput.value;
    const key = normalizeGuessName(raw);
    if (!key) {
      dom.guessInput.value = '';
      return;
    }
    const id = mapApi.matchNormalized(key);
    if (!id) {
      dom.guessInput.value = '';
      return;
    }
    if (guessedIds.has(id)) {
      enqueueAnchoredToast(dom.guessToastRoot, 'neutral', 'Already guessed');
      return;
    }
    guessedIds.add(id);
    mapApi.markGuessed(id);
    updateScorePill();
    enqueueAnchoredToast(dom.guessToastRoot, 'success', 'Correct');
    dom.guessInput.value = '';
  }

  const onTimerClick = () => {
    if (phase === 'review') {
      resetForRestart();
      return;
    }
    if (phase === 'playing') {
      pauseGame();
    }
  };

  dom.timerBtn.addEventListener('click', onTimerClick);

  dom.guessInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onGuessSubmit();
    }
  });

  /** When the current text is a full normalized country name, submit without Enter (new or duplicate). */
  dom.guessInput.addEventListener('input', () => {
    if (phase !== 'playing' || !mapApi) return;
    const key = normalizeGuessName(dom.guessInput.value);
    if (!key) return;
    const id = mapApi.matchNormalized(key);
    if (!id) return;
    onGuessSubmit();
  });

  const startBtn = document.getElementById('world-game-start-btn');
  startBtn?.addEventListener('click', () => {
    dom.startModal.close();
    startGame();
  });

  dom.pauseModal.addEventListener('close', () => {
    if (phase === 'paused') {
      resumeGame();
    }
  });

  document.getElementById('world-game-resume-btn')?.addEventListener('click', () => {
    dom.pauseModal.close();
  });

  document.getElementById('world-game-give-up-btn')?.addEventListener('click', () => {
    giveUp();
  });

  /** When true, closing the game-over modal starts a new round instead of map review. */
  let skipOverModalReview = false;

  dom.overModal.addEventListener('close', () => {
    if (phase !== 'ended') return;
    if (skipOverModalReview) {
      skipOverModalReview = false;
      startGame();
      return;
    }
    enterReview();
  });

  document.getElementById('world-game-over-play-again-btn')?.addEventListener('click', () => {
    skipOverModalReview = true;
    dom.overModal.close();
  });

  let disposed = false;
  createWorldMap(dom.mapHost, (api) => {
    if (disposed) {
      api.dispose();
      return;
    }
    mapApi = api;
    const trailing = dom.scorePill.querySelector('.ui-score-pill__trailing');
    if (trailing) {
      trailing.textContent = `of ${api.totalGuessable}`;
    }
    setScorePillValue(dom.scorePill, 0, { animate: false });
    api.syncPhase(phase);
  });

  // Start modal must open without waiting for map `onReady`. If `showModal()` only runs in the map
  // callback, a missed `datavalidated` / never-ready map leaves the dialog closed forever (native
  // `<dialog>` stays `display: none` until `[open]` from `showModal()` — see ModalDialog + components.css).
  requestAnimationFrame(() => {
    if (disposed || dom.startModal.open) return;
    dom.startModal.showModal();
  });

  setPhase('preStart');

  const gameRoot = dom.mapHost.parentElement;
  const vv = window.visualViewport;
  function syncGameToVisualViewport(): void {
    if (!vv || !gameRoot?.classList.contains('world-game')) return;
    gameRoot.style.setProperty('--world-game-vv-top', `${vv.offsetTop}px`);
    gameRoot.style.setProperty('--world-game-vv-left', `${vv.offsetLeft}px`);
    gameRoot.style.setProperty('--world-game-vv-width', `${vv.width}px`);
    gameRoot.style.setProperty('--world-game-vv-height', `${vv.height}px`);
  }
  let onViewportChange: (() => void) | undefined;
  if (vv && gameRoot?.classList.contains('world-game')) {
    onViewportChange = () => syncGameToVisualViewport();
    vv.addEventListener('resize', onViewportChange);
    vv.addEventListener('scroll', onViewportChange);
    window.addEventListener('resize', onViewportChange);
    syncGameToVisualViewport();
  }

  return () => {
    disposed = true;
    if (vv && onViewportChange) {
      vv.removeEventListener('resize', onViewportChange);
      vv.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
    }
    timer.dispose();
    mapApi?.dispose();
    mapApi = null;
  };
}
