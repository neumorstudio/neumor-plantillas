/**
 * Constantes para el modulo de personalizacion.
 * Extraido de personalizacion-client.tsx para mejor organizacion.
 */

import type { ColorsConfig, TypographyConfig, EffectsConfig } from "@neumorstudio/supabase";
import type { Variants, TabId } from "./types";
import { PaletteIcon, TextIcon } from "@/components/icons";

// ============================================
// DEFAULT VALUES
// ============================================

export const defaultVariants: Variants = {
  hero: "classic",
  menu: "tabs",
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
  { id: "diseno", label: "Diseno", shortLabel: "Diseno", icon: <PaletteIcon /> },
  { id: "contenido", label: "Contenido", shortLabel: "Textos", icon: <TextIcon /> },
  { id: "negocio", label: "Negocio", shortLabel: "Info", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { id: "secciones", label: "Secciones", shortLabel: "Secc", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg> },
  { id: "layout", label: "Layout", shortLabel: "Layout", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg> },
];
