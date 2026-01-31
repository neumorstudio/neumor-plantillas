"use client";

import { useState, useCallback, useMemo, useRef } from "react";
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
  SectionId,
} from "@neumorstudio/supabase";
import { getDefaultSectionsConfig, SECTIONS_CATALOG } from "@neumorstudio/supabase";

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
import {
  MobileLayout,
  DesktopLayout,
  DesignTab,
  TextosTab,
  MarcaTab,
  SectionsTab,
} from "./components";

// Datos estáticos extraídos
import { normalizeFeatureIcon } from "@/lib/personalizacion";
import type { TemplatePreset } from "@/lib/personalizacion";



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
    // Informacion del negocio
    businessName: initialConfig.businessName || "",
    // Hero section
    heroTitle: initialConfig.heroTitle || "",
    heroSubtitle: initialConfig.heroSubtitle || "",
    heroImage: initialConfig.heroImage || "",
    heroImages: initialHeroImages,
    heroCta: (initialConfig as Record<string, unknown>).heroCta as string || "",
    // Contacto
    address: initialConfig.address || "",
    phone: initialConfig.phone || "",
    email: initialConfig.email || "",
    // Redes sociales (incluyendo tiktok y twitter)
    socialLinks: initialConfig.socialLinks || {},
    // Horario
    schedule: initialConfig.schedule || {
      weekdays: "Lunes - Viernes: 10:00 - 20:00",
      saturday: "Sabado: 10:00 - 14:00",
      sunday: "Domingo: Cerrado",
    },
    // Seccion Reviews
    reviewsTitle: (initialConfig as Record<string, unknown>).reviewsTitle as string || "",
    reviewsSubtitle: (initialConfig as Record<string, unknown>).reviewsSubtitle as string || "",
    // Secciones genericas
    teamTitle: (initialConfig as Record<string, unknown>).teamTitle as string || "",
    teamSubtitle: (initialConfig as Record<string, unknown>).teamSubtitle as string || "",
    galleryTitle: (initialConfig as Record<string, unknown>).galleryTitle as string || "",
    gallerySubtitle: (initialConfig as Record<string, unknown>).gallerySubtitle as string || "",
    faqTitle: (initialConfig as Record<string, unknown>).faqTitle as string || "",
    faqSubtitle: (initialConfig as Record<string, unknown>).faqSubtitle as string || "",
    plansTitle: (initialConfig as Record<string, unknown>).plansTitle as string || "",
    plansSubtitle: (initialConfig as Record<string, unknown>).plansSubtitle as string || "",
    contactTitle: (initialConfig as Record<string, unknown>).contactTitle as string || "",
    contactSubtitle: (initialConfig as Record<string, unknown>).contactSubtitle as string || "",
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

  const normalizeSectionsOrder = useCallback((sections: SectionConfig[]): SectionConfig[] => {
    const topFixed: SectionConfig[] = [];
    const bottomFixed: SectionConfig[] = [];
    const normal: SectionConfig[] = [];

    sections.forEach((section) => {
      const definition = SECTIONS_CATALOG[section.id as SectionId];
      if (definition?.fixedPosition === "top") {
        topFixed.push(section);
      } else if (definition?.fixedPosition === "bottom") {
        bottomFixed.push(section);
      } else {
        normal.push(section);
      }
    });

    const sortByOrder = (a: SectionConfig, b: SectionConfig) => (a.order ?? 0) - (b.order ?? 0);
    topFixed.sort(sortByOrder);
    normal.sort(sortByOrder);
    bottomFixed.sort(sortByOrder);

    return [...topFixed, ...normal, ...bottomFixed].map((section, index) => ({
      ...section,
      order: index,
    }));
  }, []);

  const mergeSectionsConfig = useCallback((existing: SectionsConfig | undefined): SectionsConfig => {
    const defaults = getDefaultSectionsConfig(businessType);
    if (!existing?.sections || existing.sections.length === 0) {
      return defaults;
    }

    const existingIds = new Set(existing.sections.map((s) => s.id));
    const maxExistingOrder = existing.sections.reduce(
      (max, section) => (section.order > max ? section.order : max),
      -1
    );
    let nextOrder = maxExistingOrder + 1;

    const mergedSections = [...existing.sections];
    defaults.sections.forEach((section) => {
      if (!existingIds.has(section.id)) {
        mergedSections.push({
          ...section,
          order: nextOrder++,
        });
      }
    });

    return {
      ...existing,
      sections: normalizeSectionsOrder(mergedSections),
      updatedAt: new Date().toISOString(),
    };
  }, [businessType, normalizeSectionsOrder]);

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
      return mergeSectionsConfig(existingConfig);
    }
    // Si no, generar configuración por defecto para el tipo de negocio
    return getDefaultSectionsConfig(businessType);
  });

  // Handler para cambios en secciones
  const handleSectionsChange = useCallback((sections: SectionConfig[]) => {
    setSectionsConfig({
      sections: normalizeSectionsOrder(sections),
      updatedAt: new Date().toISOString(),
    });
  }, [normalizeSectionsOrder]);

  // Mapeo de section IDs a keys de variants
  const sectionToVariantKey: Record<string, keyof Variants | null> = {
    hero: "hero",
    services: "services", // salon, clinic, fitness, shop, repairs
    menu: "menu", // restaurant
    features: "features",
    footer: "footer",
    testimonials: "reviews",
    reservation: "reservation",
    // Secciones sin variante correspondiente en Variants
    booking: null,
    contact: null,
    orders: null,
  };

  // Handler para sincronizar cambio de variante de sección con estado variants
  const handleSectionVariantChange = useCallback((sectionId: string, variant: string) => {
    const variantKey = sectionToVariantKey[sectionId];
    if (variantKey) {
      setVariants(prev => ({
        ...prev,
        [variantKey]: variant,
      }));
      // Limpiar preset activo ya que estamos personalizando manualmente
      setActivePreset(null);
    }
  }, []);

  // Mapeo inverso: variant key a section ID
  const variantKeyToSectionId: Record<string, string> = {
    hero: "hero",
    menu: "menu", // restaurant
    services: "services", // salon, clinic, fitness, shop, repairs
    features: "features",
    footer: "footer",
    reviews: "testimonials",
    reservation: "reservation",
  };

  // Función para aplicar un preset completo
  const applyPreset = useCallback((preset: TemplatePreset) => {
    setTheme(preset.theme);
    setSkin(preset.skin);
    setColors(preset.colors);
    setTypography(preset.typography);
    setEffects(preset.effects);
    setVariants(preset.variants);
    setActivePreset(preset.id);

    // Sincronizar variantes del preset con sectionsConfig
    setSectionsConfig(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        // Buscar si hay una variante del preset para esta sección
        for (const [variantKey, sectionId] of Object.entries(variantKeyToSectionId)) {
          if (sectionId === section.id && preset.variants[variantKey as keyof typeof preset.variants]) {
            return { ...section, variant: preset.variants[variantKey as keyof typeof preset.variants] };
          }
        }
        return section;
      }),
      updatedAt: new Date().toISOString(),
    }));
  }, [businessType]);

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

    const sectionVariantMap = new Map(
      sectionsConfig.sections.map((section) => [section.id, section.variant])
    );

    const getSectionVariant = (id: SectionId, fallback?: string) => {
      return sectionVariantMap.get(id) || fallback || "";
    };

    const servicesVariant = getSectionVariant("services", variants.services || variants.menu);
    const menuVariant = getSectionVariant("menu", variants.menu);
    const reviewsVariant = getSectionVariant("testimonials", variants.reviews);
    const reservationVariant = getSectionVariant("reservation", variants.reservation);

    const params = new URLSearchParams({
      preview: "1",
      v_hero: getSectionVariant("hero", variants.hero),
      v_features: getSectionVariant("features", variants.features),
      v_footer: getSectionVariant("footer", variants.footer),
      v_reviews: reviewsVariant,
      v_menu: menuVariant,
      v_reservation: reservationVariant,
      // Variantes de "services" segun template
      v_services: servicesVariant,
      v_products: servicesVariant,
      v_classes: servicesVariant,
      v_treatments: servicesVariant,
      // Variantes de secciones genericas
      v_team: getSectionVariant("team"),
      v_gallery: getSectionVariant("gallery"),
      v_faq: getSectionVariant("faq"),
      v_plans: getSectionVariant("plans"),
      v_contact: getSectionVariant("contact"),
    });

    console.log("[Admin] Preview URL:", `${baseUrl}?${params.toString()}`);
    return `${baseUrl}?${params.toString()}`;
  }, [domain, variants, sectionsConfig]);

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
    console.log('[PersonalizacionClient] handleEffectsChange:', key, value);
    setEffects(prev => {
      const newEffects = { ...prev, [key]: value };
      console.log('[PersonalizacionClient] New effects state:', newEffects);
      return newEffects;
    });
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
        businessName: initialConfig.businessName || "",
        heroTitle: initialConfig.heroTitle || "",
        heroSubtitle: initialConfig.heroSubtitle || "",
        heroImage: initialConfig.heroImage || "",
        heroImages: (initialConfig.heroImages as string[] | undefined) ||
          (initialConfig.heroImage ? [initialConfig.heroImage] : []),
        heroCta: (initialConfig as Record<string, unknown>).heroCta as string || "",
        address: initialConfig.address || "",
        phone: initialConfig.phone || "",
        email: initialConfig.email || "",
        socialLinks: initialConfig.socialLinks || {},
        schedule: initialConfig.schedule || {
          weekdays: "Lunes - Viernes: 10:00 - 20:00",
          saturday: "Sabado: 10:00 - 14:00",
          sunday: "Domingo: Cerrado",
        },
        reviewsTitle: (initialConfig as Record<string, unknown>).reviewsTitle as string || "",
        reviewsSubtitle: (initialConfig as Record<string, unknown>).reviewsSubtitle as string || "",
        teamTitle: (initialConfig as Record<string, unknown>).teamTitle as string || "",
        teamSubtitle: (initialConfig as Record<string, unknown>).teamSubtitle as string || "",
        galleryTitle: (initialConfig as Record<string, unknown>).galleryTitle as string || "",
        gallerySubtitle: (initialConfig as Record<string, unknown>).gallerySubtitle as string || "",
        faqTitle: (initialConfig as Record<string, unknown>).faqTitle as string || "",
        faqSubtitle: (initialConfig as Record<string, unknown>).faqSubtitle as string || "",
        plansTitle: (initialConfig as Record<string, unknown>).plansTitle as string || "",
        plansSubtitle: (initialConfig as Record<string, unknown>).plansSubtitle as string || "",
        contactTitle: (initialConfig as Record<string, unknown>).contactTitle as string || "",
        contactSubtitle: (initialConfig as Record<string, unknown>).contactSubtitle as string || "",
      });
      setFeatures({
        title: initialConfig.features?.title || "Nuestros Servicios",
        subtitle: initialConfig.features?.subtitle || "Lo mejor para ti",
        items: normalizeFeatureItems(initialConfig.features?.items as FeatureItemConfig[] | undefined),
      });
      // Restaurar secciones - validar que existan secciones válidas
      const existingSections = initialConfig.sectionsConfig;
      if (existingSections?.sections && existingSections.sections.length > 0) {
        setSectionsConfig(mergeSectionsConfig(existingSections));
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
      // GRUPO 1: DISEÑO (Tema + Skin + Colores + Efectos + Tipografia)
      // ============================================
      case "diseno":
        return (
          <DesignTab
            theme={theme}
            skin={skin}
            activePreset={activePreset}
            colors={colors}
            effects={effects}
            typography={typography}
            isMobile={isMobile}
            onApplyPreset={applyPreset}
            onSetActivePreset={setActivePreset}
            onSetTheme={setTheme}
            onSkinChange={handleSkinChange}
            onColorChange={handleColorChange}
            onEffectsChange={handleEffectsChange}
            onTypographyChange={handleTypographyChange}
          />
        );

      // ============================================
      // GRUPO 2: TEXTOS (Hero + Features + Contacto + Horario + Redes)
      // ============================================
      case "textos":
        return (
          <TextosTab
            content={content}
            features={features}
            businessType={businessType}
            isMobile={isMobile}
            sections={sectionsConfig.sections}
            onContentChange={handleContentChange}
            onFeaturesTitleChange={handleFeaturesTitleChange}
            onFeatureItemChange={handleFeatureItemChange}
            onAddFeatureItem={handleAddFeatureItem}
            onRemoveFeatureItem={handleRemoveFeatureItem}
          />
        );

      // ============================================
      // GRUPO 3: MARCA (Logo + Imagenes Hero)
      // ============================================
      case "marca":
        return (
          <MarcaTab
            branding={branding}
            content={content}
            uploading={uploading}
            uploadingHero={uploadingHero}
            isMobile={isMobile}
            onBrandingChange={handleBrandingChange}
            onLogoUpload={handleLogoUpload}
            onSelectHeroImage={handleSelectHeroImage}
            onRemoveHeroImage={handleRemoveHeroImage}
            onHeroImageUpload={handleHeroImageUpload}
          />
        );

      // ============================================
      // GRUPO 4: SECCIONES (Constructor de secciones)
      // ============================================
      case "secciones":
        return (
          <SectionsTab
            sections={sectionsConfig.sections}
            businessType={businessType}
            onSectionsChange={handleSectionsChange}
            onSectionVariantChange={handleSectionVariantChange}
          />
        );

      default:
        return null;
    }
  };

  // Calculate tab content once
  const tabContent = renderTabContent();

  // ============================================
  // RENDER - Delegate to layout components
  // ============================================
  if (isMobile) {
    return (
      <MobileLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabContent={tabContent}
        previewUrl={previewUrl}
        previewExpanded={previewExpanded}
        onSetPreviewExpanded={setPreviewExpanded}
        iframeMobileRef={iframeMobileRef}
        onIframeLoad={handleIframeLoad}
        onReset={handleReset}
        onSave={handleSave}
        saving={saving}
        message={message}
      />
    );
  }

  return (
    <DesktopLayout
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabContent={tabContent}
      previewUrl={previewUrl}
      previewMode={previewMode}
      previewDimensions={previewDimensions}
      iframeRef={iframeRef}
      onIframeLoad={handleIframeLoad}
      onSetPreviewMode={setPreviewMode}
      domain={domain}
      onReset={handleReset}
      onSave={handleSave}
      saving={saving}
      message={message}
    />
  );
}

export default PersonalizacionClient;
