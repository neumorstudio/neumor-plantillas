// Features variants export
export { default as FeaturesCards } from './FeaturesCards.astro';
export { default as FeaturesIcons } from './FeaturesIcons.astro';
export { default as FeaturesBanner } from './FeaturesBanner.astro';
export { default as FeatureCard } from './FeatureCard.astro';

export const featuresVariants = {
  cards: 'FeaturesCards',
  icons: 'FeaturesIcons',
  banner: 'FeaturesBanner',
} as const;

export type FeaturesVariant = keyof typeof featuresVariants;
