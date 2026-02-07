"use client";

/**
 * Restaurant Navigation FAB (Floating Action Button) - Mobile Only
 * 
 * Botón de acción central flotante para el bottom nav de restaurant.
 * Apariencia elevada que destaca sobre la barra de navegación.
 * 
 * IMPORTANTE: Este código es específico para restaurant y mobile.
 */

interface RestaurantNavFABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

export function RestaurantNavFAB({ onClick, icon, label }: RestaurantNavFABProps) {
  return (
    <button
      onClick={onClick}
      className="restaurant-nav-fab"
      aria-label={label}
      title={label}
      type="button"
    >
      <span className="restaurant-nav-fab-inner">
        {icon}
      </span>
    </button>
  );
}
