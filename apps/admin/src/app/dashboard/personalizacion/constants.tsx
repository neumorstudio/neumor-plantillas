/**
 * Constantes para el modulo de personalizacion.
 * Extraido de personalizacion-client.tsx para mejor organizacion.
 */

import type { ColorsConfig, TypographyConfig, EffectsConfig } from "@neumorstudio/supabase";
import type { Variants, TabId } from "./types";
import { PaletteIcon, TextIcon, ImageIcon } from "@/components/icons";

// ============================================
// DEFAULT VALUES
// ============================================

export const defaultVariants: Variants = {
  hero: "classic",
  menu: "tabs",
  services: "tabs",
  features: "cards",
  reviews: "grid",
  footer: "full",
  reservation: "classic",
};

export const defaultColors: ColorsConfig = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  accent: "#10b981",
};

export const defaultTypography: TypographyConfig = {
  headingFont: "system",
  bodyFont: "system",
  baseFontSize: 16,
  scale: 1.25,
};

export const defaultEffects: EffectsConfig = {
  shadowIntensity: 60,
  borderRadius: "rounded",
  glassmorphism: false,
  blurIntensity: 16,
};

// ============================================
// TABS CONFIGURATION
// ============================================

export const tabs: { id: TabId; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: "diseno", label: "Diseño", shortLabel: "Diseño", icon: <PaletteIcon /> },
  { id: "textos", label: "Textos", shortLabel: "Textos", icon: <TextIcon /> },
  { id: "marca", label: "Marca", shortLabel: "Marca", icon: <ImageIcon /> },
  { id: "secciones", label: "Secciones", shortLabel: "Secciones", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg> },
];
