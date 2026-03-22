/**
 * Full-viewport rain backdrop: Matter.js physics + DOM SVGs.
 * Tune constants below for feel; spawn order is fixed for art direction.
 */
import Matter from 'matter-js';

const {
  Engine,
  Runner,
  Bodies,
  Body,
  Composite,
  Mouse,
  MouseConstraint,
  Events,
} = Matter;

/** Physics / motion — adjust here when iterating */
const PHYS = {
  gravityY: 0.95,
  friction: 0.48,
  frictionStatic: 0.55,
  restitution: 0.14,
  frictionAir: 0.014,
  /** Mouse / touch drag */
  dragStiffness: 0.28,
  dragDamping: 0.22,
  /** Delay between each new piece (ms) */
  spawnGapMs: 380,
  /** Horizontal spawn jitter (fraction of usable width, 0–0.5) */
  spawnJitter: 0.12,
  /** Initial downward nudge so bodies wake */
  spawnVelocityY: 1.2,
  /** Angular velocity range at spawn (rad/frame-ish scale via engine) */
  spinRange: 0.018,
  /** Min ms after last spawn before ceiling can appear (lets physics register bounds) */
  ceilingMinDelayMs: 120,
};

const BOUNDARY_THICKNESS = 80;

const ASSETS = [
  { id: 'rain-shape-circle', src: '/rain/rain-shape-circle.svg', w: 80, h: 80, shape: 'circle' as const },
  { id: 'rain-text-tasteful', src: '/rain/rain-text-tasteful.svg', w: 216, h: 78, shape: 'rect' as const },
  { id: 'rain-shape-star', src: '/rain/rain-shape-star.svg', w: 100, h: 100, shape: 'circle' as const },
  { id: 'rain-text-versatile', src: '/rain/rain-text-versatile.svg', w: 233, h: 78, shape: 'rect' as const },
  { id: 'rain-shape-sharpy', src: '/rain/rain-shape-sharpy.svg', w: 100, h: 100, shape: 'rect' as const },
  { id: 'rain-text-designer', src: '/rain/rain-text-designer.svg', w: 244, h: 78, shape: 'rect' as const },
  { id: 'rain-shape-blurb', src: '/rain/rain-shape-blurb.svg', w: 87, h: 87, shape: 'circle' as const },
  { id: 'rain-text-klarna', src: '/rain/rain-text-klarna.svg', w: 184, h: 78, shape: 'rect' as const },
  { id: 'rain-shape-half', src: '/rain/rain-shape-half.svg', w: 100, h: 50, shape: 'rect' as const },
  { id: 'rain-text-karma', src: '/rain/rain-text-karma.svg', w: 190, h: 78, shape: 'rect' as const },
  { id: 'rain-shape-egg', src: '/rain/rain-shape-egg.svg', w: 70, h: 100, shape: 'rect' as const },
  { id: 'rain-text-epidemic', src: '/rain/rain-text-epidemic.svg', w: 258, h: 78, shape: 'rect' as const },
  { id: 'rain-shape-block', src: '/rain/rain-shape-block.svg', w: 130, h: 35, shape: 'rect' as const },
];

type Item = {
  body: Matter.Body;
  el: HTMLImageElement;
  def: (typeof ASSETS)[number];
  scaleUsed: number;
};

function displayScale(viewW: number): number {
  const cap = Math.min(viewW * 0.88, 300);
  return cap / 260;
}

function bodyOpts(): Matter.IBodyDefinition {
  return {
    friction: PHYS.friction,
    frictionStatic: PHYS.frictionStatic,
    restitution: PHYS.restitution,
    frictionAir: PHYS.frictionAir,
  };
}

function createBody(
  def: (typeof ASSETS)[number],
  scale: number,
  x: number,
  y: number,
): Matter.Body {
  const w = def.w * scale;
  const h = def.h * scale;
  const opts = bodyOpts();
  if (def.shape === 'circle') {
    const r = (Math.min(w, h) / 2) * 0.48;
    return Bodies.circle(x, y, r, opts);
  }
  const chamfer = Math.min(10, Math.min(w, h) * 0.08);
  return Bodies.rectangle(x, y, w * 0.96, h * 0.96, { ...opts, chamfer: { radius: chamfer } });
}

function makeBoundaries(w: number, h: number): Matter.Body[] {
  const t = BOUNDARY_THICKNESS;
  const wallH = h * 2.5;
  const ground = Bodies.rectangle(w / 2, h + t / 2, w + t * 4, t, {
    isStatic: true,
    friction: 0.85,
    frictionStatic: 1,
    restitution: 0.05,
  });
  const left = Bodies.rectangle(-t / 2, h / 2, t, wallH, {
    isStatic: true,
    friction: 0.6,
    restitution: 0.02,
  });
  const right = Bodies.rectangle(w + t / 2, h / 2, t, wallH, {
    isStatic: true,
    friction: 0.6,
    restitution: 0.02,
  });
  return [ground, left, right];
}

