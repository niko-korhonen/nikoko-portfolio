import { useEffect, useRef } from 'preact/hooks';
import Matter from 'matter-js';

/** Intrinsic SVG dimensions from each asset (for sprite + collider fit). */
const BADGES = [
  { src: '/badge-graphics/rain-1.svg', w: 116, h: 120 },
  { src: '/badge-graphics/rain-2.svg', w: 146, h: 90 },
  { src: '/badge-graphics/rain-3.svg', w: 110, h: 110 },
  { src: '/badge-graphics/rain-4.svg', w: 150, h: 75 },
  { src: '/badge-graphics/rain-5.svg', w: 120, h: 120 },
  { src: '/badge-graphics/rain-6.svg', w: 150, h: 100 },
  { src: '/badge-graphics/rain-7.svg', w: 130, h: 130 },
  { src: '/badge-graphics/rain-8.svg', w: 150, h: 110 },
  { src: '/badge-graphics/rain-9.svg', w: 120, h: 110 },
  { src: '/badge-graphics/rain-10.svg', w: 172, h: 110 },
  { src: '/badge-graphics/rain-11.svg', w: 120, h: 120 },
  { src: '/badge-graphics/rain-12.svg', w: 120, h: 120 },
  { src: '/badge-graphics/rain-13.svg', w: 111, h: 120 },
] as const;

/** Larger badges on S/M viewports; L+ approaches a modest cap. */
function viewportScale(containerWidth: number) {
  const linear = containerWidth / 880;
  let s = linear;
  if (containerWidth < 600) {
    s = linear * 1.32;
  } else if (containerWidth < 1024) {
    s = linear * 1.12;
  }
  return Math.min(1.3, Math.max(0.58, s));
}

