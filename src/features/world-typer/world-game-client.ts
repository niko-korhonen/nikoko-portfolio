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
  startModal: HTMLDialogElement;
  pauseModal: HTMLDialogElement;
  overModal: HTMLDialogElement;
};

export function initWorldGame(dom: WorldGameDom): () => void {
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

  function onTimerTick(remainingMs: number): void {
    setTimerLabel(formatTimer(remainingMs));
    if (remainingMs <= 0 && phase === 'playing') {
      timer.dispose();
      setPhase('ended');
      dom.overModal.showModal();
    }
  }

  function startGame(): void {
    guessedIds.clear();
    mapApi?.resetVisuals();
    setScorePillValue(dom.scorePill, 0, { animate: false });
    setPhase('playing');
    setTimerLabel(formatTimer(15 * 60 * 1000));
    timer.start(onTimerTick);
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
  }

  function giveUp(): void {
    timer.dispose();
    setPhase('ended');
    dom.pauseModal.close();
    dom.overModal.showModal();
  }

  function enterReview(): void {
    setPhase('review');
    setTimerLabel('Play again');
    mapApi?.applyReview(guessedIds);
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
    dom.guessInput.value = '';
    const key = normalizeGuessName(raw);
    if (!key) return;
    const id = mapApi.matchNormalized(key);
    if (!id) return;
    if (guessedIds.has(id)) return;
    guessedIds.add(id);
    mapApi.markGuessed(id);
    updateScorePill();
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

  dom.pauseModal.querySelector('[data-world-resume]')?.addEventListener('click', () => {
    dom.pauseModal.close();
  });

  dom.pauseModal.querySelector('[data-world-give-up]')?.addEventListener('click', () => {
    giveUp();
  });

  dom.overModal.addEventListener('close', () => {
    if (phase === 'ended') {
      enterReview();
    }
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
    dom.startModal.showModal();
  });

  return () => {
    disposed = true;
    timer.dispose();
    mapApi?.dispose();
    mapApi = null;
  };
}
