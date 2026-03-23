import AnchoredToastSection from './sections/AnchoredToastSection.astro';
import BadgeSection from './sections/BadgeSection.astro';
import ButtonDropdownSection from './sections/ButtonDropdownSection.astro';
import ButtonIconSection from './sections/ButtonIconSection.astro';
import ButtonSection from './sections/ButtonSection.astro';
import ColorsSection from './sections/ColorsSection.astro';
import ElevatedPanelSection from './sections/ElevatedPanelSection.astro';
import IconSection from './sections/IconSection.astro';
import ItemActionSection from './sections/ItemActionSection.astro';
import ItemDividerSection from './sections/ItemDividerSection.astro';
import ItemHeaderSection from './sections/ItemHeaderSection.astro';
import ItemStaticSection from './sections/ItemStaticSection.astro';
import LayoutSection from './sections/LayoutSection.astro';
import MenuDropdownSection from './sections/MenuDropdownSection.astro';
import ModalDialogSection from './sections/ModalDialogSection.astro';
import RadioSection from './sections/RadioSection.astro';
import RadiusSection from './sections/RadiusSection.astro';
import SegmentControlSection from './sections/SegmentControlSection.astro';
import ShadowsSection from './sections/ShadowsSection.astro';
import SpacingSection from './sections/SpacingSection.astro';
import TextFieldSection from './sections/TextFieldSection.astro';
import ToggleSection from './sections/ToggleSection.astro';
import TooltipSection from './sections/TooltipSection.astro';
import TypographySection from './sections/TypographySection.astro';

export const demoRegistry = {
  colors: ColorsSection,
  typography: TypographySection,
  radius: RadiusSection,
  icon: IconSection,
  spacing: SpacingSection,
  layout: LayoutSection,
  shadows: ShadowsSection,
  button: ButtonSection,
  'button-icon': ButtonIconSection,
  'button-dropdown': ButtonDropdownSection,
  'menu-dropdown': MenuDropdownSection,
  badge: BadgeSection,
  toggle: ToggleSection,
  'segment-control': SegmentControlSection,
  radio: RadioSection,
  'text-field': TextFieldSection,
  tooltip: TooltipSection,
  'anchored-toast': AnchoredToastSection,
  'modal-dialog': ModalDialogSection,
  'item-action': ItemActionSection,
  'item-static': ItemStaticSection,
  'item-divider': ItemDividerSection,
  'item-header': ItemHeaderSection,
  'elevated-panel': ElevatedPanelSection,
} as const;

export type DemoSlug = keyof typeof demoRegistry;
