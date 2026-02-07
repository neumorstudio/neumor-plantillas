import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, getFromAddress } from "@/lib/resend";
import { getSalonAppointmentReminder1hEmail } from "@/lib/email-templates";

const TIME_ZONE = "Europe/Madrid";
const REMINDER_WINDOW_MINUTES = 10;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase admin credentials are missing");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function getLocalParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function localEpoch(parts: ReturnType<typeof getLocalParts>) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second || 0);
}

function getDateString(parts: ReturnType<typeof getLocalParts>) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function parseBookingEpoch(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hour, minute] = timeValue.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, 0);
}

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const vercelCron = request.headers.get("x-vercel-cron");
  const authHeader = request.headers.get("authorization");

  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }

  return vercelCron === "1";
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const nowParts = getLocalParts();
    const nextHourParts = getLocalParts(new Date(Date.now() + 60 * 60 * 1000));
    const dateKeys = Array.from(new Set([getDateString(nowParts), getDateString(nextHourParts)]));

    const { data: bookings, error: bookingError } = await supabase
      .from("bookings")
      .select("id, website_id, customer_name, customer_email, customer_phone, booking_date, booking_time, status, notes, services, total_price_cents")
      .in("booking_date", dateKeys)
      .in("status", ["pending", "confirmed"])
      .not("customer_email", "is", null);

    if (bookingError) {
      throw bookingError;
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const websiteIds = Array.from(new Set(bookings.map((booking) => booking.website_id).filter(Boolean)));
    const { data: websites } = await supabase
      .from("websites")
      .select("id, client_id, config")
      .in("id", websiteIds);

    const clientIds = Array.from(
      new Set((websites || []).map((site) => site.client_id).filter(Boolean))
    );
    const { data: clients } = await supabase
      .from("clients")
      .select("id, business_name, business_type, email")
      .in("id", clientIds);

    const websiteMap = new Map((websites || []).map((site) => [site.id, site]));
    const clientMap = new Map((clients || []).map((client) => [client.id, client]));

    const nowEpoch = localEpoch(nowParts);
    let sentCount = 0;

    for (const booking of bookings) {
      if (!booking.customer_email || !booking.booking_date || !booking.booking_time) continue;
      const bookingEpoch = parseBookingEpoch(booking.booking_date, booking.booking_time);
      const diffMinutes = Math.round((bookingEpoch - nowEpoch) / 60000);
      if (diffMinutes < 60 || diffMinutes >= 60 + REMINDER_WINDOW_MINUTES) continue;

      const website = websiteMap.get(booking.website_id);
      const client = website ? clientMap.get(website.client_id) : null;
      if (!client || client.business_type !== "salon") continue;

      const { data: existingReminder } = await supabase
        .from("activity_log")
        .select("id")
        .eq("client_id", client.id)
        .eq("action", "booking_reminder_1h")
        .eq("details->>booking_id", booking.id)
        .maybeSingle();

      if (existingReminder) {
        continue;
      }

      const config = (website?.config || {}) as {
        businessName?: string;
        phone?: string;
        address?: string;
        logo?: string;
        branding?: { logo?: string };
      };

      const businessName = config.businessName || client.business_name || "Salon";
      const logoUrl = config.branding?.logo || config.logo || undefined;

      const serviceNames = Array.isArray(booking.services)
        ? booking.services.map((item: { name?: string }) => item?.name).filter(Boolean).join(", ")
        : "";

      const emailData = {
        businessName,
        customerName: booking.customer_name,
        date: booking.booking_date,
        time: booking.booking_time,
        service: serviceNames,
        professional: undefined,
        notes: booking.notes || undefined,
        phone: booking.customer_phone || undefined,
        email: booking.customer_email || undefined,
        businessPhone: config.phone,
        businessAddress: config.address,
        logoUrl,
      };

      const html = getSalonAppointmentReminder1hEmail(emailData);
      const fromAddress = getFromAddress(businessName);
      const result = await sendEmail({
        to: booking.customer_email,
        subject: `Recordatorio: tu cita es en 1 hora - ${businessName}`,
        html,
        from: fromAddress,
        replyTo: client.email || undefined,
      });

      if (result.success) {
        sentCount += 1;
        await supabase.from("activity_log").insert({
          client_id: client.id,
          action: "booking_reminder_1h",
          details: {
            booking_id: booking.id,
            booking_date: booking.booking_date,
            booking_time: booking.booking_time,
            reminder_minutes_before: 60,
            customer_email: booking.customer_email,
          },
        });
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
