"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { ColorPicker, FontSelector, SliderControl, OptionSelector, SectionBuilder } from "@/components/customization";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type {
  Theme,
  WebsiteConfig,
  ColorsConfig,
  TypographyConfig,
  EffectsConfig,
  BrandingConfig,
  SectionConfig,
  SectionsConfig,
} from "@neumorstudio/supabase";
import { getDefaultSectionsConfig } from "@neumorstudio/supabase";

// Types locales
import type {
  Variants,
  Props,
  TabId,
  ContentConfig,
  FeatureItemConfig,
  FeaturesConfig,
} from "./types";

// Constantes
import {
  defaultVariants,
  defaultColors,
  defaultTypography,
  defaultEffects,
  tabs,
} from "./constants";

// Hooks locales
import { usePreviewSync, useFileUpload } from "./hooks";

// Componentes locales
import { PreviewPanel, DesignTab } from "./components";

// Datos estáticos extraídos
import {
  FEATURE_ICONS,
  normalizeFeatureIcon,
} from "@/lib/personalizacion";
import type { TemplatePreset } from "@/lib/personalizacion";

// Componentes UI extraídos
import { CollapsibleSection } from "@/components/ui";
import {
  CheckIcon,
  ExternalLinkIcon,
  ResetIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SaveIcon,
} from "@/components/icons";


// ============================================
// MAIN COMPONENT
// ============================================

