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
  | "dark"
  | "light"
  | "colorful"
  | "rustic"
  | "elegant"
  | "neuglass"
  | "neuglass-dark";

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
