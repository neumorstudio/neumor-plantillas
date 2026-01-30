/**
 * Tab de Layout para personalizacion.
 * Componente presentacional extraido de personalizacion-client.tsx.
 */

import type { TypographyConfig } from "@neumorstudio/supabase";
import { FontSelector, SliderControl } from "@/components/customization";
import { CollapsibleSection } from "@/components/ui";

interface LayoutTabProps {
  typography: TypographyConfig;
  isMobile: boolean;
  onTypographyChange: (key: keyof TypographyConfig, value: string | number) => void;
}

export function LayoutTab({
  typography,
  isMobile,
  onTypographyChange,
}: LayoutTabProps) {
  return (
    <div className="space-y-6">
      {/* Tipografia */}
      <CollapsibleSection title="Tipografia" defaultOpen={true}>
        <FontSelector
          label="Fuente de Titulos"
          description="Para titulos y encabezados"
          value={typography.headingFont || "system"}
          onChange={(v) => onTypographyChange("headingFont", v)}
        />
        <FontSelector
          label="Fuente de Texto"
          description="Para parrafos y texto general"
          value={typography.bodyFont || "system"}
          onChange={(v) => onTypographyChange("bodyFont", v)}
        />
        <div className="space-y-2">
          <SliderControl
            label="Tamano Base"
            description="Tamano del texto base"
            value={typography.baseFontSize || 16}
            onChange={(v) => onTypographyChange("baseFontSize", v)}
            min={14}
            max={20}
            step={1}
            unit="px"
          />
          {isMobile && (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => onTypographyChange("baseFontSize", Math.max(14, (typography.baseFontSize || 16) - 1))}
                className="neumor-btn w-10 h-10 flex items-center justify-center text-lg font-bold"
              >
                −
              </button>
              <span className="text-base font-medium w-12 text-center">
                {typography.baseFontSize || 16}px
              </span>
              <button
                type="button"
                onClick={() => onTypographyChange("baseFontSize", Math.min(20, (typography.baseFontSize || 16) + 1))}
                className="neumor-btn w-10 h-10 flex items-center justify-center text-lg font-bold"
              >
                +
              </button>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Nota sobre variantes */}
      <div className="p-4 neumor-inset rounded-xl">
        <p className="text-sm text-[var(--text-secondary)]">
          Para cambiar las variantes de cada seccion, usa la pestana <strong>Secciones</strong> donde puedes reordenar, activar/desactivar y elegir el estilo de cada una.
        </p>
      </div>
    </div>
  );
}
