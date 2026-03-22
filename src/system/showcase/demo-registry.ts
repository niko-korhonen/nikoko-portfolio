import AnchoredToastSection from './sections/AnchoredToastSection.astro';
import BadgeSection from './sections/BadgeSection.astro';
import ButtonDropdownSection from './sections/ButtonDropdownSection.astro';
import ButtonIconSection from './sections/ButtonIconSection.astro';
import ButtonSection from './sections/ButtonSection.astro';
import ColorsSection from './sections/ColorsSection.astro';
import ElevatedPanelSection from './sections/ElevatedPanelSection.astro';
import IconSection from './sections/IconSection.astro';
import ItemSection from './sections/ItemSection.astro';
import LayoutSection from './sections/LayoutSection.astro';
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
  badge: BadgeSection,
  toggle: ToggleSection,
  'segment-control': SegmentControlSection,
  radio: RadioSection,
  'text-field': TextFieldSection,
  tooltip: TooltipSection,
  'anchored-toast': AnchoredToastSection,
  'modal-dialog': ModalDialogSection,
  item: ItemSection,
  'elevated-panel': ElevatedPanelSection,
} as const;

export type DemoSlug = keyof typeof demoRegistry;
