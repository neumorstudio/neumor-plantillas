import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Re-export types for convenience
export type {
  Booking,
  BookingInsert,
  BookingUpdate,
  Lead,
  LeadInsert,
  LeadUpdate,
  NotificationSettings,
  NotificationSettingsUpdate,
  ActivityLog,
} from "@neumorstudio/supabase";
