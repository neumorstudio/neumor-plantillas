// Services variants export
export { default as ServicesTabs } from './ServicesTabs.astro';
export { default as ServicesGrid } from './ServicesGrid.astro';
export { default as ServicesList } from './ServicesList.astro';
export { default as ServicesCarousel } from './ServicesCarousel.astro';

export const servicesVariants = {
  tabs: 'ServicesTabs',
  grid: 'ServicesGrid',
  list: 'ServicesList',
  carousel: 'ServicesCarousel',
} as const;

export type ServicesVariant = keyof typeof servicesVariants;
