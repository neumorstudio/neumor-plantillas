/**
 * Types para el modulo de personalizacion.
 * Extraido de personalizacion-client.tsx para mejor organizacion.
 */

import type { Theme, WebsiteConfig, BusinessType } from "@neumorstudio/supabase";

// ============================================
// TYPES
// ============================================

export interface Variants {
  hero: "classic" | "modern" | "bold" | "minimal" | "fullscreen" | "split";
  menu: "tabs" | "grid" | "list" | "carousel";
  services: "tabs" | "grid" | "list" | "carousel"; // salon, clinic, fitness, shop, repairs
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
  reservation: "classic" | "wizard" | "modal" | "modern";
}

export interface Props {
  websiteId: string;
  domain: string;
  initialTheme: Theme;
  initialConfig: WebsiteConfig;
  businessType?: BusinessType;
}

export type TabId = "diseno" | "contenido" | "negocio" | "secciones" | "layout";

export interface ContentConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroImages?: string[]; // Galeria de hasta 3 imagenes
  address?: string;
  phone?: string;
  email?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    tripadvisor?: string;
  };
  schedule?: {
    weekdays?: string;
    saturday?: string;
    sunday?: string;
  };
}

export interface FeatureItemConfig {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesConfig {
  title: string;
  subtitle: string;
  items: FeatureItemConfig[];
}
