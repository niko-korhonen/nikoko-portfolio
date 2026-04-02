import type { ComponentChildren } from 'preact';
import { DsIcon } from './DsIcon';
import { MenuDropdown } from './MenuDropdown';
import type { MenuItem, MenuPlacement, MenuAlign } from './MenuDropdown';

export type ButtonDropdownVariant = 'fill' | 'outline' | 'subtle' | 'ghost' | 'ghost-inverse';

export interface ButtonDropdownProps {
  variant?: ButtonDropdownVariant;
  size?: 'l' | 'm' | 's';
  block?: boolean;
  disabled?: boolean;
  items: MenuItem[];
  placement?: MenuPlacement;
  align?: MenuAlign;
  onSelect?: (id: string) => void;
  'aria-label': string;
  children: ComponentChildren;
}

export function ButtonDropdown(props: ButtonDropdownProps) {
  const {
    variant = 'fill',
    size = 'm',
    block = false,
    disabled = false,
    items,
    placement,
    align,
    onSelect,
    'aria-label': ariaLabel,
    children,
  } = props;

  const v =
    variant === 'ghost-inverse'
      ? 'ghost-inverse'
      : variant === 'ghost'
        ? 'ghost'
        : variant;

  const iconSize = size === 'l' ? 'xl' : size === 'm' ? 'l' : 'm';

  const cls = [
    'ds-btn',
    `ds-btn--${v}`,
    `ds-btn--${size}`,
    block && 'ds-btn--block',
    'ds-btn-dropdown',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <MenuDropdown
      aria-label={ariaLabel}
      trigger={
        <>
          <span class="ds-btn__label">{children}</span>
          <DsIcon name="chevron-down-outlined" size={iconSize} />
        </>
      }
      triggerClass={cls}
      disabled={disabled}
      items={items}
      placement={placement}
      align={align}
      onSelect={onSelect}
    />
  );
}

export type { MenuItem, MenuPlacement, MenuAlign } from './MenuDropdown';
