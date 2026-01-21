// Reviews variants export
export { default as ReviewsGrid } from './ReviewsGrid.astro';
export { default as ReviewsCarousel } from './ReviewsCarousel.astro';
export { default as ReviewsMinimal } from './ReviewsMinimal.astro';

export const reviewsVariants = {
  grid: 'ReviewsGrid',
  carousel: 'ReviewsCarousel',
  minimal: 'ReviewsMinimal',
} as const;

export type ReviewsVariant = keyof typeof reviewsVariants;
