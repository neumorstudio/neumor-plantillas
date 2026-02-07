import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const plusJakartaHeading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeumorStudio Admin",
  description: "Panel de administracion de automatizaciones",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "NeumorStudio Admin",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${plusJakarta.variable} ${plusJakartaHeading.variable}`}>
      <body>
        {children}
        <div
          id="pwa-install"
          className="fixed bottom-4 right-4 z-50 hidden"
          aria-live="polite"
        >
          <div className="neumor-card px-3 py-2 flex items-center gap-2 shadow-lg">
            <span className="text-xs text-[var(--text-secondary)]">Acceso rapido</span>
            <button
              id="pwa-install-btn"
              type="button"
              className="neumor-btn neumor-btn-accent px-3 py-1.5 text-xs font-semibold"
            >
              Instalar app
            </button>
            <button
              id="pwa-install-close"
              type="button"
              className="neumor-btn px-2 py-1 text-xs"
              aria-label="Cerrar"
              title="Cerrar"
            >
              Ahora no
            </button>
          </div>
        </div>
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ("serviceWorker" in navigator) {
              window.addEventListener("load", () => {
                navigator.serviceWorker
                  .register("/sw.js")
                  .catch(() => {});
              });
            }

            (function () {
              const storageKey = "ns_admin_install_prompt";
              const container = document.getElementById("pwa-install");
              const installButton = document.getElementById("pwa-install-btn");
              const closeButton = document.getElementById("pwa-install-close");
              if (!container || !installButton || !closeButton) return;

              const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
              if (isStandalone) return;

              const stored = window.localStorage.getItem(storageKey);
              if (stored === "dismissed" || stored === "installed") return;

              let deferredPrompt;

              const showPrompt = () => {
                container.classList.remove("hidden");
              };

              const hidePrompt = () => {
                container.classList.add("hidden");
              };

              window.addEventListener("beforeinstallprompt", (event) => {
                event.preventDefault();
                deferredPrompt = event;
                showPrompt();
              });

              installButton.addEventListener("click", async () => {
                if (!deferredPrompt) return;
                deferredPrompt.prompt();
                const choice = await deferredPrompt.userChoice;
                if (choice && choice.outcome === "accepted") {
                  window.localStorage.setItem(storageKey, "installed");
                } else {
                  window.localStorage.setItem(storageKey, "dismissed");
                }
                deferredPrompt = null;
                hidePrompt();
              });

              closeButton.addEventListener("click", () => {
                window.localStorage.setItem(storageKey, "dismissed");
                hidePrompt();
              });

              window.addEventListener("appinstalled", () => {
                window.localStorage.setItem(storageKey, "installed");
                hidePrompt();
              });
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