/** Top slab just above the viewport; bottom edge at y=0. Added only after rain is done. */
function makeCeiling(w: number): Matter.Body {
  const t = BOUNDARY_THICKNESS;
  return Bodies.rectangle(w / 2, -t / 2, w + t * 4, t, {
    isStatic: true,
    friction: 0.55,
    frictionStatic: 0.65,
    restitution: 0.06,
  });
}

function syncTransform(body: Matter.Body, el: HTMLElement) {
  const { x, y } = body.position;
  el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${body.angle}rad)`;
}

function syncDom(items: Item[]) {
  for (const { body, el } of items) {
    syncTransform(body, el);
    if (!el.dataset.rainVisible) {
      el.dataset.rainVisible = 'true';
      el.style.opacity = '1';
    }
  }
}

export function initRainBackdrop(container: HTMLElement): void {
  if (typeof window === 'undefined') return;

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mqReduce.matches) return;

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = PHYS.gravityY;
  engine.gravity.scale = 0.001;

  const world = engine.world;
  let bounds = makeBoundaries(window.innerWidth, window.innerHeight);
  Composite.add(world, bounds);

  const items: Item[] = [];
  let ceilingAdded = false;
  let lastSpawnAt = 0;

  function refreshBounds() {
    for (const b of bounds) {
      Composite.remove(world, b);
    }
    const w = window.innerWidth;
    const h = window.innerHeight;
    bounds = makeBoundaries(w, h);
    Composite.add(world, bounds);
    if (ceilingAdded) {
      const ceil = makeCeiling(w);
      Composite.add(world, ceil);
      bounds.push(ceil);
    }
  }

  /** Ceiling only after full spawn + every piece's AABB is below y=0 (no rain blocked, no flick stuck above). */
  function tryAddCeiling() {
    if (ceilingAdded) return;
    if (items.length !== ASSETS.length) return;
    if (performance.now() - lastSpawnAt < PHYS.ceilingMinDelayMs) return;
    if (!items.every(({ body }) => body.bounds.min.y > 0)) return;
    ceilingAdded = true;
    const ceil = makeCeiling(window.innerWidth);
    Composite.add(world, ceil);
    bounds.push(ceil);
  }

  const mouse = Mouse.create(container);
  /** Must stay `1` for a plain div: bodies + DOM use CSS pixels. DPR scaling is for canvas render resolution. */
  mouse.pixelRatio = 1;

  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: PHYS.dragStiffness,
      damping: PHYS.dragDamping,
      render: { visible: false },
    },
  });
  Composite.add(world, mouseConstraint);

  const runner = Runner.create();
  Runner.run(runner, engine);

  const onAfterUpdate = () => {
    tryAddCeiling();
    syncDom(items);
  };
  Events.on(engine, 'afterUpdate', onAfterUpdate);

  function spawnOne(def: (typeof ASSETS)[number]) {
    const scale = displayScale(window.innerWidth);
    const vw = window.innerWidth;
    const dw = def.w * scale;
    const dh = def.h * scale;
    const margin = Math.max(24, dw * 0.55);
    const usable = vw - margin * 2;
    const jitter = (Math.random() - 0.5) * 2 * PHYS.spawnJitter * usable;
    const x = vw / 2 + jitter;
    const y = -dh - 40 - Math.random() * 60;

    const body = createBody(def, scale, x, y);
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 1.8,
      y: PHYS.spawnVelocityY,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 2 * PHYS.spinRange);

    const el = document.createElement('img');
    el.src = def.src;
    el.alt = '';
    el.draggable = false;
    el.className = 'rain-backdrop__piece';
    el.width = Math.round(dw);
    el.height = Math.round(dh);
    el.style.width = `${dw}px`;
    el.style.height = `${dh}px`;

    syncTransform(body, el);
    container.appendChild(el);
    Composite.add(world, body);
    items.push({ body, el, def, scaleUsed: scale });
    if (items.length === ASSETS.length) {
      lastSpawnAt = performance.now();
    }
  }

  let i = 0;
  const tick = () => {
    if (i >= ASSETS.length) return;
    spawnOne(ASSETS[i]);
    i += 1;
    if (i < ASSETS.length) {
      window.setTimeout(tick, PHYS.spawnGapMs);
    }
  };
  tick();

  const onResize = () => {
    refreshBounds();
    const newScale = displayScale(window.innerWidth);
    for (const item of items) {
      const { body, el, def, scaleUsed } = item;
      const f = newScale / scaleUsed;
      if (f !== 1 && Number.isFinite(f)) {
        Body.scale(body, f, f, body.position);
      }
      item.scaleUsed = newScale;
      const dw = def.w * newScale;
      const dh = def.h * newScale;
      el.style.width = `${dw}px`;
      el.style.height = `${dh}px`;
    }
  };

  window.addEventListener('resize', onResize, { passive: true });

  const stop = () => {
    window.removeEventListener('resize', onResize);
    Runner.stop(runner);
    Events.off(engine, 'afterUpdate', onAfterUpdate);
    Composite.clear(world, false);
    Engine.clear(engine);
    for (const { el } of items) el.remove();
  };

  window.addEventListener(
    'pagehide',
    () => {
      stop();
    },
    { once: true },
  );
}
