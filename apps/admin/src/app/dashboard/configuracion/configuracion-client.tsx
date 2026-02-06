"use client";

import { useEffect, useState } from "react";

interface ClientData {
  id: string;
  email: string;
  business_name: string;
  business_type: string;
  phone: string | null;
  address: string | null;
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

interface Props {
  client: ClientData;
  websiteId: string;
  initialSettings: NotificationSettings | null;
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
  initialWebsiteConfig,
}: Props) {
  const baseConfig = initialWebsiteConfig || {};

  // Business data state
  const initialAddress =
    typeof baseConfig.address === "string" ? baseConfig.address : "";

  const [businessData, setBusinessData] = useState({
    business_name: client.business_name,
    phone: client.phone || "",
    address: client.address || initialAddress,
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

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[min(640px,calc(100%-2rem))]">
          <div
            className={`p-4 rounded-xl text-sm font-medium shadow-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </div>
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

            <div>
              <label className="block text-sm font-medium mb-2">
                Direccion
              </label>
              <input
                type="text"
                value={businessData.address}
                onChange={(e) =>
                  setBusinessData((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Calle Principal 123, Ciudad"
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
