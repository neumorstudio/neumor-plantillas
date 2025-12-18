// Menu variants export
export { default as MenuTabs } from './MenuTabs.astro';
export { default as MenuGrid } from './MenuGrid.astro';
export { default as MenuList } from './MenuList.astro';
export { default as MenuCarousel } from './MenuCarousel.astro';

export const menuVariants = {
  tabs: 'MenuTabs',
  grid: 'MenuGrid',
  list: 'MenuList',
  carousel: 'MenuCarousel',
} as const;

export type MenuVariant = keyof typeof menuVariants;
