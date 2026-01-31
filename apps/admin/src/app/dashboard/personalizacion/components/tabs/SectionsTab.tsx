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
    <div>
      <SectionBuilder
        businessType={businessType}
        sections={sections}
        onChange={onSectionsChange}
      />
    </div>
  );
}
