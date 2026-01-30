"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { SectionBuilder } from "@/components/customization";
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
import { PreviewPanel, DesignTab, ContentTab, BusinessTab, LayoutTab } from "./components";

// Datos estáticos extraídos
import { normalizeFeatureIcon } from "@/lib/personalizacion";
import type { TemplatePreset } from "@/lib/personalizacion";

// Componentes UI extraídos
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
          <ContentTab
            content={content}
            features={features}
            uploadingHero={uploadingHero}
            businessType={businessType}
            isMobile={isMobile}
            onContentChange={handleContentChange}
            onSelectHeroImage={handleSelectHeroImage}
            onRemoveHeroImage={handleRemoveHeroImage}
            onHeroImageUpload={handleHeroImageUpload}
            onFeaturesTitleChange={handleFeaturesTitleChange}
            onFeatureItemChange={handleFeatureItemChange}
            onAddFeatureItem={handleAddFeatureItem}
            onRemoveFeatureItem={handleRemoveFeatureItem}
          />
        );

      // ============================================
      // GRUPO 3: NEGOCIO (Contacto + Horario + Redes)
      // ============================================
      case "negocio":
        return (
          <BusinessTab
            content={content}
            isMobile={isMobile}
            onContentChange={handleContentChange}
          />
        );

      // ============================================
      // GRUPO 4: LAYOUT (Tipografia + Secciones)
      // ============================================
      case "layout":
        return (
          <LayoutTab
            typography={typography}
            isMobile={isMobile}
            onTypographyChange={handleTypographyChange}
          />
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
