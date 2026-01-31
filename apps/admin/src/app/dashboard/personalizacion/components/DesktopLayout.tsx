/**
 * Layout desktop para personalizacion.
 * Componente presentacional extraido de personalizacion-client.tsx.
 *
 * Layout optimizado: Preview protagonista (~75%), Panel lateral (~25%)
 */

import type { ReactNode, RefObject } from "react";
import type { TabId } from "../types";
import { PreviewPanel } from "./PreviewPanel";
import { ResetIcon } from "@/components/icons";

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: ReactNode;
}

interface DesktopLayoutProps {
  // Tab navigation
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabContent: ReactNode;

  // Preview
  previewUrl: string;
  previewMode: "desktop" | "tablet" | "mobile";
  previewDimensions: { width: string; height: string };
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onIframeLoad: () => void;
  onSetPreviewMode: (mode: "desktop" | "tablet" | "mobile") => void;
  domain: string;

  // Actions
  onReset: () => void;
  onSave: () => void;
  saving: boolean;

  // Message
  message: { type: "success" | "error"; text: string } | null;
}

export function DesktopLayout({
  tabs,
  activeTab,
  onTabChange,
  tabContent,
  previewUrl,
  previewMode,
  previewDimensions,
  iframeRef,
  onIframeLoad,
  onSetPreviewMode,
  domain,
  onReset,
  onSave,
  saving,
  message,
}: DesktopLayoutProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header Sticky */}
      <header className="sticky top-0 z-30 bg-[var(--neumor-bg)] pb-3 mb-3 border-b border-[var(--shadow-dark)]/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Personalizacion</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Personaliza el aspecto de tu web en tiempo real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="neumor-btn px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-[var(--shadow-light)]"
              title="Restaurar valores por defecto"
            >
              <ResetIcon />
              <span>Reset</span>
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="neumor-btn neumor-btn-accent px-6 py-2.5 font-semibold min-w-[120px]"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            className={`mt-3 p-3 rounded-lg text-sm font-medium ${
              message.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </header>

      {/* Main Layout - Flex row: Panel fijo + Preview resto */}
      <div className="flex gap-4 items-stretch" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Left Panel - Tabs + Controls (w-80 = ~320px fijo) */}
        <aside className="w-80 flex-shrink-0 flex flex-col gap-3 h-full">
          {/* Tabs Navigation - Horizontal con texto */}
          <nav className="flex flex-wrap gap-1.5 p-1.5 neumor-inset rounded-xl flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[var(--accent)] text-white shadow-md"
                    : "hover:bg-[var(--shadow-light)] text-[var(--text-secondary)]"
                }`}
              >
                <span className="w-4 h-4">{tab.icon}</span>
                <span>{tab.shortLabel}</span>
              </button>
            ))}
          </nav>

          {/* Controls Panel - scroll interno */}
          <div className="flex-1 neumor-card p-4 overflow-y-auto min-h-0">
            <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-[var(--text-primary)]">
              {tabs.find(t => t.id === activeTab)?.icon}
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            {tabContent}
          </div>
        </aside>

        {/* Right Panel - Preview (flex-1 = resto del espacio, h-full para altura completa) */}
        <PreviewPanel
          previewUrl={previewUrl}
          previewMode={previewMode}
          previewDimensions={previewDimensions}
          iframeRef={iframeRef}
          onIframeLoad={onIframeLoad}
          onSetPreviewMode={onSetPreviewMode}
          domain={domain}
          className="flex-1 min-w-0 h-full"
        />
      </div>
    </div>
  );
}
