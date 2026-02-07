"use client";

/**
 * Restaurant Bottom Navigation - Mobile Only
 * 
 * Navegación inferior tipo app nativa EXCLUSIVA para el nicho RESTAURANT en vista móvil.
 * 
 * CRITERIOS DE ACTIVACIÓN (vía useRestaurantMobileContext):
 * - businessType === "restaurant"
 * - viewport < 1024px
 * 
 * BOTONES:
 * - Reservas: /dashboard/reservas
 * - Calendario: /dashboard/calendario
 * - FAB "+": Navega a creación de reserva
 * - Notificaciones: Abre RestaurantNotificationsPane
 * - Ajustes: /dashboard/configuracion
 * 
 * IMPORTANTE: Este código es específico para restaurant y mobile.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, List, Bell, Settings, Plus } from "lucide-react";
import { RestaurantNavFAB } from "./RestaurantNavFAB";
import { RestaurantNotificationsPane, useNotificationCount } from "./RestaurantNotificationsPane";
import { useRestaurantMobileContext } from "./RestaurantMobileProvider";

interface RestaurantBottomNavProps {
  businessType: string;
}

export function RestaurantBottomNav({ businessType }: RestaurantBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationCount = useNotificationCount();
  
  // Guard central desde contexto
  const { isRestaurantMobile } = useRestaurantMobileContext();

  // No renderizar si no es restaurant mobile
  if (!isRestaurantMobile) {
    return null;
  }

  // Determinar si una ruta está activa
  const isActive = (href: string): boolean => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Handler para abrir notificaciones
  const handleOpenNotifications = () => {
    setNotificationsOpen(true);
  };

  // Handler para el FAB - navegar a creación de reserva
  const handleFabClick = () => {
    const todayIso = new Date().toISOString().split("T")[0];
    router.push(`/dashboard/calendario?create=1&date=${todayIso}`);
  };

  return (
    <>
      {/* Barra de navegación inferior */}
      <nav 
        className="restaurant-bottom-nav" 
        role="navigation" 
        aria-label="Navegación móvil"
      >
        <div className="restaurant-bottom-nav-container">
          {/* Reservas */}
          <Link
            href="/dashboard/reservas"
            className={`restaurant-bottom-nav-item ${isActive("/dashboard/reservas") ? "active" : ""}`}
            aria-current={isActive("/dashboard/reservas") ? "page" : undefined}
          >
            <span className="restaurant-bottom-nav-icon-wrapper">
              <List className="w-5 h-5" />
            </span>
            <span className="restaurant-bottom-nav-label">Reservas</span>
          </Link>

          {/* Calendario */}
          <Link
            href="/dashboard/calendario"
            className={`restaurant-bottom-nav-item ${isActive("/dashboard/calendario") ? "active" : ""}`}
            aria-current={isActive("/dashboard/calendario") ? "page" : undefined}
          >
            <span className="restaurant-bottom-nav-icon-wrapper">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="restaurant-bottom-nav-label">Calendario</span>
          </Link>

          {/* FAB - Nueva Reserva */}
          <RestaurantNavFAB
            onClick={handleFabClick}
            icon={<Plus className="w-6 h-6" />}
            label="Nueva reserva"
          />

          {/* Notificaciones */}
          <button
            onClick={handleOpenNotifications}
            className={`restaurant-bottom-nav-item ${notificationsOpen ? "active" : ""}`}
            aria-label="Abrir notificaciones"
            type="button"
          >
            <span className="restaurant-bottom-nav-icon-wrapper">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span 
                  className="restaurant-bottom-nav-badge" 
                  aria-label={`${notificationCount} notificaciones sin leer`}
                >
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </span>
            <span className="restaurant-bottom-nav-label">Alertas</span>
          </button>

          {/* Ajustes */}
          <Link
            href="/dashboard/configuracion"
            className={`restaurant-bottom-nav-item ${isActive("/dashboard/configuracion") ? "active" : ""}`}
            aria-current={isActive("/dashboard/configuracion") ? "page" : undefined}
          >
            <span className="restaurant-bottom-nav-icon-wrapper">
              <Settings className="w-5 h-5" />
            </span>
            <span className="restaurant-bottom-nav-label">Ajustes</span>
          </Link>
        </div>
      </nav>

      {/* Panel de Notificaciones */}
      <RestaurantNotificationsPane
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </>
  );
}
