/**
 * Tab de Marca para personalizacion.
 * Incluye Logo e Imagenes Hero.
 */

import type { BrandingConfig, SectionConfig, SectionId } from "@neumorstudio/supabase";
import { OptionSelector } from "@/components/customization";
import { CollapsibleSection } from "@/components/ui";
import type { ContentConfig } from "../../types";

interface MarcaTabProps {
  branding: BrandingConfig;
  content: ContentConfig;
  sections: SectionConfig[];
  uploading: boolean;
  uploadingHero: boolean;
  uploadingGallery: boolean;
  uploadingBrands: boolean;
  isMobile: boolean;
  onBrandingChange: (key: keyof BrandingConfig, value: string) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectHeroImage: (url: string) => void;
  onRemoveHeroImage: (url: string) => void;
  onHeroImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGalleryImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveGalleryImage: (url: string) => void;
  onBrandsLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveBrandsLogo: (url: string) => void;
}

export function MarcaTab({
  branding,
  content,
  sections,
  uploading,
  uploadingHero,
  uploadingGallery,
  uploadingBrands,
  isMobile,
  onBrandingChange,
  onLogoUpload,
  onSelectHeroImage,
  onRemoveHeroImage,
  onHeroImageUpload,
  onGalleryImageUpload,
  onRemoveGalleryImage,
  onBrandsLogoUpload,
  onRemoveBrandsLogo,
}: MarcaTabProps) {
  const sectionsMap = new Map(sections.map((section) => [section.id, section]));
  const isSectionEnabled = (id: SectionId) => sectionsMap.get(id)?.enabled ?? false;
  const showGallerySection = isSectionEnabled("gallery");
  const showBrandsSection = isSectionEnabled("brands");
  const maxGalleryImages = 6;
  const maxBrandLogos = 10;

  return (
    <div className="space-y-6">
      {/* Logo */}
      <CollapsibleSection title="Logo" defaultOpen={true}>
        <div>
          <label className="block text-sm font-medium mb-2">Subir Logo</label>
          <label className={`flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[var(--shadow-dark)] rounded-xl cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--shadow-light)] transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              onChange={onLogoUpload}
              className="hidden"
              disabled={uploading}
            />
            <svg className="w-6 h-6 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-[var(--text-secondary)]">
              {uploading ? "Subiendo..." : "Toca para subir"}
            </span>
          </label>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Para PWA se recomienda un logo cuadrado de al menos 192px. Si no cumple, en movil se usara el icono por defecto.
          </p>
          {branding.logo && branding.pwaLogoCompatible === false && (
            <p className="text-xs text-amber-600 mt-2">
              Logo no compatible con PWA. En movil se mostrara el icono por defecto.
            </p>
          )}
        </div>
        {branding.logo && (
          <div className="space-y-2">
            <div className="p-3 neumor-inset rounded-lg flex items-center justify-center">
              <img
                src={branding.logo}
                alt="Logo preview"
                className="max-h-16 max-w-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <button
              type="button"
              onClick={() => onBrandingChange("logo", "")}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Eliminar logo
            </button>
          </div>
        )}
        <OptionSelector
          label="Tamano"
          value={branding.logoSize || "md"}
          onChange={(v) => onBrandingChange("logoSize", v)}
          options={[
            { value: "sm", label: "S" },
            { value: "md", label: "M" },
            { value: "lg", label: "L" },
          ]}
          columns={3}
        />
        <OptionSelector
          label="Mostrar"
          value={branding.logoDisplay || "name"}
          onChange={(v) => onBrandingChange("logoDisplay", v)}
          options={[
            { value: "name", label: "Nombre" },
            { value: "logo", label: "Logo" },
          ]}
          columns={2}
        />
      </CollapsibleSection>

      {/* Imagenes Hero */}
      <CollapsibleSection title="Imagenes de Fondo" defaultOpen={!isMobile}>
        <div>
          <label className="block text-sm font-medium mb-2">
            Galeria de Imagenes
            <span className="text-xs text-[var(--text-secondary)] ml-2">
              ({content.heroImages?.length || 0}/3)
            </span>
          </label>

          {/* Galeria de imagenes */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Imagenes existentes */}
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
                {/* Boton eliminar */}
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

      {showGallerySection && (
        <CollapsibleSection title="Imagenes de la Seccion Galeria" defaultOpen={!isMobile}>
          <div>
            <label className="block text-sm font-medium mb-2">
              Galeria de Imagenes
              <span className="text-xs text-[var(--text-secondary)] ml-2">
                ({content.galleryImages?.length || 0}/{maxGalleryImages})
              </span>
            </label>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Estas imagenes se muestran en la seccion <strong>Galeria</strong> de tu web.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {(content.galleryImages || []).map((imgUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-xl overflow-hidden neumor-inset group"
                >
                  <img
                    src={imgUrl}
                    alt={`Galeria ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M3 15l6-6 4 4 8-8'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3C/svg%3E";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveGalleryImage(imgUrl)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {(content.galleryImages?.length || 0) < maxGalleryImages && (
                <label className={`aspect-video rounded-xl border-2 border-dashed border-[var(--shadow-dark)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--shadow-light)] transition-all ${uploadingGallery ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploadingGallery ? (
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
                    onChange={onGalleryImageUpload}
                    disabled={uploadingGallery}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {(content.galleryImages?.length || 0) === 0 && (
              <p className="text-xs text-[var(--text-secondary)] text-center">
                Sube hasta {maxGalleryImages} imagenes para tu galeria
              </p>
            )}
          </div>
        </CollapsibleSection>
      )}

      {showBrandsSection && (
        <CollapsibleSection title="Logos de Marcas" defaultOpen={!isMobile}>
          <div>
            <label className="block text-sm font-medium mb-2">
              Logos de Marcas
              <span className="text-xs text-[var(--text-secondary)] ml-2">
                ({content.brandsLogos?.length || 0}/{maxBrandLogos})
              </span>
            </label>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Estos logos se muestran en el carrusel de marcas.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-3">
              {(content.brandsLogos || []).map((logoUrl, index) => (
                <div
                  key={index}
                  className="relative aspect-video rounded-xl overflow-hidden neumor-inset group bg-white/60"
                >
                  <img
                    src={logoUrl}
                    alt={`Marca ${index + 1}`}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Cpath d='M3 15l6-6 4 4 8-8'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3C/svg%3E";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveBrandsLogo(logoUrl)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {(content.brandsLogos?.length || 0) < maxBrandLogos && (
                <label className={`aspect-video rounded-xl border-2 border-dashed border-[var(--shadow-dark)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--shadow-light)] transition-all ${uploadingBrands ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploadingBrands ? (
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
                    onChange={onBrandsLogoUpload}
                    disabled={uploadingBrands}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {(content.brandsLogos?.length || 0) === 0 && (
              <p className="text-xs text-[var(--text-secondary)] text-center">
                Sube hasta {maxBrandLogos} logos para tu carrusel de marcas
              </p>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
