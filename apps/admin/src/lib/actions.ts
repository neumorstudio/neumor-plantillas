"use server";

import { createServerClient } from "@neumorstudio/supabase";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type {
  Booking,
  BookingUpdate,
  Lead,
  LeadUpdate,
  NotificationSettingsUpdate,
} from "@neumorstudio/supabase";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getClinicAppointmentCancellationEmail,
  getSalonAppointmentCancellationEmail,
} from "@/lib/email-templates";

// Create Supabase server client for Server Actions
// Note: Using any for now until Supabase types are generated from the actual database
async function getSupabase() {
  const cookieStore = await cookies();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
        ) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            }
          } catch {
            // Can fail in Server Components, handled by middleware
          }
        },
      },
    }
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function parseBookingServiceNames(services: unknown): string {
  if (!services) return "Servicio";
  if (Array.isArray(services)) {
    const names = services
      .map((item) => (item && typeof item === "object" ? (item as { name?: string }).name : ""))
      .filter(Boolean);
    return names.length ? names.join(", ") : "Servicio";
  }
  if (typeof services === "string") {
    try {
      const parsed = JSON.parse(services);
      if (Array.isArray(parsed)) {
        const names = parsed
          .map((item) => (item && typeof item === "object" ? (item as { name?: string }).name : ""))
          .filter(Boolean);
        return names.length ? names.join(", ") : "Servicio";
      }
    } catch {
      return services;
    }
    return services;
  }
  return "Servicio";
}

function formatTotalPrice(cents?: number | null): string | undefined {
  if (!cents || cents <= 0) return undefined;
  return `${(cents / 100).toFixed(2)} EUR`;
}

// ============================================
// BOOKINGS ACTIONS
// ============================================

export async function getBookings(websiteId: string): Promise<Booking[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("website_id", websiteId)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateBookingStatus(
  bookingId: string,
  status: Booking["status"]
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reservas");
  return { success: true };
}

export async function updateBooking(
  bookingId: string,
  data: BookingUpdate
): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("bookings")
    .update(data)
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
}

export async function deleteBooking(bookingId: string): Promise<void> {
  const supabase = await getSupabase();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      "id, website_id, customer_name, customer_email, customer_phone, booking_date, booking_time, services, total_price_cents, notes, professional:professionals(name), customer:customers(email)"
    )
    .eq("id", bookingId)
    .single();

  console.log("[deleteBooking] Booking data:", JSON.stringify(booking, null, 2));
  if (fetchError) console.error("[deleteBooking] Error fetching booking:", fetchError);

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customerRelation = booking?.customer as { email?: string } | { email?: string }[] | null;
  let customerEmail =
    booking?.customer_email ||
    (Array.isArray(customerRelation)
      ? customerRelation[0]?.email
      : customerRelation?.email);

  console.log("[deleteBooking] Initial customerEmail:", customerEmail);
  console.log("[deleteBooking] customer_email field:", booking?.customer_email);
  console.log("[deleteBooking] customer relation:", customerRelation);

  if (!customerEmail && booking?.customer_phone && booking?.website_id) {
    const { data: customerByPhone } = await supabase
      .from("customers")
      .select("email")
      .eq("website_id", booking.website_id)
      .eq("phone", booking.customer_phone)
      .limit(1)
      .maybeSingle();
    console.log("[deleteBooking] Found by phone:", customerByPhone);
    customerEmail = customerByPhone?.email || customerEmail;
  }

  console.log("[deleteBooking] Final customerEmail:", customerEmail);

  if (customerEmail && booking) {
    const { data: website } = await supabase
      .from("websites")
      .select("id, config, client:clients(business_name, business_type)")
      .eq("id", booking.website_id)
      .single();

    const client = Array.isArray(website?.client) ? website?.client[0] : website?.client;
    const businessName =
      client?.business_name || (client?.business_type === "salon" ? "Salon" : "Clinica");
    const businessType = client?.business_type || "salon";
    const businessLogo =
      (website?.config as { branding?: { logo?: string } })?.branding?.logo ||
      (website?.config as { logo?: string })?.logo ||
      undefined;
    const businessPhone = (website?.config as { phone?: string })?.phone;
    const businessAddress = (website?.config as { address?: string })?.address;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const professional = booking.professional as { name?: string } | { name?: string }[] | null;
    const professionalName =
      Array.isArray(professional) ? professional[0]?.name : professional?.name;

    const emailData = {
      businessName,
      customerName: booking.customer_name || "Cliente",
      date: formatDate(booking.booking_date),
      time: booking.booking_time || "",
      service: parseBookingServiceNames(booking.services),
      totalPrice: formatTotalPrice(booking.total_price_cents),
      professional: professionalName,
      notes: booking.notes || undefined,
      businessPhone,
      businessAddress,
      logoUrl: businessLogo,
    };

    const html =
      businessType === "salon"
        ? getSalonAppointmentCancellationEmail(emailData)
        : getClinicAppointmentCancellationEmail(emailData);

    console.log("[deleteBooking] Sending cancellation email to:", customerEmail);
    console.log("[deleteBooking] Business:", businessName, "Type:", businessType);

    const emailResult = await sendEmail({
      to: customerEmail,
      subject: `Cita cancelada - ${businessName}`,
      html,
      from: getFromAddress(businessName),
    });

    console.log("[deleteBooking] Email result:", emailResult);
  } else {
    console.log("[deleteBooking] No customer email found, skipping cancellation email");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reservas");
  revalidatePath("/dashboard/calendario");
}

// ============================================
// LEADS ACTIONS
// ============================================

export async function getLeads(websiteId: string): Promise<Lead[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateLeadStatus(
  leadId: string,
  status: Lead["status"]
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLead(
  leadId: string,
  data: LeadUpdate
): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase.from("leads").update(data).eq("id", leadId);

  if (error) throw new Error(error.message);
}

// ============================================
// NOTIFICATION SETTINGS ACTIONS
// ============================================

export async function getNotificationSettings(websiteId: string) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("website_id", websiteId)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
}

export async function updateNotificationSettings(
  websiteId: string,
  settings: NotificationSettingsUpdate
): Promise<void> {
  const supabase = await getSupabase();

  // Try to update first
  const { error: updateError } = await supabase
    .from("notification_settings")
    .update(settings)
    .eq("website_id", websiteId);

  // If no rows updated, insert
  if (updateError) {
    const { error: insertError } = await supabase
      .from("notification_settings")
      .insert({ website_id: websiteId, ...settings });

    if (insertError) throw new Error(insertError.message);
  }
}

// ============================================
// ACTIVITY LOG ACTIONS
// ============================================

export async function getRecentActivity(websiteId: string, limit = 10) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats(websiteId: string) {
  const supabase = await getSupabase();

  // Get bookings this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: bookingsThisMonth } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .gte("created_at", startOfMonth.toISOString());

  // Get new leads
  const { count: newLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .eq("status", "new");

  // Get pending bookings
  const { count: pendingBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .eq("status", "pending");

  return {
    bookingsThisMonth: bookingsThisMonth || 0,
    newLeads: newLeads || 0,
    pendingBookings: pendingBookings || 0,
  };
}
