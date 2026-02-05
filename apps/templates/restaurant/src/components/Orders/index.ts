export { default as OrdersDefault } from "./OrdersDefault.astro";

export const ordersVariants = {
  default: "OrdersDefault",
} as const;

export type OrdersVariant = keyof typeof ordersVariants;
