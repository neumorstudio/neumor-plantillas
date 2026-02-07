"use client";

/**
 * Restaurant Notifications Pane - Mobile Only
 * 
 * Panel de notificaciones específico para el nicho RESTAURANT en móvil.
 * Muestra eventos de reservas: creadas, modificadas, canceladas.
 * 
 * IMPORTANTE: Este componente es específico para restaurant y mobile.
 * No se expone a otros nichos.
 */

import { useEffect, useState } from "react";
import { X, Calendar, User, Clock, AlertCircle } from "lucide-react";

interface Notification {
  id: string;
  type: "created" | "updated" | "cancelled";
  customerName: string;
  date: string;
  time: string | null;
  guests?: number;
  createdAt: string;
  read: boolean;
}

interface RestaurantNotificationsPaneProps {
  isOpen: boolean;
  onClose: () => void;
}

// Datos de ejemplo - En producción vendrían de una API o contexto
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "created",
    customerName: "Juan García",
    date: "2026-02-07",
    time: "20:30",
    guests: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 min ago
    read: false,
  },
  {
    id: "2",
    type: "cancelled",
    customerName: "María López",
    date: "2026-02-08",
    time: "14:00",
    guests: 2,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    read: false,
  },
  {
    id: "3",
    type: "updated",
    customerName: "Carlos Ruiz",
    date: "2026-02-07",
    time: "21:00",
    guests: 6,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    read: true,
  },
];

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "created":
      return <Calendar className="w-5 h-5 text-emerald-500" />;
    case "cancelled":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case "updated":
      return <Clock className="w-5 h-5 text-amber-500" />;
    default:
      return <Calendar className="w-5 h-5 text-gray-500" />;
  }
}

function getNotificationText(type: Notification["type"]) {
  switch (type) {
    case "created":
      return "Nueva reserva";
    case "cancelled":
      return "Reserva cancelada";
    case "updated":
      return "Reserva modificada";
    default:
      return "Notificación";
  }
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return "Ayer";
  return `Hace ${diffDays} días`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

export function RestaurantNotificationsPane({ isOpen, onClose }: RestaurantNotificationsPaneProps) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Marcar todas como leídas al abrir
  useEffect(() => {
    if (isOpen) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    }
  }, [isOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Overlay */}
      <div
        className="restaurant-notifications-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="restaurant-notifications-pane"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
      >
        {/* Header */}
        <div className="restaurant-notifications-header">
          <div>
            <h2 id="notifications-title" className="restaurant-notifications-title">
              Notificaciones
            </h2>
            {unreadCount > 0 && (
              <p className="restaurant-notifications-subtitle">
                {unreadCount} sin leer
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="restaurant-notifications-close"
            aria-label="Cerrar notificaciones"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista */}
        <div className="restaurant-notifications-list">
          {notifications.length === 0 ? (
            <div className="restaurant-notifications-empty">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`restaurant-notification-item ${
                  !notification.read ? "unread" : ""
                }`}
              >
                <div className="restaurant-notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="restaurant-notification-content">
                  <div className="restaurant-notification-header">
                    <span className="restaurant-notification-type">
                      {getNotificationText(notification.type)}
                    </span>
                    <span className="restaurant-notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="restaurant-notification-customer">
                    <User className="w-3 h-3 inline mr-1" />
                    {notification.customerName}
                  </p>
                  <p className="restaurant-notification-details">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {formatDate(notification.date)}
                    {notification.time && (
                      <>
                        {" · "}
                        <Clock className="w-3 h-3 inline mr-1" />
                        {notification.time}
                      </>
                    )}
                    {notification.guests && (
                      <>
                        {" · "}
                        {notification.guests} pers.
                      </>
                    )}
                  </p>
                </div>
                {!notification.read && (
                  <span className="restaurant-notification-dot" aria-label="No leído" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="restaurant-notifications-footer">
            <button
              onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
              className="restaurant-notifications-mark-all"
            >
              Marcar todas como leídas
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Hook para obtener el conteo de notificaciones no leídas
 * Usado por RestaurantBottomNav para mostrar el badge
 */
export function useNotificationCount(): number {
  // En producción, esto vendría de una API o contexto global
  // Por ahora, simulamos 2 notificaciones no leídas
  const [count] = useState(2);
  return count;
}
