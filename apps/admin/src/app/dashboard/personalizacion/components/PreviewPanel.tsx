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
}

export function PreviewPanel({
  previewUrl,
  previewMode,
  previewDimensions,
  iframeRef,
  onIframeLoad,
  onSetPreviewMode,
  domain,
}: PreviewPanelProps) {
  return (
    <div className="xl:col-span-7 neumor-card p-4 flex flex-col min-h-[400px]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Vista Previa</h2>
        <div className="flex items-center gap-2">
          <div className="flex neumor-inset rounded-lg p-1">
            <button
              onClick={() => onSetPreviewMode("desktop")}
              className={`p-2 rounded-lg transition-all ${
                previewMode === "desktop" ? "bg-[var(--accent)] text-white" : ""
              }`}
              title="Desktop"
            >
              <DesktopIcon />
            </button>
            <button
              onClick={() => onSetPreviewMode("tablet")}
              className={`p-2 rounded-lg transition-all ${
                previewMode === "tablet" ? "bg-[var(--accent)] text-white" : ""
              }`}
              title="Tablet"
            >
              <TabletIcon />
            </button>
            <button
              onClick={() => onSetPreviewMode("mobile")}
              className={`p-2 rounded-lg transition-all ${
                previewMode === "mobile" ? "bg-[var(--accent)] text-white" : ""
              }`}
              title="Mobile"
            >
              <MobileIcon />
            </button>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="neumor-btn p-2 text-[var(--accent)]"
            title="Abrir en nueva pestana"
          >
            <ExternalLinkIcon />
          </a>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[var(--shadow-dark)] rounded-xl overflow-hidden">
        <div
          className="bg-white h-full transition-all duration-300"
          style={{
            width: previewDimensions.width,
            maxWidth: "100%",
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

      <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
        {domain}
      </p>
    </div>
  );
}
