import webpush from "web-push";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

let vapidReady = false;
let vapidError: string | null = null;

function normalizeSubject(value?: string) {
  if (!value) return "mailto:soporte@neumorstudio.com";
  if (value.startsWith("mailto:") || value.startsWith("https://")) return value;
  return `mailto:${value}`;
}

function ensureVapidDetails() {
  if (vapidReady || vapidError) return vapidReady;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    vapidError = "missing_vapid";
    return false;
  }

  const subject = normalizeSubject(
    process.env.VAPID_SUBJECT || process.env.EMAIL_REPLY_TO
  );

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

interface PushSubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPushNotification(
  supabaseAdmin: { from: (table: string) => any },
  websiteId: string | null | undefined,
  payload: PushPayload
) {
  if (!websiteId) {
    return { sent: 0, removed: 0, reason: "missing_website" };
  }

  if (!ensureVapidDetails()) {
    return { sent: 0, removed: 0, reason: vapidError || "missing_vapid" };
  }

  const { data: subscriptions, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("website_id", websiteId);

  if (error || !subscriptions?.length) {
    return { sent: 0, removed: 0, reason: "no_subscriptions" };
  }

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
    data: payload.data,
  });

  const staleIds: string[] = [];
  let sent = 0;

  for (const sub of subscriptions as PushSubscriptionRow[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payloadString
      );
      sent += 1;
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 410) {
        staleIds.push(sub.id);
      }
    }
  }

  if (staleIds.length) {
    await supabaseAdmin.from("push_subscriptions").delete().in("id", staleIds);
  }

  return { sent, removed: staleIds.length };
}
