// Tipos de la base de datos - Se generaran con supabase gen types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Business types supported
export type BusinessType =
  | "restaurant"
  | "clinic"
  | "salon"
  | "shop"
  | "fitness"
  | "realestate";

// Theme variants
export type Theme = "dark" | "light" | "colorful" | "rustic" | "elegant";

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
export interface Client {
  id: string;
  email: string;
  business_name: string;
  business_type: BusinessType;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
export type ClientUpdate = Partial<ClientInsert>;

// ============================================
// WEBSITES
// ============================================
export interface Website {
  id: string;
  client_id: string;
  domain: string;
  theme: Theme;
  config: Json;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type WebsiteInsert = Omit<Website, "id" | "created_at" | "updated_at">;
export type WebsiteUpdate = Partial<Omit<WebsiteInsert, "client_id">>;

// ============================================
// BOOKINGS
// ============================================
export interface Booking {
  id: string;
  website_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  booking_date: string; // YYYY-MM-DD
  booking_time: string; // HH:MM
  guests: number;
  notes: string | null;
  status: BookingStatus;
  source: BookingSource;
  created_at: string;
  updated_at: string;
}

export type BookingInsert = Omit<Booking, "id" | "created_at" | "updated_at"> & {
  status?: BookingStatus;
  source?: BookingSource;
  guests?: number;
};
export type BookingUpdate = Partial<Omit<BookingInsert, "website_id">>;

// ============================================
// LEADS
// ============================================
export interface Lead {
  id: string;
  website_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export type LeadInsert = Omit<Lead, "id" | "created_at" | "updated_at"> & {
  status?: LeadStatus;
  source?: LeadSource;
};
export type LeadUpdate = Partial<Omit<LeadInsert, "website_id">>;

// ============================================
// NOTIFICATION SETTINGS
// ============================================
export interface NotificationSettings {
  id: string;
  website_id: string;
  email_booking_confirmation: boolean;
  whatsapp_booking_confirmation: boolean;
  reminder_24h: boolean;
  reminder_time: string; // HH:MM
  email_new_lead: boolean;
  whatsapp_new_lead: boolean;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export type NotificationSettingsInsert = Omit<
  NotificationSettings,
  "id" | "created_at" | "updated_at"
>;
export type NotificationSettingsUpdate = Partial<
  Omit<NotificationSettingsInsert, "website_id">
>;

// ============================================
// ACTIVITY LOG
// ============================================
export interface ActivityLog {
  id: string;
  website_id: string;
  event_type: ActivityEventType;
  event_data: Json;
  created_at: string;
}

export type ActivityLogInsert = Omit<ActivityLog, "id" | "created_at">;

// ============================================
// GOOGLE BUSINESS PROFILE
// ============================================

export interface GoogleBusinessLocation {
  id: string;
  social_account_id: string;
  account_name: string;
  location_name: string;
  title: string;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  is_verified: boolean;
  is_selected: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export type GoogleBusinessLocationInsert = Omit<GoogleBusinessLocation, "id" | "created_at" | "updated_at"> & {
  is_verified?: boolean;
  is_selected?: boolean;
  metadata?: Json;
};
export type GoogleBusinessLocationUpdate = Partial<Omit<GoogleBusinessLocationInsert, "social_account_id">>;

export interface GoogleReviewCache {
  id: string;
  location_id: string;
  review_name: string;
  reviewer_name: string | null;
  reviewer_photo_url: string | null;
  star_rating: number | null;
  comment: string | null;
  reply_comment: string | null;
  reply_updated_at: string | null;
  review_created_at: string | null;
  review_updated_at: string | null;
  cached_at: string;
}

export type GoogleReviewCacheInsert = Omit<GoogleReviewCache, "id" | "cached_at">;
export type GoogleReviewCacheUpdate = Partial<Omit<GoogleReviewCacheInsert, "location_id">>;

// ============================================
// DATABASE TYPE (for Supabase client)
// ============================================
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: ClientInsert;
        Update: ClientUpdate;
      };
      websites: {
        Row: Website;
        Insert: WebsiteInsert;
        Update: WebsiteUpdate;
      };
      bookings: {
        Row: Booking;
        Insert: BookingInsert;
        Update: BookingUpdate;
      };
      leads: {
        Row: Lead;
        Insert: LeadInsert;
        Update: LeadUpdate;
      };
      notification_settings: {
        Row: NotificationSettings;
        Insert: NotificationSettingsInsert;
        Update: NotificationSettingsUpdate;
      };
      activity_log: {
        Row: ActivityLog;
        Insert: ActivityLogInsert;
        Update: never;
      };
      google_business_locations: {
        Row: GoogleBusinessLocation;
        Insert: GoogleBusinessLocationInsert;
        Update: GoogleBusinessLocationUpdate;
      };
      google_reviews_cache: {
        Row: GoogleReviewCache;
        Insert: GoogleReviewCacheInsert;
        Update: GoogleReviewCacheUpdate;
      };
    };
  };
}
