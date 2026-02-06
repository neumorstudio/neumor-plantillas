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

export function ConfiguracionClient({
  client,
  websiteId,
  initialSettings,
  initialWebsiteConfig,
}: Props) {
  const baseConfig = initialWebsiteConfig || {};

  const initialAddress =
    typeof baseConfig.address === "string" ? baseConfig.address : "";
  const businessData = {
    business_name: client.business_name,
    phone: client.phone || "",
    address: client.address || initialAddress,
  };

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
  const [pushBusy, setPushBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncSubscription = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (settings.whatsapp_booking_confirmation) {
          setSettings((prev) => ({
            ...prev,
            whatsapp_booking_confirmation: false,
          }));
        }
        return;
      }

      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;

      if (!isStandalone && settings.whatsapp_booking_confirmation) {
        setSettings((prev) => ({
          ...prev,
          whatsapp_booking_confirmation: false,
        }));
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription && settings.whatsapp_booking_confirmation) {
        setSettings((prev) => ({
          ...prev,
          whatsapp_booking_confirmation: false,
        }));
      }
    };

    syncSubscription().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === "boolean") {
      setSettings((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const ensurePushSubscription = async (silent = false) => {
    if (typeof window === "undefined") return false;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      if (!silent) {
        setMessage({
          type: "error",
          text: "Tu navegador no soporta notificaciones push.",
        });
      }
      return false;
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (!isStandalone) {
      if (!silent) {
        setMessage({
          type: "error",
          text: "Instala la app para activar notificaciones moviles.",
        });
      }
      return false;
    }

    if (!vapidPublicKey) {
      if (!silent) {
        setMessage({
          type: "error",
          text: "Faltan las claves VAPID para activar notificaciones.",
        });
      }
      return false;
    }

    if (Notification.permission === "denied") {
      if (!silent) {
        setMessage({
          type: "error",
          text: "Permiso denegado. Activa las notificaciones en tu navegador.",
        });
      }
      return false;
    }

    if (Notification.permission === "default") {
      if (silent) return false;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage({
          type: "error",
          text: "No se concedio el permiso para notificaciones.",
        });
        return false;
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, subscription }),
      });

      if (!response.ok) {
        if (!silent) {
          setMessage({
            type: "error",
            text: "No se pudo guardar la suscripcion push.",
          });
        }
        return false;
      }

      return true;
    } catch {
      if (!silent) {
        setMessage({
          type: "error",
          text: "No se pudo activar la suscripcion push.",
        });
      }
      return false;
    }
  };

  const removePushSubscription = async () => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
  };

  const handleMobileToggle = async () => {
    if (pushBusy) return;
    setPushBusy(true);

    try {
      if (settings.whatsapp_booking_confirmation) {
        await removePushSubscription();
        setSettings((prev) => ({
          ...prev,
          whatsapp_booking_confirmation: false,
        }));
        return;
      }

      const ok = await ensurePushSubscription();
      if (ok) {
        setSettings((prev) => ({
          ...prev,
          whatsapp_booking_confirmation: true,
        }));
      }
    } finally {
      setPushBusy(false);
    }
  };

  useEffect(() => {
    if (!settings.whatsapp_booking_confirmation) return;
    if (typeof window === "undefined") return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;

    ensurePushSubscription(true).catch(() => {});
  }, [settings.whatsapp_booking_confirmation]);

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
          Gestiona notificaciones y acceso rapido al website
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
        {/* Reservation Notifications */}
        <div className="neumor-card p-6">
          <h2 className="text-xl font-semibold mb-6">Notificaciones</h2>

          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Notificaciones por Email</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Recibe alertas y confirmaciones en tu correo
                </p>
              </div>
              <button
                onClick={() => handleToggle("email_booking_confirmation")}
                className="neumor-toggle"
                data-active={settings.email_booking_confirmation}
                type="button"
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>

            {/* Mobile Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Notificaciones Movil</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Recibe avisos importantes en la app instalada
                </p>
              </div>
              <button
                onClick={handleMobileToggle}
                className="neumor-toggle"
                data-active={settings.whatsapp_booking_confirmation}
                disabled={pushBusy}
                type="button"
              >
                <span className="neumor-toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* Website ID */}
        <div className="neumor-card p-6">
          <h2 className="text-xl font-semibold mb-4">Website ID</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Usalo para localizar rapidamente tu web en soporte o incidencias.
          </p>

          <div className="neumor-inset p-4 rounded-lg">
            <code className="text-sm break-all">{websiteId}</code>
          </div>
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
