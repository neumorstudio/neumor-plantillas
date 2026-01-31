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

export type TabId = "diseno" | "textos" | "marca" | "secciones";

export interface ContentConfig {
  // Informacion del negocio
  businessName?: string;

  // Hero section
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroImages?: string[]; // Galeria de hasta 3 imagenes
  heroCta?: string; // Texto del boton CTA

  // Contacto
  address?: string;
  phone?: string;
  email?: string;

  // Redes Sociales
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    tripadvisor?: string;
    tiktok?: string;
    twitter?: string;
  };

  // Horario
  schedule?: {
    weekdays?: string;
    saturday?: string;
    sunday?: string;
  };

  // Seccion Reviews/Testimonios
  reviewsTitle?: string;
  reviewsSubtitle?: string;

  // Secciones genericas
  teamTitle?: string;
  teamSubtitle?: string;
  galleryTitle?: string;
  gallerySubtitle?: string;
  faqTitle?: string;
  faqSubtitle?: string;
  plansTitle?: string;
  plansSubtitle?: string;
  contactTitle?: string;
  contactSubtitle?: string;
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
