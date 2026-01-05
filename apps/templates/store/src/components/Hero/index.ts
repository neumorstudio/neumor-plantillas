// Hero variants export
export { default as HeroClassic } from './HeroClassic.astro';
export { default as HeroModern } from './HeroModern.astro';
export { default as HeroBold } from './HeroBold.astro';
export { default as HeroMinimal } from './HeroMinimal.astro';

export const heroVariants = {
  classic: 'HeroClassic',
  modern: 'HeroModern',
  bold: 'HeroBold',
  minimal: 'HeroMinimal',
} as const;

export type HeroVariant = keyof typeof heroVariants;
