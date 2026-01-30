/**
 * Layout mobile para personalizacion.
 * Componente presentacional extraido de personalizacion-client.tsx.
 */

import type { ReactNode, RefObject } from "react";
import type { TabId } from "../types";
import {
  ResetIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  SaveIcon,
} from "@/components/icons";

interface Tab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: ReactNode;
}

interface MobileLayoutProps {
  // Tab navigation
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabContent: ReactNode;

  // Preview
  previewUrl: string;
  previewExpanded: boolean;
  onSetPreviewExpanded: (expanded: boolean) => void;
  iframeMobileRef: RefObject<HTMLIFrameElement | null>;
  onIframeLoad: () => void;

  // Actions
  onReset: () => void;
  onSave: () => void;
  saving: boolean;

  // Message
  message: { type: "success" | "error"; text: string } | null;
}

export function MobileLayout({
  tabs,
  activeTab,
  onTabChange,
  tabContent,
  previewUrl,
  previewExpanded,
  onSetPreviewExpanded,
  iframeMobileRef,
  onIframeLoad,
  onReset,
  onSave,
  saving,
  message,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-[var(--neumor-bg)] px-4 py-3 border-b border-[var(--shadow-dark)]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Personalizar</h1>
          <button
            onClick={onReset}
            className="neumor-btn p-2"
            title="Reset"
          >
            <ResetIcon />
          </button>
        </div>
      </div>

      {/* Toast Message */}
      {message && (
        <div
          className={`fixed top-16 left-4 right-4 z-50 p-3 rounded-lg text-sm shadow-lg ${
            message.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Collapsible Preview */}
      <div className={`relative transition-all duration-300 bg-[var(--shadow-dark)] ${
        previewExpanded ? 'h-[60vh]' : 'h-[30vh]'
      }`}>
        <iframe
          key={previewUrl}
          ref={iframeMobileRef}
          src={previewUrl}
          className="w-full h-full border-0"
          title="Vista previa"
          onLoad={onIframeLoad}
        />

        {/* Preview Controls */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 bg-gradient-to-t from-black/50 to-transparent">
          <button
            onClick={() => onSetPreviewExpanded(!previewExpanded)}
            className="flex items-center gap-1 text-white text-xs bg-black/30 px-3 py-2 rounded-lg"
          >
            {previewExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
            {previewExpanded ? 'Colapsar' : 'Expandir'}
          </button>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-white text-xs bg-black/30 px-3 py-2 rounded-lg"
          >
            <ExternalLinkIcon />
            Abrir
          </a>
        </div>
      </div>

      {/* Tab Title */}
      <div className="px-4 py-3 border-b border-[var(--shadow-dark)]">
        <h2 className="text-base font-semibold flex items-center gap-2">
          {tabs.find(t => t.id === activeTab)?.icon}
          {tabs.find(t => t.id === activeTab)?.label}
        </h2>
      </div>

      {/* Controls Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {tabContent}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--neumor-bg)] border-t border-[var(--shadow-dark)] safe-area-pb">
        <div className="flex justify-around py-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center p-2 min-w-[48px] transition-colors ${
                activeTab === tab.id
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5 font-medium">{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* FAB Save Button */}
      <button
        onClick={onSave}
        disabled={saving}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
          saving
            ? 'bg-gray-400'
            : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:scale-95'
        }`}
        style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
      >
        {saving ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <SaveIcon />
        )}
      </button>
    </div>
  );
}
