"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { themes } from "@/lib/personalizacion";
import { ColorPicker } from "@/components/customization";
import { SegmentedControl } from "@/components/mobile";

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

  const getThemeDefaults = useCallback((nextTheme: Theme): ColorsConfig => {
    const themeOption = themes.find((t) => t.value === nextTheme);
    if (!themeOption) {
      return { ...defaultColors };
    }

    const [toneA, toneB, accent] = themeOption.colors;
    const base = toneB || toneA || defaultColors.primary;
    if (!base) {
      return { ...defaultColors };
    }

    const hexToRgb = (hex: string) => {
      const sanitized = hex.replace("#", "");
      const value = parseInt(sanitized, 16);
      return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
      };
    };

    const rgbToHex = (r: number, g: number, b: number) =>
      `#${[r, g, b]
        .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
        .join("")}`;

    const adjustLuminosity = (hex: string, percent: number) => {
      const { r, g, b } = hexToRgb(hex);
      const factor = percent / 100;
      return rgbToHex(
        r + (255 * factor),
        g + (255 * factor),
        b + (255 * factor),
      );
    };

    const luminance = (hex: string) => {
      const { r, g, b } = hexToRgb(hex);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };

    const isLight = luminance(base) > 0.6;
    const primary = adjustLuminosity(base, isLight ? -55 : 70);
    const secondary = adjustLuminosity(base, isLight ? -35 : 45);

    return {
      primary,
      secondary,
      accent: accent || defaultColors.accent,
    };
  }, []);

  const buildColorOverrides = useCallback(
    (config: WebsiteConfig) => {
      const resolved: ColorsConfig = {
        ...config.colors,
        primary: config.colors?.primary || config.primaryColor,
        secondary: config.colors?.secondary || config.secondaryColor,
      };

      const usesDefaults =
        !resolved.background &&
        !resolved.text &&
        (!resolved.primary || resolved.primary === defaultColors.primary) &&
        (!resolved.secondary || resolved.secondary === defaultColors.secondary) &&
        (!resolved.accent || resolved.accent === defaultColors.accent);

      return usesDefaults ? {} : resolved;
    },
    [],
  );

  // State
  const [activeTab, setActiveTab] = useState<TabId>("diseno");
  const [editorMode, setEditorMode] = useState<"quick" | "advanced">("advanced");
  const lastAdvancedTabRef = useRef<TabId>("diseno");
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [variants, setVariants] = useState<Variants>(initialConfig.variants as Variants || defaultVariants);
  const [colors, setColors] = useState<ColorsConfig>(() => buildColorOverrides(initialConfig));
  const displayColors = useMemo(() => ({
    ...getThemeDefaults(theme),
    ...colors,
  }), [colors, getThemeDefaults, theme]);
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
  const initialGalleryImages = Array.isArray((initialConfig as Record<string, unknown>).galleryImages)
    ? ((initialConfig as Record<string, unknown>).galleryImages as string[])
    : [];
  const initialBrandsLogos = Array.isArray((initialConfig as Record<string, unknown>).brandsLogos)
    ? ((initialConfig as Record<string, unknown>).brandsLogos as string[])
    : [];

  const [content, setContent] = useState<ContentConfig>({
    // Informacion del negocio
    businessName: initialConfig.businessName || "",
    // Hero section
    heroTitle: initialConfig.heroTitle || "",
    heroSubtitle: initialConfig.heroSubtitle || "",
    heroImage: initialConfig.heroImage || "",
    heroImages: initialHeroImages,
    heroCta: (initialConfig as Record<string, unknown>).heroCta as string || "",
    galleryImages: initialGalleryImages,
    brandsLogos: initialBrandsLogos,
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
    brandsTitle: (initialConfig as Record<string, unknown>).brandsTitle as string || "",
    brandsSubtitle: (initialConfig as Record<string, unknown>).brandsSubtitle as string || "",
    faqTitle: (initialConfig as Record<string, unknown>).faqTitle as string || "",
    faqSubtitle: (initialConfig as Record<string, unknown>).faqSubtitle as string || "",
    faqItems: (initialConfig as Record<string, unknown>).faqItems as { title: string; text: string }[] || [],
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
    orders: "orders",
    // Secciones sin variante correspondiente en Variants
    booking: "booking",
    contact: null,
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
    orders: "orders",
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
          if (sectionId === section.id) {
            const presetVariant = preset.variants[variantKey as keyof typeof preset.variants];
            if (presetVariant) {
              return { ...section, variant: presetVariant };
            }
          }
        }
        return section;
      }),
      updatedAt: new Date().toISOString(),
    }));
  }, [businessType]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  // Hook para manejar uploads de archivos
  const { uploading, uploadingHero, uploadingGallery, uploadingBrands, handleLogoUpload, handleHeroImageUpload, handleGalleryImageUpload, handleBrandsLogoUpload } = useFileUpload({
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
    const bookingVariant = getSectionVariant("booking", "classic");

    const enabledSectionIds = sectionsConfig.sections
      .filter((s) => s.enabled)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id)
      .join(",");

    const params = new URLSearchParams({
      preview: "1",
      v_sections: enabledSectionIds,
      v_hero: getSectionVariant("hero", variants.hero),
      v_features: getSectionVariant("features", variants.features),
      v_footer: getSectionVariant("footer", variants.footer),
      v_reviews: reviewsVariant,
      v_menu: menuVariant,
      v_reservation: reservationVariant,
      v_booking: bookingVariant,
      v_orders: getSectionVariant("orders", variants.orders),
      // Variantes de "services" segun template
      v_services: servicesVariant,
      v_products: servicesVariant,
      v_classes: servicesVariant,
      v_treatments: servicesVariant,
      // Variantes de secciones genericas
      v_team: getSectionVariant("team"),
      v_gallery: getSectionVariant("gallery"),
      v_brands: getSectionVariant("brands"),
      v_faq: getSectionVariant("faq"),
      v_plans: getSectionVariant("plans"),
      v_contact: getSectionVariant("contact"),
    });

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

  const configPayload = useMemo(() => {
    const normalizedHeroImages = content.heroImages || (content.heroImage ? [content.heroImage] : []);
    const normalizedHeroImage = normalizedHeroImages.includes(content.heroImage || "")
      ? content.heroImage
      : normalizedHeroImages[0] || "";

    return {
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
        items: features.items.map((item) => ({
          id: item.id,
          icon: item.icon,
          title: item.title,
          description: item.description,
        })),
      },
      ...content,
      heroImage: normalizedHeroImage,
      heroImages: normalizedHeroImages,
    };
  }, [
    branding,
    colors,
    content,
    effects,
    features,
    sectionsConfig,
    skin,
    typography,
    variants,
  ]);

  const serializedSnapshot = useMemo(
    () => JSON.stringify({ theme, config: configPayload }),
    [theme, configPayload]
  );

  const hasUnsavedChanges = !!savedSnapshot && savedSnapshot !== serializedSnapshot;

  useEffect(() => {
    if (!savedSnapshot) {
      setSavedSnapshot(serializedSnapshot);
    }
  }, [savedSnapshot, serializedSnapshot]);

  useEffect(() => {
    if (!savedNotice) return;
    const timeout = window.setTimeout(() => setSavedNotice(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [savedNotice]);

  useEffect(() => {
    if (hasUnsavedChanges && savedNotice) {
      setSavedNotice(false);
    }
  }, [hasUnsavedChanges, savedNotice]);


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
    setEffects(prev => {
      const newEffects = { ...prev, [key]: value };
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

  const handleRemoveGalleryImage = useCallback((url: string) => {
    setContent(prev => ({
      ...prev,
      galleryImages: (prev.galleryImages || []).filter(img => img !== url),
    }));
  }, []);

  const handleRemoveBrandsLogo = useCallback((url: string) => {
    setContent(prev => ({
      ...prev,
      brandsLogos: (prev.brandsLogos || []).filter(logo => logo !== url),
    }));
  }, []);

  const handleContentChange = useCallback(function handleContentChange<K extends keyof ContentConfig>(
    key: K,
    value: ContentConfig[K]
  ) {
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
      setColors(buildColorOverrides(initialConfig));
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
        galleryImages: Array.isArray((initialConfig as Record<string, unknown>).galleryImages)
          ? ((initialConfig as Record<string, unknown>).galleryImages as string[])
          : [],
        brandsLogos: Array.isArray((initialConfig as Record<string, unknown>).brandsLogos)
          ? ((initialConfig as Record<string, unknown>).brandsLogos as string[])
          : [],
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
        brandsTitle: (initialConfig as Record<string, unknown>).brandsTitle as string || "",
        brandsSubtitle: (initialConfig as Record<string, unknown>).brandsSubtitle as string || "",
        faqTitle: (initialConfig as Record<string, unknown>).faqTitle as string || "",
        faqSubtitle: (initialConfig as Record<string, unknown>).faqSubtitle as string || "",
        faqItems: (initialConfig as Record<string, unknown>).faqItems as { title: string; text: string }[] || [],
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
      setMessage({ type: "success", text: "Configuración restaurada" });
      setTimeout(() => setMessage(null), 2500);
    }
  }, [initialTheme, initialConfig, businessType, buildColorOverrides]);

  const handleThemeChange = useCallback((nextTheme: Theme) => {
    setTheme(nextTheme);
    setColors(getThemeDefaults(nextTheme));
    setActivePreset(null);
  }, [getThemeDefaults]);

  const handleSave = async () => {
    const snapshotAfterSave = serializedSnapshot;
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/personalizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          theme,
          config: configPayload,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Guardado" });
        setTimeout(() => setMessage(null), 2000);
        setSavedSnapshot(snapshotAfterSave);
        setSavedNotice(true);

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

  const handleEditorModeChange = (nextMode: "quick" | "advanced") => {
    if (nextMode === "quick") {
      lastAdvancedTabRef.current = activeTab;
      if (activeTab !== "diseno") {
        setActiveTab("diseno");
      }
    } else {
      setActiveTab(lastAdvancedTabRef.current);
    }
    setEditorMode(nextMode);
  };

  const quickControls = (
    <div className="space-y-5">
      <div className="neumor-inset p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold">Logo</h3>
        <label className={`flex items-center justify-center gap-3 p-4 border-2 border-dashed border-[var(--shadow-dark)] rounded-xl cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--shadow-light)] transition-all ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={handleLogoUpload}
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
        {branding.logo && (
          <div className="space-y-2">
            <div className="p-3 neumor-inset rounded-lg flex items-center justify-center">
              <img
                src={branding.logo}
                alt="Logo preview"
                className="max-h-16 max-w-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleBrandingChange("logo", "")}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Eliminar logo
            </button>
          </div>
        )}
      </div>

      <div className="neumor-inset p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold">Texto principal</h3>
        <div>
          <label className="block text-xs font-medium mb-2">Titulo principal</label>
          <input
            className="neumor-input w-full"
            value={content.heroTitle || ""}
            onChange={(event) => handleContentChange("heroTitle", event.target.value)}
            placeholder="Tu propuesta principal"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-2">Subtitulo</label>
          <textarea
            className="neumor-input w-full min-h-[90px] resize-none"
            value={content.heroSubtitle || ""}
            onChange={(event) => handleContentChange("heroSubtitle", event.target.value)}
            placeholder="Texto corto de apoyo"
          />
        </div>
      </div>

      <div className="neumor-inset p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold">Color de acento</h3>
        <ColorPicker
          label="Acento (botones y enlaces)"
          description="Elementos destacados, botones y enlaces"
          value={colors.accent || defaultColors.accent || "#10b981"}
          onChange={(value) => handleColorChange("accent", value)}
        />
      </div>
    </div>
  );

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      // ============================================
      // GRUPO 1: DISEÑO (Tema + Skin + Colores + Efectos + Tipografia)
      // ============================================
      case "diseno":
        return (
          <DesignTab
            businessType={businessType}
            theme={theme}
            skin={skin}
            activePreset={activePreset}
            colors={displayColors}
            effects={effects}
            typography={typography}
            isMobile={isMobile}
            onApplyPreset={applyPreset}
            onSetActivePreset={setActivePreset}
            onSetTheme={handleThemeChange}
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
            sections={sectionsConfig.sections}
            uploading={uploading}
            uploadingHero={uploadingHero}
            uploadingGallery={uploadingGallery}
            uploadingBrands={uploadingBrands}
            isMobile={isMobile}
            onBrandingChange={handleBrandingChange}
            onLogoUpload={handleLogoUpload}
            onSelectHeroImage={handleSelectHeroImage}
            onRemoveHeroImage={handleRemoveHeroImage}
            onHeroImageUpload={handleHeroImageUpload}
            onGalleryImageUpload={handleGalleryImageUpload}
            onRemoveGalleryImage={handleRemoveGalleryImage}
            onBrandsLogoUpload={handleBrandsLogoUpload}
            onRemoveBrandsLogo={handleRemoveBrandsLogo}
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
  const tabContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Modo</span>
        <SegmentedControl
          options={[
            { value: "quick", label: "Rápido" },
            { value: "advanced", label: "Avanzado" },
          ]}
          value={editorMode}
          onChange={handleEditorModeChange}
          size="sm"
        />
      </div>
      {editorMode === "quick" ? quickControls : renderTabContent()}
    </div>
  );

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
        hasUnsavedChanges={hasUnsavedChanges}
        savedNotice={savedNotice}
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
      hasUnsavedChanges={hasUnsavedChanges}
      savedNotice={savedNotice}
      message={message}
    />
  );
}

export default PersonalizacionClient;
