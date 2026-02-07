"use client";

/**
 * RestaurantMobileProvider - Contexto para guard central
 * 
 * Provee el estado de isRestaurantMobile a toda la aplicación
 * mediante React Context, evitando prop drilling.
 * 
 * Usado por:
 * - RestaurantBottomNav
 * - Adaptaciones en ReservasClient (vista móvil simplificada)
 * - Adaptaciones en CalendarioClient (vista móvil simplificada)
 */

import { createContext, useContext, ReactNode } from "react";
import { useRestaurantMobile } from "./useRestaurantMobile";

interface RestaurantMobileContextValue {
  /** true si businessType === "restaurant" AND viewport < 1024px */
  isRestaurantMobile: boolean;
  /** true solo para verificación de tipo de negocio */
  isRestaurant: boolean;
  /** true solo para verificación de viewport */
  isMobileViewport: boolean;
}

const RestaurantMobileContext = createContext<RestaurantMobileContextValue | null>(null);

interface RestaurantMobileProviderProps {
  children: ReactNode;
  businessType: string;
}

export function RestaurantMobileProvider({ children, businessType }: RestaurantMobileProviderProps) {
  const { isRestaurantMobile, isRestaurant, isMobileViewport } = useRestaurantMobile({ businessType });

  return (
    <RestaurantMobileContext.Provider
      value={{
        isRestaurantMobile,
        isRestaurant,
        isMobileViewport,
      }}
    >
      {children}
    </RestaurantMobileContext.Provider>
  );
}

/**
 * Hook para consumir el contexto de RestaurantMobile
 * Debe usarse dentro de RestaurantMobileProvider
 */
export function useRestaurantMobileContext(): RestaurantMobileContextValue {
  const context = useContext(RestaurantMobileContext);
  if (!context) {
    throw new Error(
      "useRestaurantMobileContext debe usarse dentro de RestaurantMobileProvider"
    );
  }
  return context;
}

/**
 * Hook seguro que retorna valores por defecto si no hay provider
 * Útil para componentes que pueden usarse dentro o fuera del provider
 */
export function useRestaurantMobileSafe(): RestaurantMobileContextValue {
  const context = useContext(RestaurantMobileContext);
  if (!context) {
    return {
      isRestaurantMobile: false,
      isRestaurant: false,
      isMobileViewport: false,
    };
  }
  return context;
}
