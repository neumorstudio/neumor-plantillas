/**
 * Tab de Negocio para personalizacion.
 * Componente presentacional extraido de personalizacion-client.tsx.
 */

import { CollapsibleSection } from "@/components/ui";
import type { ContentConfig } from "../../types";

interface BusinessTabProps {
  content: ContentConfig;
  isMobile: boolean;
  onContentChange: (key: keyof ContentConfig, value: string | ContentConfig["socialLinks"] | ContentConfig["schedule"]) => void;
}

export function BusinessTab({
  content,
  isMobile,
  onContentChange,
}: BusinessTabProps) {
  return (
    <div className="space-y-6">
      {/* Contacto */}
      <CollapsibleSection title="Contacto" defaultOpen={true}>
        <div>
          <label className="block text-sm font-medium mb-2">Direccion</label>
          <input
            type="text"
            value={content.address || ""}
            onChange={(e) => onContentChange("address", e.target.value)}
            placeholder="Calle, numero, ciudad..."
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Telefono</label>
          <input
            type="tel"
            value={content.phone || ""}
            onChange={(e) => onContentChange("phone", e.target.value)}
            placeholder="+34 600 000 000"
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={content.email || ""}
            onChange={(e) => onContentChange("email", e.target.value)}
            placeholder="contacto@tunegocio.com"
            className="neumor-input w-full h-12"
          />
        </div>
      </CollapsibleSection>

      {/* Horario */}
      <CollapsibleSection title="Horario" defaultOpen={!isMobile}>
        <div>
          <label className="block text-sm font-medium mb-2">Lunes - Viernes</label>
          <input
            type="text"
            value={content.schedule?.weekdays || ""}
            onChange={(e) => onContentChange("schedule", { ...content.schedule, weekdays: e.target.value })}
            placeholder="10:00 - 20:00"
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Sabado</label>
          <input
            type="text"
            value={content.schedule?.saturday || ""}
            onChange={(e) => onContentChange("schedule", { ...content.schedule, saturday: e.target.value })}
            placeholder="10:00 - 14:00"
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Domingo</label>
          <input
            type="text"
            value={content.schedule?.sunday || ""}
            onChange={(e) => onContentChange("schedule", { ...content.schedule, sunday: e.target.value })}
            placeholder="Cerrado"
            className="neumor-input w-full h-12"
          />
        </div>
      </CollapsibleSection>

      {/* Redes Sociales */}
      <CollapsibleSection title="Redes Sociales" defaultOpen={!isMobile}>
        <div>
          <label className="block text-sm font-medium mb-2">Instagram</label>
          <input
            type="url"
            value={content.socialLinks?.instagram || ""}
            onChange={(e) => onContentChange("socialLinks", { ...content.socialLinks, instagram: e.target.value })}
            placeholder="https://instagram.com/..."
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Facebook</label>
          <input
            type="url"
            value={content.socialLinks?.facebook || ""}
            onChange={(e) => onContentChange("socialLinks", { ...content.socialLinks, facebook: e.target.value })}
            placeholder="https://facebook.com/..."
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">WhatsApp</label>
          <input
            type="url"
            value={content.socialLinks?.whatsapp || ""}
            onChange={(e) => onContentChange("socialLinks", { ...content.socialLinks, whatsapp: e.target.value })}
            placeholder="https://wa.me/34..."
            className="neumor-input w-full h-12"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
