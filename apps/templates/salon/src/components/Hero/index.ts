// Hero variants export - All 6 variants: classic, modern, bold, minimal, fullscreen, split
export { default as HeroClassic } from './HeroClassic.astro';
export { default as HeroModern } from './HeroModern.astro';
export { default as HeroBold } from './HeroBold.astro';
export { default as HeroMinimal } from './HeroMinimal.astro';
export { default as HeroFullscreen } from './HeroFullscreen.astro';
export { default as HeroSplit } from './HeroSplit.astro';

export const heroVariants = {
  classic: 'HeroClassic',
  modern: 'HeroModern',
  bold: 'HeroBold',
  minimal: 'HeroMinimal',
  fullscreen: 'HeroFullscreen',
  split: 'HeroSplit',
} as const;

export type HeroVariant = keyof typeof heroVariants;
