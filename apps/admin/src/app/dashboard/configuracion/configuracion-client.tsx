"use client";

import { useState } from "react";

interface ClientData {
  id: string;
  email: string;
  business_name: string;
  business_type: string;
  phone: string | null;
}

interface NotificationSettings {
  id: string;
  website_id: string;
  email_booking_confirmation: boolean;
  whatsapp_booking_confirmation: boolean;
  reminder_24h: boolean;
  reminder_time: string | null;
  email_new_lead: boolean;
  whatsapp_new_lead: boolean;
  webhook_url: string | null;
}

interface OrderSettings {
  id?: string;
  website_id?: string;
  pickup_start_time: string | null;
  pickup_end_time: string | null;
}

interface Props {
  client: ClientData;
  websiteId: string;
  initialSettings: NotificationSettings | null;
  initialOrderSettings: OrderSettings | null;
  initialWebsiteConfig: Record<string, unknown> | null;
}

const businessTypeLabels: Record<string, string> = {
  restaurant: "Restaurante",
  clinic: "Clinica",
  salon: "Peluqueria",
  shop: "Tienda",
  fitness: "Gimnasio",
  realestate: "Inmobiliaria",
};

export function ConfiguracionClient({
  client,
  websiteId,
  initialSettings,
  initialOrderSettings,
  initialWebsiteConfig,
}: Props) {
  const showOrders = process.env.NEXT_PUBLIC_ENABLE_ORDERS === "true";
  const isRestaurant = client.business_type === "restaurant";
  const showRestaurantOrders = showOrders && isRestaurant;

  const baseConfig = initialWebsiteConfig || {};
  const restaurantConfig = (baseConfig.restaurant as Record<string, unknown> | undefined) || {};
  const existingOrders =
    (restaurantConfig.orders as Record<string, unknown> | undefined) ||
    (baseConfig.orders as Record<string, unknown> | undefined) ||
    {};

  const toBool = (value: unknown, fallback: boolean) =>
    typeof value === "boolean" ? value : fallback;
  const toNumber = (value: unknown, fallback: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const toPaymentMode = (value: unknown): "local" | "stripe" =>
    String(value || "local").toLowerCase() === "stripe" ? "stripe" : "local";

  // Business data state
  const [businessData, setBusinessData] = useState({
    business_name: client.business_name,
    phone: client.phone || "",
  });

  // Notification settings state
  const [settings, setSettings] = useState({
    email_booking_confirmation:
      initialSettings?.email_booking_confirmation ?? true,
    whatsapp_booking_confirmation:
      initialSettings?.whatsapp_booking_confirmation ?? true,
    reminder_24h: initialSettings?.reminder_24h ?? false,
    reminder_time: initialSettings?.reminder_time || "10:00",
    email_new_lead: initialSettings?.email_new_lead ?? true,
    whatsapp_new_lead: initialSettings?.whatsapp_new_lead ?? false,
  });

  const [orderSettings, setOrderSettings] = useState({
    pickup_start_time: initialOrderSettings?.pickup_start_time || "12:00",
    pickup_end_time: initialOrderSettings?.pickup_end_time || "22:00",
  });

  const [ordersConfig, setOrdersConfig] = useState({
    enabled: toBool(existingOrders.enabled, true),
    paymentMode: toPaymentMode(existingOrders.paymentMode),
    leadTimeMinutes: toNumber(existingOrders.leadTimeMinutes, 30),
    slotIntervalMinutes: toNumber(existingOrders.slotIntervalMinutes, 15),
    preparationMinutes: toNumber(existingOrders.preparationMinutes, 20),
    maxOrdersPerSlot: toNumber(existingOrders.maxOrdersPerSlot, 0),
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === "boolean") {
      setSettings((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = {
        clientId: client.id,
        websiteId,
        businessData,
        notificationSettings: settings,
      };

      if (showOrders) {
        payload.orderSettings = orderSettings;
      }

      if (isRestaurant) {
        payload.restaurantConfig = {
          orders: {
            ...ordersConfig,
            paymentMode: ordersConfig.paymentMode,
            leadTimeMinutes: Number(ordersConfig.leadTimeMinutes) || 30,
            slotIntervalMinutes: Number(ordersConfig.slotIntervalMinutes) || 15,
            preparationMinutes: Number(ordersConfig.preparationMinutes) || 20,
            maxOrdersPerSlot: Number(ordersConfig.maxOrdersPerSlot) || 0,
          },
        };
      }

      const response = await fetch("/api/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Configuracion guardada correctamente" });
      } else {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Configuracion</h1>
        <p className="text-[var(--text-secondary)]">
          Personaliza tus datos y automatizaciones
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="max-w-2xl space-y-6">
        {/* Business Info */}
        <div className="neumor-card p-6">
          <h2 className="text-xl font-semibold mb-6">Datos del Negocio</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Nombre del Negocio
              </label>
              <input
                type="text"
                value={businessData.business_name}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    business_name: e.target.value,
                  }))
                }
                className="neumor-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Tipo de Negocio
              </label>
              <div className="neumor-inset p-3 rounded-lg text-[var(--text-secondary)]">
                {businessTypeLabels[client.business_type] || client.business_type}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Contacta con NeumorStudio para cambiar el tipo de negocio
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="neumor-inset p-3 rounded-lg text-[var(--text-secondary)]">
                {client.email}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                El email no se puede modificar
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefono</label>
              <input
                type="tel"
                value={businessData.phone}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="+34 600 000 000"
                className="neumor-input w-full"
              />
            </div>
          </div>
        </div>

        {/* Reservation Notifications */}
        <div className="neumor-card p-6">
          <h2 className="text-xl font-semibold mb-6">
            Notificaciones de Reservas
          </h2>

          <div className="space-y-6">
            {/* Email Confirmation */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Confirmacion por Email</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Enviar email automatico al cliente cuando haga una reserva
                </p>
              </div>
              <button
                onClick={() => handleToggle("email_booking_confirmation")}
                className="neumor-toggle"
                data-active={settings.email_booking_confirmation}
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>

            {/* WhatsApp Confirmation */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Confirmacion por WhatsApp</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Enviar mensaje de WhatsApp al cliente con la confirmacion
                </p>
              </div>
              <button
                onClick={() => handleToggle("whatsapp_booking_confirmation")}
                className="neumor-toggle"
                data-active={settings.whatsapp_booking_confirmation}
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>

            {/* 24h Reminder */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Recordatorio 24 horas antes</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Enviar recordatorio automatico 24h antes de la reserva
                </p>
              </div>
              <button
                onClick={() => handleToggle("reminder_24h")}
                className="neumor-toggle"
                data-active={settings.reminder_24h}
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>

            {settings.reminder_24h && (
              <div className="ml-4 p-4 bg-[var(--shadow-light)] rounded-lg">
                <label className="block text-sm font-medium mb-2">
                  Hora del recordatorio
                </label>
                <input
                  type="time"
                  value={settings.reminder_time}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      reminder_time: e.target.value,
                    }))
                  }
                  className="neumor-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* Lead Notifications */}
        <div className="neumor-card p-6">
          <h2 className="text-xl font-semibold mb-6">
            Notificaciones de Leads
          </h2>

          <div className="space-y-6">
            {/* Email New Lead */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Nuevo lead por Email</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Recibir email cuando llegue un nuevo contacto
                </p>
              </div>
              <button
                onClick={() => handleToggle("email_new_lead")}
                className="neumor-toggle"
                data-active={settings.email_new_lead}
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>

            {/* WhatsApp New Lead */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Nuevo lead por WhatsApp</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Recibir notificacion por WhatsApp de nuevos contactos
                </p>
              </div>
              <button
                onClick={() => handleToggle("whatsapp_new_lead")}
                className="neumor-toggle"
                data-active={settings.whatsapp_new_lead}
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Order Settings */}
        {showOrders && (
          <div className="neumor-card p-6">
            <h2 className="text-xl font-semibold mb-6">Pedidos Online</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Define el rango horario para recogidas en el checkout online.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Hora de inicio
                </label>
                <input
                  type="time"
                  value={orderSettings.pickup_start_time}
                  onChange={(e) =>
                    setOrderSettings((prev) => ({
                      ...prev,
                      pickup_start_time: e.target.value,
                    }))
                  }
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Hora de fin
                </label>
                <input
                  type="time"
                  value={orderSettings.pickup_end_time}
                  onChange={(e) =>
                    setOrderSettings((prev) => ({
                      ...prev,
                      pickup_end_time: e.target.value,
                    }))
                  }
                  className="neumor-input w-full"
                />
              </div>
            </div>
          </div>
        )}

        {showRestaurantOrders && (
          <div className="neumor-card p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Take Away</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Controla si aceptas pedidos, como se paga y la logica de recogidas.
              </p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-medium">Aceptar pedidos</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Si lo desactivas, la web ocultara la seccion de pedidos.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setOrdersConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
                }
                className={`neumor-toggle ${ordersConfig.enabled ? "active" : ""}`}
                aria-label="Toggle pedidos"
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Modo de pago</label>
                <select
                  value={ordersConfig.paymentMode}
                  onChange={(event) =>
                    setOrdersConfig((prev) => ({
                      ...prev,
                      paymentMode: event.target.value === "stripe" ? "stripe" : "local",
                    }))
                  }
                  className="neumor-input w-full"
                >
                  <option value="local">Pago en el local</option>
                  <option value="stripe">Stripe (online)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Antelacion minima (min)</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={ordersConfig.leadTimeMinutes}
                  onChange={(event) =>
                    setOrdersConfig((prev) => ({
                      ...prev,
                      leadTimeMinutes: Number(event.target.value) || 0,
                    }))
                  }
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Intervalo de franjas (min)</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={ordersConfig.slotIntervalMinutes}
                  onChange={(event) =>
                    setOrdersConfig((prev) => ({
                      ...prev,
                      slotIntervalMinutes: Number(event.target.value) || 15,
                    }))
                  }
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tiempo de preparacion (min)</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={ordersConfig.preparationMinutes}
                  onChange={(event) =>
                    setOrdersConfig((prev) => ({
                      ...prev,
                      preparationMinutes: Number(event.target.value) || 0,
                    }))
                  }
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max pedidos por franja</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={ordersConfig.maxOrdersPerSlot}
                  onChange={(event) =>
                    setOrdersConfig((prev) => ({
                      ...prev,
                      maxOrdersPerSlot: Math.max(0, Math.floor(Number(event.target.value) || 0)),
                    }))
                  }
                  className="neumor-input w-full"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  0 significa sin limite (se aplica a nivel de UX).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Webhook Info */}
        <div className="neumor-card p-6">
          <h2 className="text-xl font-semibold mb-4">Integracion n8n</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Tu webhook de n8n esta configurado y activo. Las automatizaciones se
            ejecutan automaticamente.
          </p>

          <div className="neumor-inset p-4 rounded-lg">
            <p className="text-xs text-[var(--text-secondary)] mb-1">
              Website ID
            </p>
            <code className="text-sm break-all">{websiteId}</code>
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-4">
            Si necesitas cambios en las automatizaciones, contacta con el equipo
            de NeumorStudio.
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="neumor-btn neumor-btn-accent w-full"
        >
          {saving ? "Guardando..." : "Guardar Configuracion"}
        </button>
      </div>
    </div>
  );
}
