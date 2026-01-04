"use client";

import { useState, useCallback, useMemo } from "react";

// Types
type Theme = "light" | "dark" | "colorful" | "rustic" | "elegant" | "neuglass" | "neuglass-dark";
type Preset = "fine-dining" | "casual" | "fast-food" | "cafe-bistro";

interface Variants {
  hero: "classic" | "modern" | "bold" | "minimal";
  menu: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
}

interface CustomColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

interface WebsiteConfig {
  businessName?: string;
  businessType?: string;
  preset?: Preset;
  variants?: Variants;
  customColors?: CustomColors;
}

interface Props {
  websiteId: string;
  domain: string;
  initialTheme: Theme;
  initialConfig: WebsiteConfig;
}

// Theme data with visual info
const themes: { value: Theme; label: string; icon: string; colors: string[] }[] = [
  { value: "light", label: "Light", icon: "sun", colors: ["#f0f4f8", "#e2e8f0", "#3b82f6"] },
  { value: "dark", label: "Dark", icon: "moon", colors: ["#1a1a2e", "#2d2d44", "#6366f1"] },
  { value: "colorful", label: "Colorful", icon: "palette", colors: ["#fef3c7", "#fbbf24", "#10b981"] },
  { value: "rustic", label: "Rustic", icon: "leaf", colors: ["#d4a574", "#8b4513", "#654321"] },
  { value: "elegant", label: "Elegant", icon: "crown", colors: ["#f5f0e8", "#c9a96e", "#8b6914"] },
  { value: "neuglass", label: "NeuGlass", icon: "diamond", colors: ["#e8ecf1", "#6366f1", "#4f46e5"] },
  { value: "neuglass-dark", label: "NeuGlass Dark", icon: "sparkles", colors: ["#13151a", "#818cf8", "#6366f1"] },
];

const presets: { value: Preset; label: string; description: string }[] = [
  { value: "casual", label: "Casual", description: "Ambiente relajado y familiar" },
  { value: "fine-dining", label: "Fine Dining", description: "Elegante y sofisticado" },
  { value: "fast-food", label: "Fast Food", description: "Rapido y moderno" },
  { value: "cafe-bistro", label: "Cafe Bistro", description: "Acogedor y artistico" },
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
};

const defaultColors: CustomColors = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  background: "#e8ecf1",
  text: "#1a1a2e",
  accent: "#6366f1",
};

const defaultVariants: Variants = {
  hero: "classic",
  menu: "tabs",
  features: "cards",
  reviews: "grid",
  footer: "full",
};

// Icon components
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

export function PersonalizacionClient({
  websiteId,
  domain,
  initialTheme,
  initialConfig,
}: Props) {
  // State
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [preset, setPreset] = useState<Preset>(initialConfig.preset || "casual");
  const [variants, setVariants] = useState<Variants>(initialConfig.variants || defaultVariants);
  const [customColors, setCustomColors] = useState<CustomColors>(
    initialConfig.customColors || defaultColors
  );
  const [useCustomColors, setUseCustomColors] = useState(!!initialConfig.customColors);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Build preview URL with query params
  const previewUrl = useMemo(() => {
    const baseUrl = domain.startsWith("http") ? domain : `http://${domain}`;
    const params = new URLSearchParams();
    params.set("preview", "1");
    params.set("theme", theme);
    params.set("preset", preset);

    // Add variants
    Object.entries(variants).forEach(([key, value]) => {
      params.set(`v_${key}`, value);
    });

    // Add custom colors if enabled
    if (useCustomColors) {
      Object.entries(customColors).forEach(([key, value]) => {
        params.set(`c_${key}`, encodeURIComponent(value));
      });
    }

    return `${baseUrl}?${params.toString()}`;
  }, [domain, theme, preset, variants, customColors, useCustomColors]);

  // Handlers
  const handleVariantChange = useCallback((key: keyof Variants, value: string) => {
    setVariants(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleColorChange = useCallback((key: keyof CustomColors, value: string) => {
    setCustomColors(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const config: WebsiteConfig = {
        ...initialConfig,
        preset,
        variants,
        ...(useCustomColors ? { customColors } : {}),
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
      } else {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-1">Personalizacion</h1>
          <p className="text-[var(--text-secondary)]">
            Personaliza el aspecto de tu web en tiempo real
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="neumor-btn neumor-btn-accent px-8"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main Layout - Controls + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2">
          {/* Theme Selector */}
          <div className="neumor-card p-5">
            <h2 className="text-lg font-semibold mb-4">Tema Visual</h2>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`relative p-3 rounded-xl text-left transition-all ${
                    theme === t.value
                      ? "ring-2 ring-[var(--accent)] shadow-lg"
                      : "hover:shadow-md"
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
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Selector */}
          <div className="neumor-card p-5">
            <h2 className="text-lg font-semibold mb-4">Estilo de Restaurante</h2>
            <div className="space-y-2">
              {presets.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPreset(p.value)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    preset === p.value
                      ? "neumor-inset"
                      : "neumor-card-sm hover:shadow-lg"
                  }`}
                >
                  <div className="font-medium">{p.label}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{p.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div className="neumor-card p-5">
            <h2 className="text-lg font-semibold mb-4">Variantes de Secciones</h2>
            <div className="space-y-4">
              {(Object.keys(variantOptions) as (keyof Variants)[]).map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-2 capitalize">
                    {key === "hero" ? "Cabecera" :
                     key === "menu" ? "Menu" :
                     key === "features" ? "Caracteristicas" :
                     key === "reviews" ? "Resenas" : "Pie de pagina"}
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
          </div>

          {/* Custom Colors */}
          <div className="neumor-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Colores Personalizados</h2>
              <button
                onClick={() => setUseCustomColors(!useCustomColors)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  useCustomColors ? "bg-[var(--accent)]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    useCustomColors ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {useCustomColors && (
              <div className="space-y-3">
                {(Object.keys(defaultColors) as (keyof CustomColors)[]).map((key) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="w-24 text-sm font-medium capitalize">
                      {key === "primary" ? "Primario" :
                       key === "secondary" ? "Secundario" :
                       key === "background" ? "Fondo" :
                       key === "text" ? "Texto" : "Acento"}
                    </label>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={customColors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={customColors[key]}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="neumor-input flex-1 text-sm font-mono"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="lg:col-span-2 neumor-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Vista Previa</h2>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
            >
              Abrir en nueva pestana
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden border border-[var(--shadow-dark)]">
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[500px]"
              title="Vista previa del sitio"
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-2 text-center">
            Los cambios se reflejan automaticamente. Guarda para aplicarlos permanentemente.
          </p>
        </div>
      </div>
    </div>
  );
}
