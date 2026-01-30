/**
 * Layout desktop para personalizacion.
 * Componente presentacional extraido de personalizacion-client.tsx.
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
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">Personalizacion</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Personaliza el aspecto de tu web en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="neumor-btn px-4 py-2 text-sm flex items-center gap-2"
            title="Restaurar valores por defecto"
          >
            <ResetIcon />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="neumor-btn neumor-btn-accent px-6 py-2"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        {/* Left Panel - Tabs */}
        <div className="xl:col-span-1 flex xl:flex-col gap-2 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center xl:flex-col gap-2 xl:gap-1 p-3 xl:py-4 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white shadow-lg"
                  : "neumor-btn hover:bg-[var(--shadow-light)]"
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span className="text-xs font-medium xl:hidden">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Center Panel - Controls */}
        <div className="xl:col-span-4 neumor-card p-5 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {tabs.find(t => t.id === activeTab)?.icon}
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          {tabContent}
        </div>

        {/* Right Panel - Preview */}
        <PreviewPanel
          previewUrl={previewUrl}
          previewMode={previewMode}
          previewDimensions={previewDimensions}
          iframeRef={iframeRef}
          onIframeLoad={onIframeLoad}
          onSetPreviewMode={onSetPreviewMode}
          domain={domain}
        />
      </div>
    </div>
  );
}
