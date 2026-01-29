// Themes - Configuraciones de temas neumorfico
// Re-export from supabase for consistency
export type { Theme } from "@neumorstudio/supabase";
import type { Theme } from "@neumorstudio/supabase";

export const themes: Record<Theme, string> = {
  // Base
  light: "",
  dark: "theme-dark",
  colorful: "theme-colorful",
  rustic: "theme-rustic",
  elegant: "theme-elegant",
  // Premium
  neuglass: "theme-neuglass",
  "neuglass-dark": "theme-neuglass-dark",
  // Seasonal
  christmas: "theme-christmas",
  summer: "theme-summer",
  autumn: "theme-autumn",
  spring: "theme-spring",
  // Mood/Style
  ocean: "theme-ocean",
  sunset: "theme-sunset",
  forest: "theme-forest",
  midnight: "theme-midnight",
  rose: "theme-rose",
  lavender: "theme-lavender",
  coral: "theme-coral",
  minimal: "theme-minimal",
  // Industry
  wellness: "theme-wellness",
  vintage: "theme-vintage",
};

export const defaultTheme: Theme = "light";
