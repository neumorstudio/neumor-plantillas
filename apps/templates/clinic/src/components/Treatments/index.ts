// Treatments variants export
export { default as TreatmentsTabs } from './TreatmentsTabs.astro';
export { default as TreatmentsGrid } from './TreatmentsGrid.astro';
export { default as TreatmentsList } from './TreatmentsList.astro';
export { default as TreatmentsCarousel } from './TreatmentsCarousel.astro';

export const treatmentsVariants = {
  tabs: 'TreatmentsTabs',
  grid: 'TreatmentsGrid',
  list: 'TreatmentsList',
  carousel: 'TreatmentsCarousel',
} as const;

export type TreatmentsVariant = keyof typeof treatmentsVariants;
