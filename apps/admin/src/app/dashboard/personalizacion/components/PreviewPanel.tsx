/**
 * Panel de preview para desktop.
 * Componente presentacional extraido de personalizacion-client.tsx.
 */

import {
  ExternalLinkIcon,
  DesktopIcon,
  TabletIcon,
  MobileIcon,
} from "@/components/icons";

interface PreviewPanelProps {
  previewUrl: string;
  previewMode: "desktop" | "tablet" | "mobile";
  previewDimensions: { width: string; height: string };
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  onIframeLoad: () => void;
  onSetPreviewMode: (mode: "desktop" | "tablet" | "mobile") => void;
  domain: string;
  className?: string;
}

export function PreviewPanel({
  previewUrl,
  previewMode,
  previewDimensions,
  iframeRef,
  onIframeLoad,
  onSetPreviewMode,
  domain,
  className = "",
}: PreviewPanelProps) {
  return (
    <section className={`neumor-card p-4 flex flex-col h-full ${className}`}>
      {/* Header con controles */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-lg font-semibold">Vista Previa</h2>
        <div className="flex items-center gap-2">
          {/* Device Toggles */}
          <div className="flex neumor-inset rounded-lg p-1">
            <button
              onClick={() => onSetPreviewMode("desktop")}
              className={`p-2 rounded-lg transition-all ${
                previewMode === "desktop" ? "bg-[var(--accent)] text-white shadow-sm" : "hover:bg-[var(--shadow-light)]"
              }`}
              title="Desktop"
            >
              <DesktopIcon />
            </button>
            <button
              onClick={() => onSetPreviewMode("tablet")}
              className={`p-2 rounded-lg transition-all ${
                previewMode === "tablet" ? "bg-[var(--accent)] text-white shadow-sm" : "hover:bg-[var(--shadow-light)]"
              }`}
              title="Tablet"
            >
              <TabletIcon />
            </button>
            <button
              onClick={() => onSetPreviewMode("mobile")}
              className={`p-2 rounded-lg transition-all ${
                previewMode === "mobile" ? "bg-[var(--accent)] text-white shadow-sm" : "hover:bg-[var(--shadow-light)]"
              }`}
              title="Mobile"
            >
              <MobileIcon />
            </button>
          </div>
          {/* External Link */}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="neumor-btn p-2 text-[var(--accent)] hover:bg-[var(--shadow-light)]"
            title="Abrir en nueva pestana"
          >
            <ExternalLinkIcon />
          </a>
        </div>
      </div>

      {/* Preview Container - flex-1 para ocupar todo el espacio disponible */}
      <div className="flex-1 flex items-stretch justify-center bg-[var(--shadow-dark)]/50 rounded-xl overflow-hidden min-h-0">
        <div
          className="bg-white transition-all duration-300 shadow-lg"
          style={{
            width: previewDimensions.width,
            maxWidth: "100%",
            height: "100%",
          }}
        >
          <iframe
            key={previewUrl}
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Vista previa del sitio"
            onLoad={onIframeLoad}
          />
        </div>
      </div>

      {/* Domain footer */}
      <p className="text-xs text-[var(--text-secondary)] mt-2 text-center flex-shrink-0">
        {domain}
      </p>
    </section>
  );
}
