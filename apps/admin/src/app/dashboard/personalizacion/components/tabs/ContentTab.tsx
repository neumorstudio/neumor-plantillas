/**
 * Tab de Contenido para personalizacion.
 * Componente presentacional extraido de personalizacion-client.tsx.
 */

import type { BusinessType } from "@neumorstudio/supabase";
import { CollapsibleSection } from "@/components/ui";
import { FEATURE_ICONS } from "@/lib/personalizacion";
import type { ContentConfig, FeaturesConfig, FeatureItemConfig } from "../../types";

interface ContentTabProps {
  content: ContentConfig;
  features: FeaturesConfig;
  uploadingHero: boolean;
  businessType: BusinessType;
  isMobile: boolean;
  onContentChange: (key: keyof ContentConfig, value: string | ContentConfig["socialLinks"] | ContentConfig["schedule"]) => void;
  onSelectHeroImage: (url: string) => void;
  onRemoveHeroImage: (url: string) => void;
  onHeroImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFeaturesTitleChange: (key: "title" | "subtitle", value: string) => void;
  onFeatureItemChange: (id: string, key: keyof FeatureItemConfig, value: string) => void;
  onAddFeatureItem: () => void;
  onRemoveFeatureItem: (id: string) => void;
}

export function ContentTab({
  content,
  features,
  uploadingHero,
  businessType,
  isMobile,
  onContentChange,
  onSelectHeroImage,
  onRemoveHeroImage,
  onHeroImageUpload,
  onFeaturesTitleChange,
  onFeatureItemChange,
  onAddFeatureItem,
  onRemoveFeatureItem,
}: ContentTabProps) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <CollapsibleSection title="Seccion Principal" defaultOpen={true}>
        <div>
          <label className="block text-sm font-medium mb-2">Titulo</label>
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
            placeholder="Descripcion breve..."
            className="neumor-input w-full resize-none"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            Imagen de Fondo
            <span className="text-xs text-[var(--text-secondary)] ml-2">
              ({content.heroImages?.length || 0}/3)
            </span>
          </label>

          {/* Galería de imágenes */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Imágenes existentes */}
            {(content.heroImages || []).map((imgUrl, index) => (
              <div
                key={index}
                className={`relative aspect-video rounded-xl overflow-hidden cursor-pointer group transition-all ${
                  content.heroImage === imgUrl
                    ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--neumor-bg)]"
                    : "neumor-inset"
                }`}
                onClick={() => onSelectHeroImage(imgUrl)}
              >
                <img
                  src={imgUrl}
                  alt={`Hero ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M3 15l6-6 4 4 8-8'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3C/svg%3E";
                  }}
                />
                {/* Indicador de seleccionada */}
                {content.heroImage === imgUrl && (
                  <div className="absolute top-1 left-1 bg-[var(--accent)] text-white rounded-full p-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveHeroImage(imgUrl);
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Slot para subir nueva imagen */}
            {(content.heroImages?.length || 0) < 3 && (
              <label className={`aspect-video rounded-xl border-2 border-dashed border-[var(--shadow-dark)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--shadow-light)] transition-all ${uploadingHero ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingHero ? (
                  <svg className="w-6 h-6 animate-spin text-[var(--accent)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs text-[var(--text-secondary)] mt-1">Subir</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={onHeroImageUpload}
                  disabled={uploadingHero}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Mensaje de ayuda */}
          {(content.heroImages?.length || 0) === 0 && (
            <p className="text-xs text-[var(--text-secondary)] text-center">
              Sube hasta 3 imagenes y selecciona la que quieres mostrar
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* Features - Para salon/clinic se generan desde Servicios */}
      {businessType === "salon" || businessType === "clinic" ? (
        <CollapsibleSection title="Caracteristicas" defaultOpen={false}>
          <div className="neumor-inset p-4 rounded-xl text-center">
            <svg className="w-8 h-8 mx-auto mb-2 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              Las caracteristicas se generan automaticamente desde tus <strong>categorias de servicios</strong>.
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
        <CollapsibleSection title="Caracteristicas" defaultOpen={!isMobile}>
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
      )}
    </div>
  );
}
