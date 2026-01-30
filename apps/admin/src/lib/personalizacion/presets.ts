import type {
  Theme,
  ColorsConfig,
  TypographyConfig,
  EffectsConfig,
} from "@neumorstudio/supabase";

// ============================================
// TEMPLATE PRESETS - Combinaciones completas
// ============================================

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  preview: string; // CSS gradient para preview
  theme: Theme;
  skin: string;
  colors: ColorsConfig;
  typography: TypographyConfig;
  effects: EffectsConfig;
  variants: {
    hero: "classic" | "modern" | "bold" | "minimal";
    menu: "tabs" | "grid" | "list" | "carousel";
    features: "cards" | "icons" | "banner";
    reviews: "grid" | "carousel" | "minimal";
    footer: "full" | "minimal" | "centered";
    reservation: "classic" | "wizard" | "modal" | "modern";
  };
}

export const templatePresets: TemplatePreset[] = [
  {
    id: "moderno",
    name: "Moderno",
    description: "Limpio y contemporáneo",
    preview: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #3b82f6 100%)",
    theme: "minimal",
    skin: "flat",
    colors: { primary: "#3b82f6", secondary: "#64748b", accent: "#3b82f6" },
    typography: { headingFont: "Inter", bodyFont: "Inter", baseFontSize: 16, scale: 1.25 },
    effects: { shadowIntensity: 40, borderRadius: "soft", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "modern", menu: "grid", features: "icons", reviews: "minimal", footer: "minimal", reservation: "modern" },
  },
  {
    id: "elegante",
    name: "Elegante",
    description: "Sofisticado y lujoso",
    preview: "linear-gradient(135deg, #faf5f0 0%, #d4a574 50%, #8b6914 100%)",
    theme: "elegant",
    skin: "soft",
    colors: { primary: "#8b6914", secondary: "#d4a574", accent: "#c9a96e" },
    typography: { headingFont: "Playfair Display", bodyFont: "Lora", baseFontSize: 17, scale: 1.333 },
    effects: { shadowIntensity: 50, borderRadius: "rounded", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "modern", menu: "list", features: "cards", reviews: "carousel", footer: "centered", reservation: "wizard" },
  },
  {
    id: "llamativo",
    name: "Llamativo",
    description: "Vibrante y atrevido",
    preview: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #10b981 100%)",
    theme: "colorful",
    skin: "3d",
    colors: { primary: "#f59e0b", secondary: "#10b981", accent: "#f59e0b" },
    typography: { headingFont: "Poppins", bodyFont: "Poppins", baseFontSize: 16, scale: 1.25 },
    effects: { shadowIntensity: 70, borderRadius: "pill", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "bold", menu: "carousel", features: "banner", reviews: "grid", footer: "full", reservation: "modal" },
  },
  {
    id: "minimalista",
    name: "Minimalista",
    description: "Ultra limpio y simple",
    preview: "linear-gradient(135deg, #ffffff 0%, #f1f1f1 50%, #333333 100%)",
    theme: "minimal",
    skin: "outline",
    colors: { primary: "#171717", secondary: "#525252", accent: "#171717" },
    typography: { headingFont: "system", bodyFont: "system", baseFontSize: 15, scale: 1.2 },
    effects: { shadowIntensity: 20, borderRadius: "sharp", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "minimal", menu: "list", features: "icons", reviews: "minimal", footer: "minimal", reservation: "classic" },
  },
  {
    id: "acogedor",
    name: "Acogedor",
    description: "Cálido y familiar",
    preview: "linear-gradient(135deg, #fef3c7 0%, #d4a574 50%, #78350f 100%)",
    theme: "rustic",
    skin: "neumorphic",
    colors: { primary: "#78350f", secondary: "#a16207", accent: "#b45309" },
    typography: { headingFont: "Merriweather", bodyFont: "Source Sans Pro", baseFontSize: 17, scale: 1.25 },
    effects: { shadowIntensity: 55, borderRadius: "rounded", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "classic", menu: "tabs", features: "cards", reviews: "grid", footer: "full", reservation: "classic" },
  },
  {
    id: "premium",
    name: "Premium Glass",
    description: "Glassmorfismo elegante",
    preview: "linear-gradient(135deg, #e8ecf1 0%, #6366f1 50%, #4f46e5 100%)",
    theme: "neuglass",
    skin: "glass",
    colors: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#6366f1" },
    typography: { headingFont: "DM Sans", bodyFont: "DM Sans", baseFontSize: 16, scale: 1.25 },
    effects: { shadowIntensity: 60, borderRadius: "rounded", glassmorphism: true, blurIntensity: 16 },
    variants: { hero: "modern", menu: "grid", features: "cards", reviews: "carousel", footer: "centered", reservation: "wizard" },
  },
  {
    id: "nocturno",
    name: "Nocturno",
    description: "Elegancia oscura",
    preview: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #6366f1 100%)",
    theme: "midnight",
    skin: "material",
    colors: { primary: "#818cf8", secondary: "#a78bfa", accent: "#818cf8" },
    typography: { headingFont: "Space Grotesk", bodyFont: "Inter", baseFontSize: 16, scale: 1.25 },
    effects: { shadowIntensity: 45, borderRadius: "soft", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "bold", menu: "grid", features: "icons", reviews: "carousel", footer: "minimal", reservation: "modern" },
  },
  {
    id: "fresco",
    name: "Fresco",
    description: "Ligero y natural",
    preview: "linear-gradient(135deg, #ecfdf5 0%, #6ee7b7 50%, #059669 100%)",
    theme: "spring",
    skin: "soft",
    colors: { primary: "#059669", secondary: "#34d399", accent: "#10b981" },
    typography: { headingFont: "Quicksand", bodyFont: "Nunito", baseFontSize: 16, scale: 1.25 },
    effects: { shadowIntensity: 45, borderRadius: "rounded", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "classic", menu: "carousel", features: "cards", reviews: "grid", footer: "full", reservation: "wizard" },
  },
  {
    id: "verano",
    name: "Verano",
    description: "Playa y sol",
    preview: "linear-gradient(135deg, #fef3c7 0%, #38bdf8 50%, #f97316 100%)",
    theme: "summer",
    skin: "3d",
    colors: { primary: "#0891b2", secondary: "#f97316", accent: "#f97316" },
    typography: { headingFont: "Pacifico", bodyFont: "Open Sans", baseFontSize: 16, scale: 1.25 },
    effects: { shadowIntensity: 50, borderRadius: "pill", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "bold", menu: "carousel", features: "banner", reviews: "carousel", footer: "centered", reservation: "modal" },
  },
  {
    id: "navidad",
    name: "Navidad",
    description: "Festivo y acogedor",
    preview: "linear-gradient(135deg, #fef2f2 0%, #dc2626 50%, #16a34a 100%)",
    theme: "christmas",
    skin: "neumorphic",
    colors: { primary: "#dc2626", secondary: "#16a34a", accent: "#dc2626" },
    typography: { headingFont: "Playfair Display", bodyFont: "Lora", baseFontSize: 17, scale: 1.25 },
    effects: { shadowIntensity: 55, borderRadius: "rounded", glassmorphism: false, blurIntensity: 16 },
    variants: { hero: "classic", menu: "tabs", features: "cards", reviews: "grid", footer: "full", reservation: "wizard" },
  },
];

// Helper to get preset by id
export function getPresetById(id: string): TemplatePreset | undefined {
  return templatePresets.find(p => p.id === id);
}