export function PersonalizacionClient({
  websiteId,
  domain,
  initialTheme,
  initialConfig,
  businessType = "salon",
}: Props) {
  const isMobile = useIsMobile();

  // State
  const [activeTab, setActiveTab] = useState<TabId>("diseno");
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [variants, setVariants] = useState<Variants>(initialConfig.variants as Variants || defaultVariants);
  const [colors, setColors] = useState<ColorsConfig>({
    ...defaultColors,
    ...initialConfig.colors,
    primary: initialConfig.colors?.primary || initialConfig.primaryColor || defaultColors.primary,
    secondary: initialConfig.colors?.secondary || initialConfig.secondaryColor || defaultColors.secondary,
  });
  const [typography, setTypography] = useState<TypographyConfig>({
    ...defaultTypography,
    ...initialConfig.typography,
  });
  const [effects, setEffects] = useState<EffectsConfig>({
    ...defaultEffects,
    ...initialConfig.effects,
  });
  const [branding, setBranding] = useState<BrandingConfig>({
    ...initialConfig.branding,
    logo: initialConfig.branding?.logo || initialConfig.logo,
    logoDisplay:
      initialConfig.branding?.logoDisplay ||
      (initialConfig.branding?.logo || initialConfig.logo ? "logo" : "name"),
  });
  // Inicializar heroImages: si hay heroImage existente, incluirlo en el array
  const initialHeroImages = (initialConfig.heroImages as string[] | undefined) ||
    (initialConfig.heroImage ? [initialConfig.heroImage] : []);

  const [content, setContent] = useState<ContentConfig>({
    heroTitle: initialConfig.heroTitle || "",
    heroSubtitle: initialConfig.heroSubtitle || "",
    heroImage: initialConfig.heroImage || "",
    heroImages: initialHeroImages,
    address: initialConfig.address || "",
    phone: initialConfig.phone || "",
    email: initialConfig.email || "",
    socialLinks: initialConfig.socialLinks || {},
    schedule: initialConfig.schedule || {
      weekdays: "Lunes - Viernes: 10:00 - 20:00",
      saturday: "Sabado: 10:00 - 14:00",
      sunday: "Domingo: Cerrado",
    },
  });

  const defaultFeatureItems: FeatureItemConfig[] = [
    { id: "1", icon: "scissors", title: "Servicio 1", description: "Descripcion del primer servicio." },
    { id: "2", icon: "sparkles", title: "Servicio 2", description: "Descripcion del segundo servicio." },
    { id: "3", icon: "calendar", title: "Servicio 3", description: "Descripcion del tercer servicio." },
  ];

  const normalizeFeatureItems = (items: FeatureItemConfig[] | undefined): FeatureItemConfig[] => {
    if (!items) return defaultFeatureItems;
    return items.map(item => ({
      ...item,
      icon: normalizeFeatureIcon(item.icon),
    }));
  };

  const [features, setFeatures] = useState<FeaturesConfig>({
    title: initialConfig.features?.title || "Nuestros Servicios",
    subtitle: initialConfig.features?.subtitle || "Lo mejor para ti",
    items: normalizeFeatureItems(initialConfig.features?.items as FeatureItemConfig[] | undefined),
  });

  // Estado para preset activo (null si personalización manual)
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Estado para skin visual de componentes (neumorphic por defecto)
  const [skin, setSkin] = useState<string>(initialConfig.skin || "neumorphic");

  // Estado para secciones del builder
  // Verificar que sectionsConfig tenga secciones válidas, sino usar las por defecto
  const [sectionsConfig, setSectionsConfig] = useState<SectionsConfig>(() => {
    const existingConfig = initialConfig.sectionsConfig;
    // Si hay configuración existente con secciones válidas, usarla
    if (existingConfig?.sections && existingConfig.sections.length > 0) {
      return existingConfig;
    }
    // Si no, generar configuración por defecto para el tipo de negocio
    return getDefaultSectionsConfig(businessType);
  });

  // Handler para cambios en secciones
  const handleSectionsChange = useCallback((sections: SectionConfig[]) => {
    setSectionsConfig({ sections, updatedAt: new Date().toISOString() });
  }, []);

  // Función para aplicar un preset completo
  const applyPreset = useCallback((preset: TemplatePreset) => {
    setTheme(preset.theme);
    setSkin(preset.skin);
    setColors(preset.colors);
    setTypography(preset.typography);
    setEffects(preset.effects);
    setVariants(preset.variants);
    setActivePreset(preset.id);
  }, []);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Hook para manejar uploads de archivos
  const { uploading, uploadingHero, handleLogoUpload, handleHeroImageUpload } = useFileUpload({
    setBranding,
    setContent,
    setMessage,
  });
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewExpanded, setPreviewExpanded] = useState(false);

  // Refs para iframes de preview (desktop y mobile)
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeMobileRef = useRef<HTMLIFrameElement>(null);

  // Hook para sincronizar cambios con preview iframes
  const { handleIframeLoad } = usePreviewSync({
    theme,
    skin,
    colors,
    typography,
    effects,
    branding,
    content,
    features,
    sectionsConfig,
    variants,
    iframeRef,
    iframeMobileRef,
  });

  // Build preview URL - includes variants for component selection
  // CSS/theme changes are sent via postMessage, but variants require reload (different components)
  // In development, use NEXT_PUBLIC_PREVIEW_URL env var if set (e.g., http://localhost:4321)
  const previewUrl = useMemo(() => {
    const localPreview = process.env.NEXT_PUBLIC_PREVIEW_URL;
    const baseUrl = localPreview || `https://${domain}`;
    const params = new URLSearchParams({
      preview: "1",
      v_hero: variants.hero,
      v_services: variants.menu,
      v_features: variants.features,
      v_footer: variants.footer,
    });
    console.log("[Admin] Preview URL:", `${baseUrl}?${params.toString()}`);
    return `${baseUrl}?${params.toString()}`;
  }, [domain, variants]);

  // Preview dimensions
  const previewDimensions = useMemo(() => {
    switch (previewMode) {
      case "tablet": return { width: "768px", height: "100%" };
      case "mobile": return { width: "375px", height: "100%" };
      default: return { width: "100%", height: "100%" };
    }
  }, [previewMode]);

  // Handlers - limpian el preset activo al hacer cambios manuales
  const handleColorChange = useCallback((key: keyof ColorsConfig, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }, []);

  const handleTypographyChange = useCallback((key: keyof TypographyConfig, value: string | number) => {
    setTypography(prev => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }, []);

  const handleEffectsChange = useCallback((key: keyof EffectsConfig, value: number | string | boolean) => {
    setEffects(prev => ({ ...prev, [key]: value }));
    setActivePreset(null);
  }, []);

  const handleSkinChange = useCallback((value: string) => {
    setSkin(value);
    setActivePreset(null);
  }, []);

  const handleBrandingChange = useCallback((key: keyof BrandingConfig, value: string) => {
    setBranding(prev => ({ ...prev, [key]: value }));
  }, []);

  // Seleccionar una imagen de la galería como activa
  const handleSelectHeroImage = useCallback((url: string) => {
    setContent(prev => ({ ...prev, heroImage: url }));
  }, []);

  // Eliminar una imagen de la galería
  const handleRemoveHeroImage = useCallback((url: string) => {
    setContent(prev => {
      const newImages = (prev.heroImages || []).filter(img => img !== url);
      // Si eliminamos la imagen activa, seleccionar otra o vaciar
      const newHeroImage = prev.heroImage === url
        ? (newImages[0] || "")
        : prev.heroImage;
      return {
        ...prev,
        heroImage: newHeroImage,
        heroImages: newImages,
      };
    });
  }, []);

  const handleContentChange = useCallback((key: keyof ContentConfig, value: string | ContentConfig["socialLinks"] | ContentConfig["schedule"]) => {
    setContent(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleFeaturesTitleChange = useCallback((key: "title" | "subtitle", value: string) => {
    setFeatures(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleFeatureItemChange = useCallback((id: string, key: keyof FeatureItemConfig, value: string) => {
    setFeatures(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [key]: value } : item)
    }));
  }, []);

  const handleAddFeatureItem = useCallback(() => {
    const newId = String(Date.now());
    setFeatures(prev => ({
      ...prev,
      items: [...prev.items, { id: newId, icon: "star", title: "Nuevo servicio", description: "Descripcion del servicio" }]
    }));
  }, []);

  const handleRemoveFeatureItem = useCallback((id: string) => {
    setFeatures(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  }, []);

  const handleReset = useCallback(() => {
    if (confirm("Esto restaurara la configuracion guardada. ¿Continuar?")) {
      // Restaurar a valores iniciales (guardados en BD), no a defaults del sistema
      setTheme(initialTheme);
      setVariants(initialConfig.variants as Variants || defaultVariants);
      setColors({
        ...defaultColors,
        ...initialConfig.colors,
        primary: initialConfig.colors?.primary || initialConfig.primaryColor || defaultColors.primary,
        secondary: initialConfig.colors?.secondary || initialConfig.secondaryColor || defaultColors.secondary,
      });
      setTypography({
        ...defaultTypography,
        ...initialConfig.typography,
      });
      setEffects({
        ...defaultEffects,
        ...initialConfig.effects,
      });
      setBranding({
        ...initialConfig.branding,
        logo: initialConfig.branding?.logo || initialConfig.logo,
        logoDisplay:
          initialConfig.branding?.logoDisplay ||
          (initialConfig.branding?.logo || initialConfig.logo ? "logo" : "name"),
      });
      setSkin(initialConfig.skin || "neumorphic");
      setContent({
        heroTitle: initialConfig.heroTitle || "",
        heroSubtitle: initialConfig.heroSubtitle || "",
        heroImage: initialConfig.heroImage || "",
        heroImages: (initialConfig.heroImages as string[] | undefined) ||
          (initialConfig.heroImage ? [initialConfig.heroImage] : []),
        address: initialConfig.address || "",
        phone: initialConfig.phone || "",
        email: initialConfig.email || "",
        socialLinks: initialConfig.socialLinks || {},
        schedule: initialConfig.schedule || {
          weekdays: "Lunes - Viernes: 10:00 - 20:00",
          saturday: "Sabado: 10:00 - 14:00",
          sunday: "Domingo: Cerrado",
        },
      });
      setFeatures({
        title: initialConfig.features?.title || "Nuestros Servicios",
        subtitle: initialConfig.features?.subtitle || "Lo mejor para ti",
        items: normalizeFeatureItems(initialConfig.features?.items as FeatureItemConfig[] | undefined),
      });
      // Restaurar secciones - validar que existan secciones válidas
      const existingSections = initialConfig.sectionsConfig;
      if (existingSections?.sections && existingSections.sections.length > 0) {
        setSectionsConfig(existingSections);
      } else {
        setSectionsConfig(getDefaultSectionsConfig(businessType));
      }
      setActivePreset(null);
      setMessage({ type: "success", text: "Configuracion restaurada" });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [initialTheme, initialConfig, businessType]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Normalizar heroImages/heroImage para consistencia
      const normalizedHeroImages = content.heroImages || (content.heroImage ? [content.heroImage] : []);
      const normalizedHeroImage = normalizedHeroImages.includes(content.heroImage || "")
        ? content.heroImage
        : normalizedHeroImages[0] || "";

      const config: Partial<WebsiteConfig> = {
        variants,
        skin,
        colors,
        typography,
        effects,
        branding,
        sectionsConfig,
        features: {
          title: features.title,
          subtitle: features.subtitle,
          items: features.items.map(item => ({
            id: item.id,
            // Guardar el ID del icono, no el SVG
            icon: item.icon,
            title: item.title,
            description: item.description,
          })),
        },
        ...content,
        // Sobrescribir con valores normalizados
        heroImage: normalizedHeroImage,
        heroImages: normalizedHeroImages,
      };

      const response = await fetch("/api/personalizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          theme,
          config,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Guardado correctamente" });
        setTimeout(() => setMessage(null), 3000);

        // Refrescar el iframe para mostrar los cambios guardados
        // Añadir timestamp para invalidar caché del middleware y navegador
        const refreshIframe = (iframe: HTMLIFrameElement) => {
          const currentUrl = new URL(iframe.src);
          currentUrl.searchParams.set("_t", Date.now().toString());
          iframe.src = currentUrl.toString();
        };
        if (iframeRef.current) {
          refreshIframe(iframeRef.current);
        }
        if (iframeMobileRef.current) {
          refreshIframe(iframeMobileRef.current);
        }
      } else {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSaving(false);
    }
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      // ============================================
      // GRUPO 1: DISEÑO (Tema + Logo + Colores + Efectos)
      // ============================================
      case "diseno":
        return (
          <DesignTab
            theme={theme}
            skin={skin}
            activePreset={activePreset}
            colors={colors}
            effects={effects}
            branding={branding}
            uploading={uploading}
            isMobile={isMobile}
            onApplyPreset={applyPreset}
            onSetActivePreset={setActivePreset}
            onSetTheme={setTheme}
            onSkinChange={handleSkinChange}
            onColorChange={handleColorChange}
            onEffectsChange={handleEffectsChange}
            onBrandingChange={handleBrandingChange}
            onLogoUpload={handleLogoUpload}
          />
        );

      // ============================================
      // GRUPO 2: CONTENIDO (Hero + Features)
      // ============================================
      case "contenido":
        return (
          <div className="space-y-6">
            {/* Hero */}
            <CollapsibleSection title="Seccion Principal" defaultOpen={true}>
              <div>
                <label className="block text-sm font-medium mb-2">Titulo</label>
                <input
                  type="text"
                  value={content.heroTitle || ""}
                  onChange={(e) => handleContentChange("heroTitle", e.target.value)}
                  placeholder="Tu titulo aqui..."
                  className="neumor-input w-full h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subtitulo</label>
                <textarea
                  value={content.heroSubtitle || ""}
                  onChange={(e) => handleContentChange("heroSubtitle", e.target.value)}
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
                      onClick={() => handleSelectHeroImage(imgUrl)}
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
                          handleRemoveHeroImage(imgUrl);
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
                        onChange={handleHeroImageUpload}
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
                    onChange={(e) => handleFeaturesTitleChange("title", e.target.value)}
                    placeholder="Nuestros Servicios"
                    className="neumor-input w-full h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subtitulo</label>
                  <input
                    type="text"
                    value={features.subtitle}
                    onChange={(e) => handleFeaturesTitleChange("subtitle", e.target.value)}
                    placeholder="Lo mejor para ti"
                    className="neumor-input w-full h-12"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Items ({features.items.length})</span>
                    <button
                      type="button"
                      onClick={handleAddFeatureItem}
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
                            onClick={() => handleRemoveFeatureItem(item.id)}
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
                            onClick={() => handleFeatureItemChange(item.id, "icon", icon.id)}
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
                        onChange={(e) => handleFeatureItemChange(item.id, "title", e.target.value)}
                        placeholder="Titulo"
                        className="neumor-input w-full text-sm h-10"
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => handleFeatureItemChange(item.id, "description", e.target.value)}
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

      // ============================================
      // GRUPO 3: NEGOCIO (Contacto + Horario + Redes)
      // ============================================
      case "negocio":
        return (
          <div className="space-y-6">
            {/* Contacto */}
            <CollapsibleSection title="Contacto" defaultOpen={true}>
              <div>
                <label className="block text-sm font-medium mb-2">Direccion</label>
                <input
                  type="text"
                  value={content.address || ""}
                  onChange={(e) => handleContentChange("address", e.target.value)}
                  placeholder="Calle, numero, ciudad..."
                  className="neumor-input w-full h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefono</label>
                <input
                  type="tel"
                  value={content.phone || ""}
                  onChange={(e) => handleContentChange("phone", e.target.value)}
                  placeholder="+34 600 000 000"
                  className="neumor-input w-full h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={content.email || ""}
                  onChange={(e) => handleContentChange("email", e.target.value)}
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
                  onChange={(e) => handleContentChange("schedule", { ...content.schedule, weekdays: e.target.value })}
                  placeholder="10:00 - 20:00"
                  className="neumor-input w-full h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sabado</label>
                <input
                  type="text"
                  value={content.schedule?.saturday || ""}
                  onChange={(e) => handleContentChange("schedule", { ...content.schedule, saturday: e.target.value })}
                  placeholder="10:00 - 14:00"
                  className="neumor-input w-full h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Domingo</label>
                <input
                  type="text"
                  value={content.schedule?.sunday || ""}
                  onChange={(e) => handleContentChange("schedule", { ...content.schedule, sunday: e.target.value })}
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
                  onChange={(e) => handleContentChange("socialLinks", { ...content.socialLinks, instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="neumor-input w-full h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Facebook</label>
                <input
                  type="url"
                  value={content.socialLinks?.facebook || ""}
                  onChange={(e) => handleContentChange("socialLinks", { ...content.socialLinks, facebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="neumor-input w-full h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input
                  type="url"
                  value={content.socialLinks?.whatsapp || ""}
                  onChange={(e) => handleContentChange("socialLinks", { ...content.socialLinks, whatsapp: e.target.value })}
                  placeholder="https://wa.me/34..."
                  className="neumor-input w-full h-12"
                />
              </div>
            </CollapsibleSection>
          </div>
        );

      // ============================================
      // GRUPO 4: LAYOUT (Tipografia + Secciones)
      // ============================================
      case "layout":
        return (
          <div className="space-y-6">
            {/* Tipografia */}
            <CollapsibleSection title="Tipografia" defaultOpen={true}>
              <FontSelector
                label="Fuente de Titulos"
                description="Para titulos y encabezados"
                value={typography.headingFont || "system"}
                onChange={(v) => handleTypographyChange("headingFont", v)}
              />
              <FontSelector
                label="Fuente de Texto"
                description="Para parrafos y texto general"
                value={typography.bodyFont || "system"}
                onChange={(v) => handleTypographyChange("bodyFont", v)}
              />
              <div className="space-y-2">
                <SliderControl
                  label="Tamano Base"
                  description="Tamano del texto base"
                  value={typography.baseFontSize || 16}
                  onChange={(v) => handleTypographyChange("baseFontSize", v)}
                  min={14}
                  max={20}
                  step={1}
                  unit="px"
                />
                {isMobile && (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleTypographyChange("baseFontSize", Math.max(14, (typography.baseFontSize || 16) - 1))}
                      className="neumor-btn w-10 h-10 flex items-center justify-center text-lg font-bold"
                    >
                      −
                    </button>
                    <span className="text-base font-medium w-12 text-center">
                      {typography.baseFontSize || 16}px
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTypographyChange("baseFontSize", Math.min(20, (typography.baseFontSize || 16) + 1))}
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

      // ============================================
      // GRUPO 5: SECCIONES (Constructor de secciones)
      // ============================================
      case "secciones":
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
              sections={sectionsConfig.sections}
              onChange={handleSectionsChange}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================
  // MOBILE LAYOUT
  // ============================================
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-[var(--neumor-bg)] px-4 py-3 border-b border-[var(--shadow-dark)]">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Personalizar</h1>
            <button
              onClick={handleReset}
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
            onLoad={handleIframeLoad}
          />

          {/* Preview Controls */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 bg-gradient-to-t from-black/50 to-transparent">
            <button
              onClick={() => setPreviewExpanded(!previewExpanded)}
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
          {renderTabContent()}
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--neumor-bg)] border-t border-[var(--shadow-dark)] safe-area-pb">
          <div className="flex justify-around py-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
          onClick={handleSave}
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

  // ============================================
  // DESKTOP LAYOUT (original)
  // ============================================
  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">Personalizacion</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Personaliza el aspecto de tu web en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="neumor-btn px-4 py-2 text-sm flex items-center gap-2"
            title="Restaurar valores por defecto"
          >
            <ResetIcon />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="neumor-btn neumor-btn-accent px-6 py-2"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        {/* Left Panel - Tabs */}
        <div className="xl:col-span-1 flex xl:flex-col gap-2 overflow-x-auto xl:overflow-x-visible pb-2 xl:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center xl:flex-col gap-2 xl:gap-1 p-3 xl:py-4 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white shadow-lg"
                  : "neumor-btn hover:bg-[var(--shadow-light)]"
              }`}
              title={tab.label}
            >
              {tab.icon}
              <span className="text-xs font-medium xl:hidden">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Center Panel - Controls */}
        <div className="xl:col-span-4 neumor-card p-5 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {tabs.find(t => t.id === activeTab)?.icon}
            {tabs.find(t => t.id === activeTab)?.label}
          </h2>
          {renderTabContent()}
        </div>

        {/* Right Panel - Preview */}
        <PreviewPanel
          previewUrl={previewUrl}
          previewMode={previewMode}
          previewDimensions={previewDimensions}
          iframeRef={iframeRef}
          onIframeLoad={handleIframeLoad}
          onSetPreviewMode={setPreviewMode}
          domain={domain}
        />
      </div>
    </div>
  );
}

export default PersonalizacionClient;
