/**
 * Restaurant Mobile Components
 * 
 * Componentes específicos para la experiencia móvil del nicho RESTAURANT.
 * 
 * NOTA: Estos componentes están diseñados para ser usados SOLO en vista móvil
 * y SOLO cuando el businessType es "restaurant".
 */

// Guard central y hooks
export {
  useRestaurantMobile,
  checkIsRestaurantMobile,
  MOBILE_BREAKPOINT,
} from "./useRestaurantMobile";
export {
  RestaurantMobileProvider,
  useRestaurantMobileContext,
  useRestaurantMobileSafe,
} from "./RestaurantMobileProvider";

// Componentes de navegación
export { RestaurantBottomNav } from "./RestaurantBottomNav";
export { RestaurantNavFAB } from "./RestaurantNavFAB";
export { RestaurantMobileWrapper } from "./RestaurantMobileWrapper";
export { RestaurantNotificationsPane, useNotificationCount } from "./RestaurantNotificationsPane";

// Vistas móviles específicas
export { RestaurantReservasMobile } from "./RestaurantReservasMobile";
export { RestaurantCalendarioMobile } from "./RestaurantCalendarioMobile";

// Types
export type { UseRestaurantMobileReturn } from "./useRestaurantMobile";
