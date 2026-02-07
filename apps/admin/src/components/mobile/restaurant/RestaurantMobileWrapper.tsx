"use client";

/**
 * Restaurant Mobile Wrapper - Client Component
 * 
 * Wrapper cliente que:
 * 1. Provee el contexto de RestaurantMobile a toda la app
 * 2. Renderiza la bottom navigation SOLO para restaurant en mobile
 * 
 * Este es el único punto de entrada para las adaptaciones mobile restaurant.
 * 
 * IMPORTANTE: Este componente es específico para restaurant y mobile.
 */

import { RestaurantMobileProvider } from "./RestaurantMobileProvider";
import { RestaurantBottomNav } from "./RestaurantBottomNav";

interface RestaurantMobileWrapperProps {
  businessType: string;
}

export function RestaurantMobileWrapper({ businessType }: RestaurantMobileWrapperProps) {
  // Solo renderizar para restaurant
  if (businessType !== "restaurant") {
    return null;
  }

  return (
    <RestaurantMobileProvider businessType={businessType}>
      <RestaurantBottomNav />
    </RestaurantMobileProvider>
  );
}

/**
 * Helper para determinar si se debe aplicar padding extra al main-content
 * por la presencia de la bottom nav de restaurant.
 * 
 * Usado en Server Components (DashboardLayout)
 */
export function hasRestaurantBottomNav(businessType: string | null | undefined): boolean {
  return businessType === "restaurant";
}
