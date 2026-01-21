// Footer variants export
export { default as FooterFull } from './FooterFull.astro';
export { default as FooterMinimal } from './FooterMinimal.astro';
export { default as FooterCentered } from './FooterCentered.astro';

export const footerVariants = {
  full: 'FooterFull',
  minimal: 'FooterMinimal',
  centered: 'FooterCentered',
} as const;

export type FooterVariant = keyof typeof footerVariants;
