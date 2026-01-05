// Products variants export
export { default as ProductsTabs } from './ProductsTabs.astro';
export { default as ProductsGrid } from './ProductsGrid.astro';
export { default as ProductsList } from './ProductsList.astro';
export { default as ProductsCarousel } from './ProductsCarousel.astro';

export const productsVariants = {
  tabs: 'ProductsTabs',
  grid: 'ProductsGrid',
  list: 'ProductsList',
  carousel: 'ProductsCarousel',
} as const;

export type ProductsVariant = keyof typeof productsVariants;
