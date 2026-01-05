// Classes variants export
export { default as ClassesTabs } from './ClassesTabs.astro';
export { default as ClassesGrid } from './ClassesGrid.astro';
export { default as ClassesList } from './ClassesList.astro';
export { default as ClassesCarousel } from './ClassesCarousel.astro';

export const classesVariants = {
  tabs: 'ClassesTabs',
  grid: 'ClassesGrid',
  list: 'ClassesList',
  carousel: 'ClassesCarousel',
} as const;

export type ClassesVariant = keyof typeof classesVariants;
