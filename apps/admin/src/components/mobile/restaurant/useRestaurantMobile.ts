"use client";

/**
 * useRestaurantMobile - Guard Central
 * 
 * Hook único para determinar si estamos en contexto RESTAURANT + MOBILE.
 * 
 * Definición:
 * - businessType === "restaurant"
 * - viewport < 1024px
 * 
 * Este guard debe ser la ÚNICA condición para:
 * - Renderizar la bottom navigation
 * - Ocultar el header móvil / hamburguesa
 * - Activar adaptaciones mobile-only en ReservasClient y CalendarioClient
 * 
 * IMPORTANTE: Evitar if/else dispersos fuera de este control.
 */

import { useState, useEffect } from "react";

interface UseRestaurantMobileProps {
  businessType: string;
}

export interface UseRestaurantMobileReturn {
  /** true si businessType === "restaurant" AND viewport < 1024px */
  isRestaurantMobile: boolean;
  /** true solo para verificación de tipo de negocio */
  isRestaurant: boolean;
  /** true solo para verificación de viewport */
  isMobileViewport: boolean;
}

const MOBILE_BREAKPOINT = 1024;

export function useRestaurantMobile({ businessType }: UseRestaurantMobileProps): UseRestaurantMobileReturn {
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const isRestaurant = businessType === "restaurant";

  useEffect(() => {
    // Verificar viewport inicial
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Verificar inmediatamente
    checkViewport();

    // Escuchar cambios de tamaño
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // Guard central: ambas condiciones deben cumplirse
  const isRestaurantMobile = isRestaurant && isMobileViewport;

  return {
    isRestaurantMobile,
    isRestaurant,
    isMobileViewport,
  };
}

/**
 * Helper estático para Server Components o casos donde no se puede usar el hook
 */
export function checkIsRestaurantMobile(
  businessType: string | null | undefined,
  viewportWidth: number
): boolean {
  return businessType === "restaurant" && viewportWidth < MOBILE_BREAKPOINT;
}

export { MOBILE_BREAKPOINT };
