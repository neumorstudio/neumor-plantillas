// Tipos basados en el schema generado por Supabase.
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./database.types";

import type { Database as GeneratedDatabase } from "./database.types";

type PublicTables = GeneratedDatabase["public"]["Tables"];

// Business types supported
export type BusinessType =
  | "restaurant"
  | "clinic"
  | "salon"
  | "shop"
  | "fitness"
  | "realestate"
  | "repairs";

// Theme variants
export type Theme =
  // Base themes
  | "light"
  | "dark"
  | "colorful"
  | "rustic"
  | "elegant"
  // Premium NeuGlass
  | "neuglass"
  | "neuglass-dark"
  // Seasonal / Holiday
  | "christmas"
  | "summer"
  | "autumn"
  | "spring"
  // Mood / Style
  | "ocean"
  | "sunset"
  | "forest"
  | "midnight"
  | "rose"
  | "lavender"
  | "coral"
  | "minimal"
  // Industry specific
  | "wellness"
  | "vintage";

// Status types
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type LeadStatus = "new" | "contacted" | "converted" | "lost";
export type BookingSource = "website" | "phone" | "walkin" | "other";
export type LeadSource = "website" | "instagram" | "facebook" | "google" | "other";
export type ActivityEventType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "lead_created"
  | "lead_converted"
  | "notification_sent"
  | "reminder_sent";

// Job status types
export type JobStatus = "pending" | "in_progress" | "waiting_material" | "completed" | "cancelled";
export type JobPhotoType = "before" | "progress" | "after";

// Payment types
export type PaymentMethod = "cash" | "transfer" | "bizum" | "card";
export type PaymentStatus = "pending" | "paid" | "partial";

// Dashboard widget IDs
export type DashboardWidgetId =
  | "bookings_today"
  | "bookings_month"
  | "bookings_pending"
  | "leads_new"
  | "quotes_pending"
  | "quotes_accepted"
  | "jobs_active"
  | "payments_pending"
  | "orders_today"
  | "revenue_month";

// Admin section slugs
export type AdminSectionSlug =
  | "dashboard"
  | "reservas"
  | "leads"
  | "presupuestos"
  | "trabajos"
  | "clientes"
  | "pagos"
  | "newsletter"
  | "personalizacion"
  | "configuracion";

// ============================================
// CLIENTS
// ============================================
export type Client = PublicTables["clients"]["Row"];
export type ClientInsert = PublicTables["clients"]["Insert"];
export type ClientUpdate = PublicTables["clients"]["Update"];

// ============================================
// WEBSITES
// ============================================
export type Website = PublicTables["websites"]["Row"];
export type WebsiteInsert = PublicTables["websites"]["Insert"];
export type WebsiteUpdate = PublicTables["websites"]["Update"];

// ============================================
// BOOKINGS
// ============================================
export type Booking = PublicTables["bookings"]["Row"];
export type BookingInsert = PublicTables["bookings"]["Insert"];
export type BookingUpdate = PublicTables["bookings"]["Update"];

// ============================================
// LEADS
// ============================================
export type Lead = PublicTables["leads"]["Row"];
export type LeadInsert = PublicTables["leads"]["Insert"];
export type LeadUpdate = PublicTables["leads"]["Update"];

// ============================================
// NOTIFICATION SETTINGS
// ============================================
export type NotificationSettings = PublicTables["notification_settings"]["Row"];
export type NotificationSettingsInsert = PublicTables["notification_settings"]["Insert"];
export type NotificationSettingsUpdate = PublicTables["notification_settings"]["Update"];

// ============================================
// ACTIVITY LOG
// ============================================
export type ActivityLog = PublicTables["activity_log"]["Row"];
export type ActivityLogInsert = PublicTables["activity_log"]["Insert"];

// ============================================
// GOOGLE BUSINESS PROFILE
// ============================================
export type GoogleBusinessLocation = PublicTables["google_business_locations"]["Row"];
export type GoogleBusinessLocationInsert = PublicTables["google_business_locations"]["Insert"];
export type GoogleBusinessLocationUpdate = PublicTables["google_business_locations"]["Update"];

export type GoogleReviewCache = PublicTables["google_reviews_cache"]["Row"];
export type GoogleReviewCacheInsert = PublicTables["google_reviews_cache"]["Insert"];
export type GoogleReviewCacheUpdate = PublicTables["google_reviews_cache"]["Update"];

