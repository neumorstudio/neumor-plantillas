/**
 * Tab de Secciones para personalizacion.
 * Componente presentacional extraido de personalizacion-client.tsx.
 */

import type { SectionConfig, BusinessType } from "@neumorstudio/supabase";
import { SectionBuilder } from "@/components/customization";

interface SectionsTabProps {
  sections: SectionConfig[];
  businessType: BusinessType;
  onSectionsChange: (sections: SectionConfig[]) => void;
}

export function SectionsTab({
  sections,
  businessType,
  onSectionsChange,
}: SectionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Constructor de Secciones</h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Arrastra para reordenar las secciones de tu web. Activa o desactiva las que necesites.
        </p>
      </div>
      <SectionBuilder
        businessType={businessType}
        sections={sections}
        onChange={onSectionsChange}
      />
    </div>
  );
}
