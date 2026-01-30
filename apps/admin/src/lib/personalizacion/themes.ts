import type { Theme } from "@neumorstudio/supabase";

// ============================================
// THEME DATA
// ============================================

export interface ThemeOption {
  value: Theme;
  label: string;
  icon: string;
  colors: [string, string, string]; // [bg1, bg2, accent]
}

export interface ThemeCategory {
  label: string;
  themes: ThemeOption[];
}

// Temas válidos - debe coincidir con el type Theme de supabase
export const VALID_THEMES: Theme[] = [
  // Base
  "light",
  "dark",
  "colorful",
  "rustic",
  "elegant",
  // Premium NeuGlass
  "neuglass",
  "neuglass-dark",
  // Seasonal
  "christmas",
  "summer",
  "autumn",
  "spring",
  // Mood/Style
  "ocean",
  "sunset",
  "forest",
  "midnight",
  "rose",
  "lavender",
  "coral",
  "minimal",
  // Industry
  "wellness",
  "vintage",
];

// Theme categories for organized display
export const themeCategories: ThemeCategory[] = [
  {
    label: "Básicos",
    themes: [
      { value: "light", label: "Light", icon: "sun", colors: ["#f0f4f8", "#e2e8f0", "#3b82f6"] },
      { value: "dark", label: "Dark", icon: "moon", colors: ["#1a1a2e", "#2d2d44", "#6366f1"] },
      { value: "minimal", label: "Minimal", icon: "minus", colors: ["#f8f8f8", "#888888", "#333333"] },
    ]
  },
  {
    label: "Estilo",
    themes: [
      { value: "colorful", label: "Colorful", icon: "palette", colors: ["#fef3c7", "#fbbf24", "#10b981"] },
      { value: "rustic", label: "Rustic", icon: "leaf", colors: ["#d4a574", "#8b4513", "#654321"] },
      { value: "elegant", label: "Elegant", icon: "crown", colors: ["#f5f0e8", "#c9a96e", "#8b6914"] },
      { value: "vintage", label: "Vintage", icon: "camera", colors: ["#e8d4b8", "#8b7355", "#654321"] },
    ]
  },
  {
    label: "Premium",
    themes: [
      { value: "neuglass", label: "NeuGlass", icon: "diamond", colors: ["#e8ecf1", "#6366f1", "#4f46e5"] },
      { value: "neuglass-dark", label: "NeuGlass Dark", icon: "sparkles", colors: ["#13151a", "#818cf8", "#6366f1"] },
    ]
  },
  {
    label: "Estacionales",
    themes: [
      { value: "christmas", label: "Navidad", icon: "gift", colors: ["#f5ebe0", "#c41e3a", "#228b22"] },
      { value: "summer", label: "Verano", icon: "umbrella", colors: ["#fff8e7", "#00bcd4", "#ff7043"] },
      { value: "autumn", label: "Otoño", icon: "wind", colors: ["#e8d4b8", "#d2691e", "#8b4513"] },
      { value: "spring", label: "Primavera", icon: "flower", colors: ["#f0fff0", "#90ee90", "#ff69b4"] },
    ]
  },
  {
    label: "Naturaleza",
    themes: [
      { value: "ocean", label: "Océano", icon: "waves", colors: ["#e0f2f7", "#0097a7", "#00796b"] },
      { value: "forest", label: "Bosque", icon: "tree", colors: ["#e8f5e9", "#4caf50", "#2e7d32"] },
      { value: "sunset", label: "Atardecer", icon: "sunset", colors: ["#fff3e0", "#ff9800", "#e65100"] },
      { value: "midnight", label: "Medianoche", icon: "stars", colors: ["#1a237e", "#3f51b5", "#9575cd"] },
    ]
  },
  {
    label: "Suaves",
    themes: [
      { value: "rose", label: "Rosa", icon: "heart", colors: ["#fce4ec", "#f48fb1", "#e91e63"] },
      { value: "lavender", label: "Lavanda", icon: "sparkle", colors: ["#f3e5f5", "#ba68c8", "#8e24aa"] },
      { value: "coral", label: "Coral", icon: "circle", colors: ["#fbe9e7", "#ff8a65", "#ff5722"] },
      { value: "wellness", label: "Wellness", icon: "spa", colors: ["#e0f2f1", "#80cbc4", "#00897b"] },
    ]
  },
];

// Flatten themes for easy lookup
export const themes = themeCategories.flatMap(cat => cat.themes);

// Helper to check if a theme is valid
export function isValidTheme(theme: string): theme is Theme {
  return VALID_THEMES.includes(theme as Theme);
}