// ============================================
// BUSINESS TYPE CONFIG
// ============================================
export type BusinessTypeConfig = {
  business_type: BusinessType;
  label: string;
  visible_sections: AdminSectionSlug[];
  dashboard_widgets: DashboardWidgetId[];
  default_section: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================
// CUSTOMERS (CRM)
// ============================================
export type Customer = {
  id: string;
  website_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type CustomerInsert = Omit<Customer, "id" | "created_at" | "updated_at">;
export type CustomerUpdate = Partial<CustomerInsert>;

// ============================================
// JOBS (Trabajos)
// ============================================
export type Job = {
  id: string;
  website_id: string;
  quote_id: string | null;
  customer_id: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  address: string | null;
  description: string | null;
  status: JobStatus;
  estimated_end_date: string | null;
  actual_end_date: string | null;
  notes: string | null;
  total_amount: number | null;
  created_at: string;
  updated_at: string;
};
export type JobInsert = Omit<Job, "id" | "created_at" | "updated_at"> & {
  status?: JobStatus;
};
export type JobUpdate = Partial<JobInsert>;

// ============================================
// JOB TASKS (Checklist)
// ============================================
export type JobTask = {
  id: string;
  job_id: string;
  description: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
};
export type JobTaskInsert = Omit<JobTask, "id" | "created_at"> & {
  is_completed?: boolean;
  sort_order?: number;
};
export type JobTaskUpdate = Partial<JobTaskInsert>;

// ============================================
// JOB PHOTOS
// ============================================
export type JobPhoto = {
  id: string;
  job_id: string;
  url: string;
  type: JobPhotoType;
  description: string | null;
  taken_at: string;
  created_at: string;
};
export type JobPhotoInsert = Omit<JobPhoto, "id" | "created_at" | "taken_at"> & {
  taken_at?: string;
};
export type JobPhotoUpdate = Partial<JobPhotoInsert>;

// ============================================
// PAYMENTS (Pagos)
// ============================================
export type Payment = {
  id: string;
  website_id: string;
  job_id: string | null;
  quote_id: string | null;
  customer_id: string | null;
  client_name: string;
  amount: number;
  method: PaymentMethod | null;
  status: PaymentStatus;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type PaymentInsert = Omit<Payment, "id" | "created_at" | "updated_at"> & {
  status?: PaymentStatus;
};
export type PaymentUpdate = Partial<PaymentInsert>;

// ============================================
// WEBSITE CONFIG (para templates públicos)
// ============================================

/** Variantes de componentes para restaurant template */
export interface RestaurantVariants {
  hero: "classic" | "modern" | "bold" | "minimal";
  menu: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
  openStatus?: "pulse" | "morph" | "liquid" | "time";
  reservation?: "classic" | "wizard" | "modal" | "modern";
}

/** Variantes de componentes para salon template */
export interface SalonVariants {
  hero: "classic" | "modern" | "bold" | "minimal";
  services: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
}

/** Variantes de componentes para gym template */
export interface GymVariants {
  hero: "classic" | "modern" | "bold" | "minimal";
  classes: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
}

/** Variantes de componentes para store template */
export interface StoreVariants {
  hero: "classic" | "modern" | "bold" | "minimal";
  products: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
}

/** Variantes genéricas de componentes */
export type WebsiteVariants = RestaurantVariants | SalonVariants | GymVariants | StoreVariants;

/** Horario de un día específico */
export interface DaySchedule {
  open: string;
  close: string;
  closed?: boolean;
}

/** Horario semanal completo */
export type WeekSchedule = Record<string, DaySchedule>;

/** Configuración del componente OpenStatus */
export interface OpenStatusConfig {
  enabled: boolean;
  variant: "pulse" | "morph" | "liquid" | "time";
  position: "floating" | "inline" | "header";
  schedule: WeekSchedule;
  forceStatus?: "open" | "closed" | null;
  showScheduleInfo?: boolean;
  language?: "es" | "en";
}

/** Configuración de tipografía */
export interface TypographyConfig {
  headingFont?: string;   // Google Font name o "system"
  bodyFont?: string;      // Google Font name o "system"
  baseFontSize?: number;  // 14-18, default 16
  scale?: number;         // 1.125-1.333, default 1.25
}

/** Configuración de efectos visuales */
export interface EffectsConfig {
  shadowIntensity?: number;  // 0-100, default 60
  borderRadius?: 'sharp' | 'soft' | 'rounded' | 'pill';  // default 'rounded'
  glassmorphism?: boolean;   // default false (solo para neuglass themes)
  blurIntensity?: number;    // 8-24, default 16
}

/** Configuración de branding */
export interface BrandingConfig {
  logo?: string;           // URL del logo principal
  logoDark?: string;       // URL del logo para modo oscuro
  favicon?: string;        // URL del favicon
  logoSize?: 'sm' | 'md' | 'lg';  // Tamaño del logo, default 'md'
  logoDisplay?: 'logo' | 'name';  // Mostrar logo o nombre, default 'name'
}

/** Configuración de colores personalizados */
export interface ColorsConfig {
  primary?: string;        // Color principal de marca
  secondary?: string;      // Color secundario
  accent?: string;         // Color de acento/CTA
  background?: string;     // Color de fondo (override del tema)
  text?: string;           // Color de texto principal (override)
}

/** Fuentes de Google Fonts recomendadas */
export const RECOMMENDED_FONTS = [
  { value: 'system', label: 'Sistema (Por defecto)' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Work Sans', label: 'Work Sans' },
] as const;

/** Opciones de border radius */
export const BORDER_RADIUS_OPTIONS = [
  { value: 'sharp', label: 'Angular', css: '0.25rem' },
  { value: 'soft', label: 'Suave', css: '0.5rem' },
  { value: 'rounded', label: 'Redondeado', css: '1rem' },
  { value: 'pill', label: 'Pastilla', css: '9999px' },
] as const;

/** Item de feature/característica */
export interface FeatureItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  link?: string;
}

/** Configuración base del website */
export interface WebsiteConfig {
  // === INFORMACIÓN DEL NEGOCIO ===
  businessName?: string;
  businessType?: string;
  address?: string;
  phone?: string;
  email?: string;

  // === CONTENIDO HERO ===
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroImages?: string[]; // Galería de hasta 3 imágenes

  // === VARIANTES DE COMPONENTES ===
  variants?: WebsiteVariants;

  // === REDES SOCIALES ===
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tripadvisor?: string;
    whatsapp?: string;
    tiktok?: string;
    twitter?: string;
  };

  // === HORARIO ===
  schedule?: {
    weekdays?: string;
    saturday?: string;
    sunday?: string;
  };

  // === FEATURES/CARACTERÍSTICAS ===
  features?: {
    title?: string;
    subtitle?: string;
    items?: FeatureItem[];
  };

  // === GOOGLE BUSINESS ===
  googleRating?: number;
  totalReviews?: number;

  // === ESTADO ABIERTO/CERRADO ===
  openStatus?: OpenStatusConfig;

  // === PERSONALIZACIÓN VISUAL (NUEVO) ===

  /** Skin visual de componentes (neumorphic, flat, glass, material, brutalist, soft, 3d, outline) */
  skin?: string;

  /** Colores personalizados */
  colors?: ColorsConfig;

  /** Colores legacy (compatibilidad) */
  primaryColor?: string;
  secondaryColor?: string;

  /** Configuración de branding */
  branding?: BrandingConfig;

  /** Logo legacy (compatibilidad) */
  logo?: string;

  /** Configuración de tipografía */
  typography?: TypographyConfig;

  /** Efectos visuales */
  effects?: EffectsConfig;
}

/** Website con config tipada para uso en templates */
export interface WebsiteWithConfig {
  id: string;
  client_id: string;
  domain: string;
  theme: Theme;
  config: WebsiteConfig;
  is_active: boolean;
  clients?: {
    business_name?: string | null;
  } | null;
}

// ============================================
// MENU ITEMS (para restaurant template)
// ============================================
export interface MenuItemRow {
  id: string;
  website_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  tag?: string | null;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
}

// ============================================
// SERVICE ITEMS (para salon/clinic templates)
// ============================================
export interface ServiceCategory {
  id: string;
  website_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  items: ServiceItem[];
}

export interface ServiceItem {
  id: string;
  category_id: string;
  website_id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
}

// ============================================
// PROFESSIONALS (para salon template)
// ============================================
export interface Professional {
  id: string;
  website_id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProfessionalCategory {
  id?: string;
  website_id: string;
  professional_id: string;
  category_id: string;
}

// ============================================
// BUSINESS HOURS
// ============================================
export interface BusinessHour {
  id?: string;
  website_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface BusinessHourSlot {
  id?: string;
  website_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  sort_order: number;
  is_active: boolean;
}

// ============================================
// SPECIAL DAYS
// ============================================
export interface SpecialDay {
  id?: string;
  website_id: string;
  date: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  note: string | null;
}

export interface SpecialDaySlot {
  id?: string;
  special_day_id: string;
  open_time: string;
  close_time: string;
  sort_order: number;
}

// ============================================
// ORDER SETTINGS
// ============================================
export interface OrderSettings {
  pickup_start_time: string;
  pickup_end_time: string;
}
