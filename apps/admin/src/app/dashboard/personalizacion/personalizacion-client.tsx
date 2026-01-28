"use client";

import { useState, useCallback, useMemo } from "react";
import { ColorPicker, FontSelector, SliderControl, OptionSelector } from "@/components/customization";
import type {
  Theme,
  WebsiteConfig,
  ColorsConfig,
  TypographyConfig,
  EffectsConfig,
  BrandingConfig,
} from "@neumorstudio/supabase";

// ============================================
// TYPES
// ============================================

interface Variants {
  hero: "classic" | "modern" | "bold" | "minimal";
  menu: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
  reservation: "classic" | "wizard" | "modal" | "modern";
}

interface Props {
  websiteId: string;
  domain: string;
  initialTheme: Theme;
  initialConfig: WebsiteConfig;
}

type TabId = "temas" | "colores" | "tipografia" | "secciones" | "branding" | "efectos" | "contenido";

interface ContentConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  address?: string;
  phone?: string;
  email?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    tripadvisor?: string;
  };
}

// ============================================
// THEME DATA
// ============================================

const themes: { value: Theme; label: string; icon: string; colors: string[] }[] = [
  { value: "light", label: "Light", icon: "sun", colors: ["#f0f4f8", "#e2e8f0", "#3b82f6"] },
  { value: "dark", label: "Dark", icon: "moon", colors: ["#1a1a2e", "#2d2d44", "#6366f1"] },
  { value: "colorful", label: "Colorful", icon: "palette", colors: ["#fef3c7", "#fbbf24", "#10b981"] },
  { value: "rustic", label: "Rustic", icon: "leaf", colors: ["#d4a574", "#8b4513", "#654321"] },
  { value: "elegant", label: "Elegant", icon: "crown", colors: ["#f5f0e8", "#c9a96e", "#8b6914"] },
  { value: "neuglass", label: "NeuGlass", icon: "diamond", colors: ["#e8ecf1", "#6366f1", "#4f46e5"] },
  { value: "neuglass-dark", label: "NeuGlass Dark", icon: "sparkles", colors: ["#13151a", "#818cf8", "#6366f1"] },
];

const variantOptions = {
  hero: [
    { value: "classic", label: "Clasico" },
    { value: "modern", label: "Moderno" },
    { value: "bold", label: "Llamativo" },
    { value: "minimal", label: "Minimalista" },
  ],
  menu: [
    { value: "tabs", label: "Pestanas" },
    { value: "grid", label: "Cuadricula" },
    { value: "list", label: "Lista" },
    { value: "carousel", label: "Carrusel" },
  ],
  features: [
    { value: "cards", label: "Tarjetas" },
    { value: "icons", label: "Iconos" },
    { value: "banner", label: "Banner" },
  ],
  reviews: [
    { value: "grid", label: "Cuadricula" },
    { value: "carousel", label: "Carrusel" },
    { value: "minimal", label: "Minimalista" },
  ],
  footer: [
    { value: "full", label: "Completo" },
    { value: "minimal", label: "Minimalista" },
    { value: "centered", label: "Centrado" },
  ],
  reservation: [
    { value: "classic", label: "Clasico" },
    { value: "wizard", label: "Asistente" },
    { value: "modal", label: "Modal" },
    { value: "modern", label: "Moderno" },
  ],
};

const defaultVariants: Variants = {
  hero: "classic",
  menu: "tabs",
  features: "cards",
  reviews: "grid",
  footer: "full",
  reservation: "classic",
};

const defaultColors: ColorsConfig = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#10b981",
};

const defaultTypography: TypographyConfig = {
  headingFont: "system",
  bodyFont: "system",
  baseFontSize: 16,
  scale: 1.25,
};

const defaultEffects: EffectsConfig = {
  shadowIntensity: 60,
  borderRadius: "rounded",
  glassmorphism: false,
  blurIntensity: 16,
};

// ============================================
// ICONS
// ============================================

function SunIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="4"/><path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>;
}
function MoonIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>;
}
function PaletteIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>;
}
function LeafIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
}
function CrownIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l3.5 7L12 6l3.5 4L19 3v14a2 2 0 01-2 2H7a2 2 0 01-2-2V3z"/></svg>;
}
function DiamondIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l9 9-9 9-9-9 9-9z"/></svg>;
}
function SparklesIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>;
}
function CheckIcon() {
  return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
}
function ExternalLinkIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
}
function ResetIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
}
function DesktopIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
}
function TabletIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}
function MobileIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
}
function TextIcon() {
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>;
}

function getThemeIcon(icon: string) {
  switch (icon) {
    case "sun": return <SunIcon />;
    case "moon": return <MoonIcon />;
    case "palette": return <PaletteIcon />;
    case "leaf": return <LeafIcon />;
    case "crown": return <CrownIcon />;
    case "diamond": return <DiamondIcon />;
    case "sparkles": return <SparklesIcon />;
    default: return <SunIcon />;
  }
}

// ============================================
// TABS
// ============================================

const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "temas", label: "Temas", icon: <PaletteIcon /> },
  { id: "colores", label: "Colores", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg> },
  { id: "tipografia", label: "Tipografia", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" /></svg> },
  { id: "secciones", label: "Secciones", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
  { id: "branding", label: "Marca", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
  { id: "efectos", label: "Efectos", icon: <SparklesIcon /> },
  { id: "contenido", label: "Contenido", icon: <TextIcon /> },
];

// ============================================
// MAIN COMPONENT
// ============================================

export function PersonalizacionClient({
  websiteId,
  domain,
  initialTheme,
  initialConfig,
}: Props) {
  // State
  const [activeTab, setActiveTab] = useState<TabId>("temas");
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
    logo: initialConfig.branding?.logo || initialConfig.logo,
    ...initialConfig.branding,
  });
  const [content, setContent] = useState<ContentConfig>({
    heroTitle: initialConfig.heroTitle || "",
    heroSubtitle: initialConfig.heroSubtitle || "",
    heroImage: initialConfig.heroImage || "",
    address: initialConfig.address || "",
    phone: initialConfig.phone || "",
    email: initialConfig.email || "",
    socialLinks: initialConfig.socialLinks || {},
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Build preview URL
  const previewUrl = useMemo(() => {
    const baseUrl = `https://${domain}`;
    const params = new URLSearchParams();
    params.set("preview", "1");
    params.set("theme", theme);

    // Add variants
    Object.entries(variants).forEach(([key, value]) => {
      params.set(`v_${key}`, value);
    });

    // Add custom colors
    if (colors.primary) params.set("c_primary", colors.primary);
    if (colors.secondary) params.set("c_secondary", colors.secondary);
    if (colors.accent) params.set("c_accent", colors.accent);

    // Add typography
    if (typography.headingFont && typography.headingFont !== "system") {
      params.set("t_heading", typography.headingFont);
    }
    if (typography.bodyFont && typography.bodyFont !== "system") {
      params.set("t_body", typography.bodyFont);
    }
    if (typography.baseFontSize) {
      params.set("t_size", String(typography.baseFontSize));
    }

    // Add effects
    if (effects.shadowIntensity !== undefined) {
      params.set("e_shadow", String(effects.shadowIntensity));
    }
    if (effects.borderRadius) {
      params.set("e_radius", effects.borderRadius);
    }
    if (effects.glassmorphism) {
      params.set("e_glass", "1");
      if (effects.blurIntensity) {
        params.set("e_blur", String(effects.blurIntensity));
      }
    }

    return `${baseUrl}?${params.toString()}`;
  }, [domain, theme, variants, colors, typography, effects]);

  // Preview dimensions
  const previewDimensions = useMemo(() => {
    switch (previewMode) {
      case "tablet": return { width: "768px", height: "100%" };
      case "mobile": return { width: "375px", height: "100%" };
      default: return { width: "100%", height: "100%" };
    }
  }, [previewMode]);

  // Handlers
  const handleVariantChange = useCallback((key: keyof Variants, value: string) => {
    setVariants(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleColorChange = useCallback((key: keyof ColorsConfig, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleTypographyChange = useCallback((key: keyof TypographyConfig, value: string | number) => {
    setTypography(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleEffectsChange = useCallback((key: keyof EffectsConfig, value: number | string | boolean) => {
    setEffects(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleBrandingChange = useCallback((key: keyof BrandingConfig, value: string) => {
    setBranding(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleContentChange = useCallback((key: keyof ContentConfig, value: string | ContentConfig["socialLinks"]) => {
    setContent(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleReset = useCallback(() => {
    if (confirm("Esto restaurara todos los valores por defecto. ¿Continuar?")) {
      setTheme("light");
      setVariants(defaultVariants);
      setColors(defaultColors);
      setTypography(defaultTypography);
      setEffects(defaultEffects);
      setBranding({});
      setContent({});
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const config: Partial<WebsiteConfig> = {
        variants,
        colors,
        typography,
        effects,
        branding,
        ...content,
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
        setMessage({ type: "success", text: "Personalizacion guardada correctamente" });
        setTimeout(() => setMessage(null), 3000);
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
      case "temas":
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Selecciona un tema base para tu web. Podras personalizarlo mas en las otras pestanas.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`relative p-3 rounded-xl text-left transition-all ${
                    theme === t.value
                      ? "ring-2 ring-[var(--accent)] shadow-lg scale-[1.02]"
                      : "hover:shadow-md hover:scale-[1.01]"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: t.colors[2] }}>{getThemeIcon(t.icon)}</span>
                    <span className="text-sm font-medium" style={{ color: t.colors[2] }}>
                      {t.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {t.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/30"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {theme === t.value && (
                    <div className="absolute top-2 right-2 text-[var(--accent)]">
                      <CheckIcon />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case "colores":
        return (
          <div className="space-y-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Personaliza los colores de tu marca. Estos colores se aplicaran sobre el tema seleccionado.
            </p>
            <ColorPicker
              label="Color Principal"
              description="El color principal de tu marca, usado en elementos destacados"
              value={colors.primary || defaultColors.primary!}
              onChange={(v) => handleColorChange("primary", v)}
            />
            <ColorPicker
              label="Color Secundario"
              description="Usado para acentos y elementos complementarios"
              value={colors.secondary || defaultColors.secondary!}
              onChange={(v) => handleColorChange("secondary", v)}
            />
            <ColorPicker
              label="Color de Acento"
              description="Para botones de accion y llamadas a la accion"
              value={colors.accent || defaultColors.accent!}
              onChange={(v) => handleColorChange("accent", v)}
            />
          </div>
        );

      case "tipografia":
        return (
          <div className="space-y-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Elige las fuentes y tamanos de texto para tu web.
            </p>
            <FontSelector
              label="Fuente de Titulos"
              description="Se usa en titulos y encabezados"
              value={typography.headingFont || "system"}
              onChange={(v) => handleTypographyChange("headingFont", v)}
            />
            <FontSelector
              label="Fuente de Texto"
              description="Se usa en parrafos y texto general"
              value={typography.bodyFont || "system"}
              onChange={(v) => handleTypographyChange("bodyFont", v)}
            />
            <SliderControl
              label="Tamano Base"
              description="Tamano del texto base en pixels"
              value={typography.baseFontSize || 16}
              onChange={(v) => handleTypographyChange("baseFontSize", v)}
              min={14}
              max={20}
              step={1}
              unit="px"
            />
          </div>
        );

      case "secciones":
        return (
          <div className="space-y-5">
            <p className="text-sm text-[var(--text-secondary)]">
              Elige como se muestran las diferentes secciones de tu web.
            </p>
            {(Object.keys(variantOptions) as (keyof Variants)[]).map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-2 capitalize">
                  {key === "hero" ? "Cabecera" :
                   key === "menu" ? "Menu" :
                   key === "features" ? "Caracteristicas" :
                   key === "reviews" ? "Resenas" :
                   key === "footer" ? "Pie de pagina" : "Reservas"}
                </label>
                <select
                  value={variants[key]}
                  onChange={(e) => handleVariantChange(key, e.target.value)}
                  className="neumor-input w-full"
                >
                  {variantOptions[key].map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        );

      case "branding":
        return (
          <div className="space-y-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Configura el logo y elementos de marca de tu negocio.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">URL del Logo</label>
              <p className="text-xs text-[var(--text-secondary)] mb-2">
                Introduce la URL de tu logo (recomendado: PNG o SVG transparente)
              </p>
              <input
                type="url"
                value={branding.logo || ""}
                onChange={(e) => handleBrandingChange("logo", e.target.value)}
                placeholder="https://ejemplo.com/logo.png"
                className="neumor-input w-full"
              />
              {branding.logo && (
                <div className="mt-3 p-4 neumor-inset rounded-lg flex items-center justify-center">
                  <img
                    src={branding.logo}
                    alt="Logo preview"
                    className="max-h-16 max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <OptionSelector
              label="Tamano del Logo"
              value={branding.logoSize || "md"}
              onChange={(v) => handleBrandingChange("logoSize", v)}
              options={[
                { value: "sm", label: "Pequeno" },
                { value: "md", label: "Mediano" },
                { value: "lg", label: "Grande" },
              ]}
              columns={3}
            />
          </div>
        );

      case "efectos":
        return (
          <div className="space-y-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Ajusta los efectos visuales de tu web.
            </p>
            <SliderControl
              label="Intensidad de Sombras"
              description="Controla la fuerza del efecto neumorfico"
              value={effects.shadowIntensity || 60}
              onChange={(v) => handleEffectsChange("shadowIntensity", v)}
              min={0}
              max={100}
              step={5}
              unit="%"
            />
            <OptionSelector
              label="Bordes Redondeados"
              value={effects.borderRadius || "rounded"}
              onChange={(v) => handleEffectsChange("borderRadius", v)}
              options={[
                { value: "sharp", label: "Angular", preview: <div className="w-8 h-8 bg-[var(--accent)] rounded-sm" /> },
                { value: "soft", label: "Suave", preview: <div className="w-8 h-8 bg-[var(--accent)] rounded-md" /> },
                { value: "rounded", label: "Redondeado", preview: <div className="w-8 h-8 bg-[var(--accent)] rounded-xl" /> },
                { value: "pill", label: "Pastilla", preview: <div className="w-8 h-8 bg-[var(--accent)] rounded-full" /> },
              ]}
              columns={4}
            />
            {(theme === "neuglass" || theme === "neuglass-dark") && (
              <>
                <div className="flex items-center justify-between p-4 neumor-inset rounded-lg">
                  <div>
                    <p className="font-medium">Efecto Glassmorphism</p>
                    <p className="text-xs text-[var(--text-secondary)]">Fondo difuminado tipo cristal</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEffectsChange("glassmorphism", !effects.glassmorphism)}
                    className="neumor-toggle"
                    data-active={effects.glassmorphism}
                  >
                    <span className="neumor-toggle-knob" />
                  </button>
                </div>
                {effects.glassmorphism && (
                  <SliderControl
                    label="Intensidad del Blur"
                    value={effects.blurIntensity || 16}
                    onChange={(v) => handleEffectsChange("blurIntensity", v)}
                    min={8}
                    max={32}
                    step={2}
                    unit="px"
                  />
                )}
              </>
            )}
          </div>
        );

      case "contenido":
        return (
          <div className="space-y-6">
            <p className="text-sm text-[var(--text-secondary)]">
              Personaliza los textos y contenido de tu web.
            </p>

            {/* Hero Section */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b border-[var(--shadow-dark)] pb-2">Seccion Principal</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Titulo Principal</label>
                <input
                  type="text"
                  value={content.heroTitle || ""}
                  onChange={(e) => handleContentChange("heroTitle", e.target.value)}
                  placeholder="Tu titulo aqui..."
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Subtitulo</label>
                <textarea
                  value={content.heroSubtitle || ""}
                  onChange={(e) => handleContentChange("heroSubtitle", e.target.value)}
                  placeholder="Descripcion breve de tu negocio..."
                  className="neumor-input w-full resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Imagen de Fondo</label>
                <input
                  type="url"
                  value={content.heroImage || ""}
                  onChange={(e) => handleContentChange("heroImage", e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="neumor-input w-full"
                />
                {content.heroImage && (
                  <div className="mt-2 rounded-lg overflow-hidden h-24">
                    <img
                      src={content.heroImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b border-[var(--shadow-dark)] pb-2">Informacion de Contacto</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Direccion</label>
                <input
                  type="text"
                  value={content.address || ""}
                  onChange={(e) => handleContentChange("address", e.target.value)}
                  placeholder="Calle, numero, ciudad..."
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Telefono</label>
                <input
                  type="tel"
                  value={content.phone || ""}
                  onChange={(e) => handleContentChange("phone", e.target.value)}
                  placeholder="+34 600 000 000"
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={content.email || ""}
                  onChange={(e) => handleContentChange("email", e.target.value)}
                  placeholder="contacto@tunegocio.com"
                  className="neumor-input w-full"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm border-b border-[var(--shadow-dark)] pb-2">Redes Sociales</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Instagram</label>
                <input
                  type="url"
                  value={content.socialLinks?.instagram || ""}
                  onChange={(e) => handleContentChange("socialLinks", {
                    ...content.socialLinks,
                    instagram: e.target.value
                  })}
                  placeholder="https://instagram.com/tunegocio"
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Facebook</label>
                <input
                  type="url"
                  value={content.socialLinks?.facebook || ""}
                  onChange={(e) => handleContentChange("socialLinks", {
                    ...content.socialLinks,
                    facebook: e.target.value
                  })}
                  placeholder="https://facebook.com/tunegocio"
                  className="neumor-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input
                  type="url"
                  value={content.socialLinks?.whatsapp || ""}
                  onChange={(e) => handleContentChange("socialLinks", {
                    ...content.socialLinks,
                    whatsapp: e.target.value
                  })}
                  placeholder="https://wa.me/34600000000"
                  className="neumor-input w-full"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
        <div className="xl:col-span-7 neumor-card p-4 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Vista Previa</h2>
            <div className="flex items-center gap-2">
              {/* Preview mode buttons */}
              <div className="flex neumor-inset rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`p-2 rounded-lg transition-all ${
                    previewMode === "desktop" ? "bg-[var(--accent)] text-white" : ""
                  }`}
                  title="Desktop"
                >
                  <DesktopIcon />
                </button>
                <button
                  onClick={() => setPreviewMode("tablet")}
                  className={`p-2 rounded-lg transition-all ${
                    previewMode === "tablet" ? "bg-[var(--accent)] text-white" : ""
                  }`}
                  title="Tablet"
                >
                  <TabletIcon />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`p-2 rounded-lg transition-all ${
                    previewMode === "mobile" ? "bg-[var(--accent)] text-white" : ""
                  }`}
                  title="Mobile"
                >
                  <MobileIcon />
                </button>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="neumor-btn p-2 text-[var(--accent)]"
                title="Abrir en nueva pestana"
              >
                <ExternalLinkIcon />
              </a>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center bg-[var(--shadow-dark)] rounded-xl overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{
                width: previewDimensions.width,
                maxWidth: "100%",
              }}
            >
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Vista previa del sitio"
              />
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
            {domain}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PersonalizacionClient;
