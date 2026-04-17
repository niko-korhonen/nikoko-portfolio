import { useEffect } from 'preact/hooks';
import { DsIcon } from '../ui/DsIcon';
import { MenuDropdown } from '../ui/MenuDropdown';

const THEMES = [
  'core',
  'moss',
  'mint',
  'lagoon',
  'leaf',
  'orchid',
  'indigo',
  'flamingo',
  'purple',
] as const;

function applyStoredScheme() {
  const stored = localStorage.getItem('color-scheme') ?? 'system';
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-color-scheme', stored);
    return;
  }
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.setAttribute('data-color-scheme', dark ? 'dark' : 'light');
}

function applyStoredTheme() {
  const t = localStorage.getItem('theme');
  if (t && THEMES.includes(t as (typeof THEMES)[number])) {
    document.documentElement.setAttribute('data-theme', t);
  } else {
    document.documentElement.setAttribute('data-theme', 'core');
  }
}

let schemeInitListenersAttached = false;

function ensureShowcaseSchemeInit() {
  if (schemeInitListenersAttached) return;
  schemeInitListenersAttached = true;

  applyStoredTheme();
  applyStoredScheme();
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    const stored = localStorage.getItem('color-scheme');
    if (stored && stored !== 'system') return;
    applyStoredScheme();
  };
  mq.addEventListener('change', onChange);
}

const schemeItems = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

const themeItems = THEMES.map((t) => ({
  id: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

interface MenuTooltipProps {
  tooltipLabel?: string;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  tooltipAlign?: 'start' | 'center' | 'end';
}

function ColorModeMenu(tooltip: MenuTooltipProps = {}) {
  return (
    <MenuDropdown
      aria-label="Color mode"
      trigger={<DsIcon name="sun-outlined" size="l" />}
      items={schemeItems}
      tooltipLabel={tooltip.tooltipLabel}
      tooltipPlacement={tooltip.tooltipPlacement}
      tooltipAlign={tooltip.tooltipAlign}
      onSelect={(id) => {
        if (id === 'system') {
          localStorage.setItem('color-scheme', 'system');
          applyStoredScheme();
          return;
        }
        localStorage.setItem('color-scheme', id);
        document.documentElement.setAttribute('data-color-scheme', id);
      }}
    />
  );
}

function ThemeMenu(tooltip: MenuTooltipProps = {}) {
  return (
    <MenuDropdown
      aria-label="Theme"
      trigger={<DsIcon name="color-palette-outlined" size="l" />}
      items={themeItems}
      tooltipLabel={tooltip.tooltipLabel}
      tooltipPlacement={tooltip.tooltipPlacement}
      tooltipAlign={tooltip.tooltipAlign}
      onSelect={(id) => {
        localStorage.setItem('theme', id);
        document.documentElement.setAttribute('data-theme', id);
      }}
    />
  );
}

/** Rail: mode + theme menus (single island). */
export function ShowcaseSchemeMenus() {
  useEffect(() => {
    ensureShowcaseSchemeInit();
  }, []);

  return (
    <>
      {ColorModeMenu({ tooltipLabel: 'Mode', tooltipPlacement: 'right', tooltipAlign: 'center' })}
      {ThemeMenu({ tooltipLabel: 'Theme', tooltipPlacement: 'right', tooltipAlign: 'center' })}
    </>
  );
}

/** Mobile bar 1/4: light/dark/system. */
export function ShowcaseColorModeMenu() {
  useEffect(() => {
    ensureShowcaseSchemeInit();
  }, []);

  return ColorModeMenu();
}

/** Mobile bar 2/4: theme palette. */
export function ShowcaseThemeMenu() {
  useEffect(() => {
    ensureShowcaseSchemeInit();
  }, []);

  return ThemeMenu();
}
