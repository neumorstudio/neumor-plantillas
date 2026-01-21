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
  | "realestate";

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
