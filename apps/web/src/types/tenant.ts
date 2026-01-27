export type BusinessType =
  | "restaurant"
  | "salon"
  | "gym"
  | "clinic"
  | "repairs"
  | "store"
  | "fitness";

export type Theme =
  | "light"
  | "dark"
  | "colorful"
  | "rustic"
  | "elegant"
  | "neuglass"
  | "neuglass-dark";

export interface WebsiteVariants {
  hero: "classic" | "modern" | "bold" | "minimal";
  mainContent: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
}

export interface WebsiteConfig {
  businessName?: string;
  tagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  address?: string;
  phone?: string;
  email?: string;
  variants?: Partial<WebsiteVariants>;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    google?: string;
  };
}

export interface Website {
  id: string;
  client_id: string;
  subdomain: string | null;
  custom_domain: string | null;
  domain_status: "subdomain" | "custom";
  theme: Theme;
  config: WebsiteConfig;
  is_active: boolean;
  business_type: BusinessType;
}

export interface TenantContext {
  website: Website;
  isPreview: boolean;
}