function badgeDisplaySize(asset: (typeof BADGES)[number], scale: number, containerWidth: number) {
  let dimBoost = 1;
  if (containerWidth < 600) dimBoost = 1.18;
  else if (containerWidth < 1024) dimBoost = 1.06;
  const maxDim = 108 * scale * dimBoost;
  const k = maxDim / Math.max(asset.w, asset.h);
  return { w: asset.w * k, h: asset.h * k };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function LandingBadgePhysics() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const Runner = Matter.Runner;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Body = Matter.Body;
    const Composite = Matter.Composite;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;
    const Events = Matter.Events;

    let width = Math.max(2, root.clientWidth || window.innerWidth);
    let height = Math.max(2, root.clientHeight || window.innerHeight);
    let scale = viewportScale(width);

    const engine = Engine.create({ enableSleeping: true });
    engine.gravity.x = 0;
    engine.gravity.y = 0;

    const render = Render.create({
      element: root,
      engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        /** Matter default `showSleeping: true` draws resting bodies at 50% opacity; keep sprites fully opaque. */
        showSleeping: false,
        pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
      },
    });

    const wallThickness = 48;
    let wallBodies: Matter.Body[] = [];
    let badgeBodies: Matter.Body[] = [];

    function createWalls(w: number, h: number) {
      const t = wallThickness;
      const wallOpts: Matter.IBodyDefinition = {
        isStatic: true,
        render: { visible: false },
        friction: 0.06,
        restitution: 0.12,
        label: 'wall',
      };
      return [
        Bodies.rectangle(w / 2, -t / 2, w + t * 2, t, wallOpts),
        Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, wallOpts),
        Bodies.rectangle(-t / 2, h / 2, t, h + t * 2, wallOpts),
        Bodies.rectangle(w + t / 2, h / 2, t, h + t * 2, wallOpts),
      ];
    }

    function createBadges(w: number, h: number, s: number) {
      const list = shuffle([...BADGES]);
      const n = list.length;
      const cx = w / 2;
      const cy = h / 2;
      const spawnR = Math.min(w, h) * 0.055;
      const burstSpeed = 9 + Math.min(w, h) * 0.006;

      const bodies = list.map((asset, i) => {
        const angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.05;
        const { w: bw, h: bh } = badgeDisplaySize(asset, s, w);
        const x = cx + Math.cos(angle) * spawnR;
        const y = cy + Math.sin(angle) * spawnR;
        const chamfer = Math.min(bw, bh) * 0.14;
        const body = Bodies.rectangle(x, y, bw, bh, {
          chamfer: { radius: chamfer },
          restitution: 0.22,
          friction: 0.06,
          frictionAir: 0.016,
          density: 0.0018,
          label: 'badge',
          render: {
            sprite: {
              texture: asset.src,
              xScale: bw / asset.w,
              yScale: bh / asset.h,
            },
          },
        });
        (body as Matter.Body & { plugin: { asset: (typeof BADGES)[number] } }).plugin = { asset };
        Body.setVelocity(body, {
          x: Math.cos(angle) * burstSpeed,
          y: Math.sin(angle) * burstSpeed,
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
        return body;
      });

      return bodies;
    }

    wallBodies = createWalls(width, height);
    badgeBodies = createBadges(width, height, scale);
    World.add(engine.world, wallBodies);
    World.add(engine.world, badgeBodies);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.22,
        damping: 0.08,
        render: { visible: false },
      },
    });
    mouseConstraint.collisionFilter.mask = 0xffffffff;
    World.add(engine.world, mouseConstraint);

    render.mouse = mouse;

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    /** Last pointer velocity for toss (Matter.Mouse has no velocity field). */
    let dragPrev = { x: 0, y: 0, t: 0 };
    let releaseVx = 0;
    let releaseVy = 0;
    const onStartDrag = () => {
      dragPrev = { x: mouse.position.x, y: mouse.position.y, t: performance.now() };
      releaseVx = 0;
      releaseVy = 0;
    };
    const onMouseMove = () => {
      const t = performance.now();
      const dt = Math.max(1, t - dragPrev.t) / 1000;
      releaseVx = (mouse.position.x - dragPrev.x) / dt;
      releaseVy = (mouse.position.y - dragPrev.y) / dt;
      dragPrev = { x: mouse.position.x, y: mouse.position.y, t };
    };
    const onEndDrag = () => {
      const b = mouseConstraint.body;
      if (!b || b.label !== 'badge') return;
      const k = 0.12;
      const cap = 28;
      Body.setVelocity(b, {
        x: Math.max(-cap, Math.min(cap, releaseVx * k)),
        y: Math.max(-cap, Math.min(cap, releaseVy * k)),
      });
    };
    Events.on(mouseConstraint, 'startdrag', onStartDrag);
    Events.on(mouseConstraint, 'mousemove', onMouseMove);
    Events.on(mouseConstraint, 'enddrag', onEndDrag);

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (!root) return;
      const nw = root.clientWidth;
      const nh = root.clientHeight;
      if (nw < 1 || nh < 1) return;

      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        const prevScale = scale;
        width = nw;
        height = nh;
        scale = viewportScale(width);
        const factor = scale / prevScale;

        Render.setSize(render, width, height);
        render.options.width = width;
        render.options.height = height;
        render.canvas.style.width = `${width}px`;
        render.canvas.style.height = `${height}px`;

        wallBodies.forEach((w) => Composite.remove(engine.world, w));
        wallBodies = createWalls(width, height);
        Composite.add(engine.world, wallBodies);

        badgeBodies.forEach((b) => {
          const plug = (b as Matter.Body & { plugin?: { asset: (typeof BADGES)[number] } }).plugin;
          if (!plug?.asset) return;
          Body.scale(b, factor, factor, b.position);
          const { w: bw, h: bh } = badgeDisplaySize(plug.asset, scale, width);
          if (b.render?.sprite) {
            b.render.sprite.xScale = bw / plug.asset.w;
            b.render.sprite.yScale = bh / plug.asset.h;
          }
          const maxX = width - wallThickness;
          const maxY = height - wallThickness;
          Body.setPosition(b, {
            x: Math.min(maxX, Math.max(wallThickness, b.position.x)),
            y: Math.min(maxY, Math.max(wallThickness, b.position.y)),
          });
        });
      }, 120);
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    return () => {
      ro.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
      Events.off(mouseConstraint, 'startdrag', onStartDrag);
      Events.off(mouseConstraint, 'mousemove', onMouseMove);
      Events.off(mouseConstraint, 'enddrag', onEndDrag);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas?.parentNode) {
        render.canvas.remove();
      }
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      class="landing-badge-physics"
      style={{
        position: 'absolute',
        inset: 0,
        touchAction: 'none',
        overflow: 'hidden',
      }}
      role="application"
      aria-label="Interactive physics playground: drag and toss the shapes"
    />
  );
}
