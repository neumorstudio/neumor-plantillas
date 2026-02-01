/**
 * Tab de Textos para personalizacion.
 * Todos los textos editables de la plantilla en un solo lugar.
 */

import type { BusinessType, SectionConfig, SectionId } from "@neumorstudio/supabase";
import { CollapsibleSection } from "@/components/ui";
import { FEATURE_ICONS } from "@/lib/personalizacion";
import type { ContentConfig, FeaturesConfig, FeatureItemConfig } from "../../types";

interface TextosTabProps {
  content: ContentConfig;
  features: FeaturesConfig;
  businessType: BusinessType;
  isMobile: boolean;
  sections: SectionConfig[];
  onContentChange: <K extends keyof ContentConfig>(key: K, value: ContentConfig[K]) => void;
  onFeaturesTitleChange: (key: "title" | "subtitle", value: string) => void;
  onFeatureItemChange: (id: string, key: keyof FeatureItemConfig, value: string) => void;
  onAddFeatureItem: () => void;
  onRemoveFeatureItem: (id: string) => void;
}

export function TextosTab({
  content,
  features,
  businessType,
  isMobile,
  sections,
  onContentChange,
  onFeaturesTitleChange,
  onFeatureItemChange,
  onAddFeatureItem,
  onRemoveFeatureItem,
}: TextosTabProps) {
  const sectionsMap = new Map(sections.map((section) => [section.id, section]));
  const isSectionEnabled = (id: SectionId) => sectionsMap.get(id)?.enabled ?? false;
  const showServicesBlock = businessType === "salon" || businessType === "clinic"
    ? isSectionEnabled("services") || isSectionEnabled("features")
    : isSectionEnabled("features");
  const showTestimonials = isSectionEnabled("testimonials");
  const showTeam = isSectionEnabled("team");
  const showGallery = isSectionEnabled("gallery");
  const showBrands = isSectionEnabled("brands");
  const showFaq = isSectionEnabled("faq");
  const showPlans = isSectionEnabled("plans");
  const showContactSection = isSectionEnabled("contact");

  return (
    <div className="space-y-6">
      {/* Informacion del Negocio */}
      <CollapsibleSection title="Nombre del Negocio" defaultOpen={true}>
        <div>
          <label className="block text-sm font-medium mb-2">Nombre</label>
          <input
            type="text"
            value={content.businessName || ""}
            onChange={(e) => onContentChange("businessName", e.target.value)}
            placeholder="Mi Negocio"
            className="neumor-input w-full h-12"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Se muestra en la cabecera si no hay logo
          </p>
        </div>
      </CollapsibleSection>

      {/* Cabecera - Hero title y subtitle */}
      <CollapsibleSection title="Seccion Principal (Hero)" defaultOpen={true}>
        <div>
          <label className="block text-sm font-medium mb-2">Titulo Principal</label>
          <input
            type="text"
            value={content.heroTitle || ""}
            onChange={(e) => onContentChange("heroTitle", e.target.value)}
            placeholder="Tu titulo aqui..."
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Subtitulo</label>
          <textarea
            value={content.heroSubtitle || ""}
            onChange={(e) => onContentChange("heroSubtitle", e.target.value)}
            placeholder="Descripcion breve de tu negocio..."
            className="neumor-input w-full resize-none"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Texto del Boton</label>
          <input
            type="text"
            value={content.heroCta || ""}
            onChange={(e) => onContentChange("heroCta", e.target.value)}
            placeholder="Reservar"
            className="neumor-input w-full h-12"
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Texto del boton de llamada a la accion
          </p>
        </div>
      </CollapsibleSection>

      {/* Seccion Servicios/Caracteristicas */}
      {showServicesBlock && (businessType === "salon" || businessType === "clinic" ? (
        <CollapsibleSection title="Seccion Servicios" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium mb-2">Etiqueta superior</label>
            <input
              type="text"
              value={content.servicesLabel || ""}
              onChange={(e) => onContentChange("servicesLabel", e.target.value)}
              placeholder="SERVICIOS"
              className="neumor-input w-full h-12"
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Texto pequeño encima del titulo (ej: SERVICIOS)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
            <input
              type="text"
              value={content.servicesTitle || ""}
              onChange={(e) => onContentChange("servicesTitle", e.target.value)}
              placeholder="Nuestros Servicios"
              className="neumor-input w-full h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtitulo</label>
            <input
              type="text"
              value={content.servicesSubtitle || ""}
              onChange={(e) => onContentChange("servicesSubtitle", e.target.value)}
              placeholder="Cortes, color y tratamientos a tu medida"
              className="neumor-input w-full h-12"
            />
          </div>
          <div className="neumor-inset p-4 rounded-xl text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Los textos de servicios se generan automaticamente desde tus <strong>categorias de servicios</strong>.
            </p>
            <a
              href="/dashboard/servicios"
              className="neumor-btn px-4 py-2 text-sm inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ir a Servicios
            </a>
          </div>
        </CollapsibleSection>
      ) : (
        <CollapsibleSection title="Seccion Servicios" defaultOpen={!isMobile}>
          <div>
            <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
            <input
              type="text"
              value={features.title}
              onChange={(e) => onFeaturesTitleChange("title", e.target.value)}
              placeholder="Nuestros Servicios"
              className="neumor-input w-full h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtitulo</label>
            <input
              type="text"
              value={features.subtitle}
              onChange={(e) => onFeaturesTitleChange("subtitle", e.target.value)}
              placeholder="Lo mejor para ti"
              className="neumor-input w-full h-12"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Items ({features.items.length})</span>
              <button
                type="button"
                onClick={onAddFeatureItem}
                className="neumor-btn px-3 py-1.5 text-xs flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Anadir
              </button>
            </div>
            {features.items.map((item, index) => (
              <div key={item.id} className="neumor-inset p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Item {index + 1}</span>
                  {features.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveFeatureItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {FEATURE_ICONS.slice(0, 8).map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => onFeatureItemChange(item.id, "icon", icon.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        item.icon === icon.id
                          ? "neumor-inset bg-[var(--accent)] text-white"
                          : "neumor-raised hover:scale-105"
                      }`}
                    >
                      <div className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: icon.svg }} />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onFeatureItemChange(item.id, "title", e.target.value)}
                  placeholder="Titulo"
                  className="neumor-input w-full text-sm h-10"
                />
                <textarea
                  value={item.description}
                  onChange={(e) => onFeatureItemChange(item.id, "description", e.target.value)}
                  placeholder="Descripcion..."
                  className="neumor-input w-full text-sm resize-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ))}

      {/* Seccion Reviews/Testimonios */}
      {showTestimonials && (
        <CollapsibleSection title="Seccion Opiniones" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
            <input
              type="text"
              value={content.reviewsTitle || ""}
              onChange={(e) => onContentChange("reviewsTitle", e.target.value)}
              placeholder="Lo Que Dicen De Nosotros"
              className="neumor-input w-full h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtitulo</label>
            <input
              type="text"
              value={content.reviewsSubtitle || ""}
              onChange={(e) => onContentChange("reviewsSubtitle", e.target.value)}
              placeholder="Opiniones reales de nuestros clientes"
              className="neumor-input w-full h-12"
            />
          </div>
        </CollapsibleSection>
      )}

      {showTeam && (
        <CollapsibleSection title="Seccion Equipo" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
            <input
              type="text"
              value={content.teamTitle || ""}
              onChange={(e) => onContentChange("teamTitle", e.target.value)}
              placeholder="Nuestro Equipo"
              className="neumor-input w-full h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtitulo</label>
            <input
              type="text"
              value={content.teamSubtitle || ""}
              onChange={(e) => onContentChange("teamSubtitle", e.target.value)}
              placeholder="Profesionales dedicados a tu bienestar"
              className="neumor-input w-full h-12"
            />
          </div>
        </CollapsibleSection>
      )}

      {showGallery && (
        <CollapsibleSection title="Seccion Galeria" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
            <input
              type="text"
              value={content.galleryTitle || ""}
              onChange={(e) => onContentChange("galleryTitle", e.target.value)}
              placeholder="Nuestra Galeria"
              className="neumor-input w-full h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtitulo</label>
            <input
              type="text"
              value={content.gallerySubtitle || ""}
              onChange={(e) => onContentChange("gallerySubtitle", e.target.value)}
              placeholder="Descubre nuestro trabajo"
              className="neumor-input w-full h-12"
            />
          </div>
        </CollapsibleSection>
      )}

      {showBrands && (
        <CollapsibleSection title="Seccion Marcas" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
            <input
              type="text"
              value={content.brandsTitle || ""}
              onChange={(e) => onContentChange("brandsTitle", e.target.value)}
              placeholder="Nuestras marcas de confianza"
              className="neumor-input w-full h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtitulo</label>
            <input
              type="text"
              value={content.brandsSubtitle || ""}
              onChange={(e) => onContentChange("brandsSubtitle", e.target.value)}
              placeholder="Trabajamos con marcas premium"
              className="neumor-input w-full h-12"
            />
          </div>
        </CollapsibleSection>
      )}

      {showFaq && (
        <CollapsibleSection title="Seccion Preguntas Frecuentes" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
            <input
              type="text"
              value={content.faqTitle || ""}
              onChange={(e) => onContentChange("faqTitle", e.target.value)}
              placeholder="Preguntas Frecuentes"
              className="neumor-input w-full h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtitulo</label>
            <input
              type="text"
              value={content.faqSubtitle || ""}
              onChange={(e) => onContentChange("faqSubtitle", e.target.value)}
              placeholder="Resolvemos tus dudas"
              className="neumor-input w-full h-12"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Preguntas ({content.faqItems?.length || 0})</span>
              <button
                type="button"
                onClick={() => {
                  const nextItems = [
                    ...(content.faqItems || []),
                    { title: "Nueva pregunta", text: "Respuesta..." },
                  ];
                  onContentChange("faqItems", nextItems);
                }}
                className="neumor-btn px-3 py-1.5 text-xs flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Anadir
              </button>
            </div>
            {(content.faqItems || []).map((item, index) => (
              <div key={`${item.title}-${index}`} className="neumor-inset p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Pregunta {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextItems = (content.faqItems || []).filter((_, i) => i !== index);
                      onContentChange("faqItems", nextItems);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Eliminar pregunta"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const nextItems = [...(content.faqItems || [])];
                    nextItems[index] = { ...nextItems[index], title: e.target.value };
                    onContentChange("faqItems", nextItems);
                  }}
                  placeholder="Pregunta"
                  className="neumor-input w-full text-sm h-10"
                />
                <textarea
                  value={item.text}
                  onChange={(e) => {
                    const nextItems = [...(content.faqItems || [])];
                    nextItems[index] = { ...nextItems[index], text: e.target.value };
                    onContentChange("faqItems", nextItems);
                  }}
                  placeholder="Respuesta..."
                  className="neumor-input w-full text-sm resize-none"
                  rows={3}
                />
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {showPlans && (
        <CollapsibleSection title="Seccion Planes" defaultOpen={false}>
          <div>
            <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
            <input
              type="text"
              value={content.plansTitle || ""}
              onChange={(e) => onContentChange("plansTitle", e.target.value)}
              placeholder="Nuestros Planes"
              className="neumor-input w-full h-12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Subtitulo</label>
            <input
              type="text"
              value={content.plansSubtitle || ""}
              onChange={(e) => onContentChange("plansSubtitle", e.target.value)}
              placeholder="Elige el plan que mejor se adapte a ti"
              className="neumor-input w-full h-12"
            />
          </div>
        </CollapsibleSection>
      )}

      {/* Contacto */}
      <CollapsibleSection title="Contacto" defaultOpen={false}>
        {showContactSection && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Titulo de Seccion</label>
              <input
                type="text"
                value={content.contactTitle || ""}
                onChange={(e) => onContentChange("contactTitle", e.target.value)}
                placeholder="Contacto"
                className="neumor-input w-full h-12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Subtitulo</label>
              <input
                type="text"
                value={content.contactSubtitle || ""}
                onChange={(e) => onContentChange("contactSubtitle", e.target.value)}
                placeholder="Estamos aqui para ayudarte"
                className="neumor-input w-full h-12"
              />
            </div>
          </>
        )}
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
      <CollapsibleSection title="Horario" defaultOpen={false}>
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
      <CollapsibleSection title="Redes Sociales" defaultOpen={false}>
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
        <div>
          <label className="block text-sm font-medium mb-2">TripAdvisor</label>
          <input
            type="url"
            value={content.socialLinks?.tripadvisor || ""}
            onChange={(e) => onContentChange("socialLinks", { ...content.socialLinks, tripadvisor: e.target.value })}
            placeholder="https://tripadvisor.com/..."
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">TikTok</label>
          <input
            type="url"
            value={content.socialLinks?.tiktok || ""}
            onChange={(e) => onContentChange("socialLinks", { ...content.socialLinks, tiktok: e.target.value })}
            placeholder="https://tiktok.com/@..."
            className="neumor-input w-full h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Twitter / X</label>
          <input
            type="url"
            value={content.socialLinks?.twitter || ""}
            onChange={(e) => onContentChange("socialLinks", { ...content.socialLinks, twitter: e.target.value })}
            placeholder="https://x.com/..."
            className="neumor-input w-full h-12"
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
