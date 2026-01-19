// ============================================
// Google Business Profile Service
// Maneja OAuth, tokens y llamadas a la API
// ============================================

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import crypto from "crypto";

// ============================================
// CONFIGURACIÓN
// ============================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3001/api/google-business/auth/callback";
const TOKEN_ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY!; // 32 bytes hex string

// Scopes necesarios para Google Business Profile
const SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "openid",
  "email",
  "profile",
];

// URLs de Google
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// Google Business Profile API URLs
// Updated to use the latest federated APIs where possible
const GBP_ACCOUNT_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const GBP_INFO_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
// Note: Reviews are still accessed via specific newer endpoints, but we use the "v4" compatible URL structure
// or the new Performance API depending on the exact operation.
// For simplicity and stability with current "googleapis" recommendations, we stick to the specialized endpoints.

// ============================================
// TIPOS
// ============================================

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface GoogleBusinessAccount {
  name: string; // accounts/{accountId}
  accountName: string;
  type: string; // PERSONAL, LOCATION_GROUP, etc.
  role: string;
  state: {
    status: string;
  };
}

export interface GoogleBusinessLocation {
  name: string; // locations/{locationId}
  title: string;
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
    regionCode: string;
  };
  phoneNumbers?: {
    primaryPhone: string;
  };
  websiteUri?: string;
  metadata?: {
    hasGoogleUpdated: boolean;
    canModifyServiceList: boolean;
    canHaveFoodMenus: boolean;
  };
}

export interface GoogleReview {
  name: string; // accounts/.../locations/.../reviews/{reviewId}
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export class GoogleApiError extends Error {
  status: number;
  body: string;
  code?: string;

  constructor(message: string, status: number, body: string, code?: string) {
    super(message);
    this.status = status;
    this.body = body;
    this.code = code;
  }
}

// ============================================
// ENCRIPTACIÓN DE TOKENS
// ============================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encripta un token usando AES-256-GCM
 */
export function encryptToken(token: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(TOKEN_ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Formato: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Desencripta un token
 */
export function decryptToken(encryptedToken: string): string {
  const parts = encryptedToken.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const key = Buffer.from(TOKEN_ENCRYPTION_KEY, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// ============================================
// OAUTH FLOW
// ============================================

/**
 * Genera la URL de autorización de Google
 */
export function generateAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // Fuerza refresh_token
    state: state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Intercambia el código de autorización por tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Token exchange error:", errorBody);

    // Intentar parsear el error para detalles (ej: invalid_grant)
    try {
      const errorJson = JSON.parse(errorBody);
      throw new GoogleApiError(
        `Failed to exchange code: ${errorJson.error_description || errorJson.error}`,
        response.status,
        errorBody,
        errorJson.error
      );
    } catch (e) {
      if (e instanceof GoogleApiError) throw e;
      throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }
  }

  return response.json();
}

/**
 * Refresca el access token usando el refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Token refresh error:", errorBody);
    throw new GoogleApiError("Failed to refresh token", response.status, errorBody);
  }

  const tokens = await response.json();
  // Google no devuelve refresh_token en el refresh si no es necesario, mantenemos el original
  return {
    ...tokens,
    refresh_token: tokens.refresh_token || refreshToken,
  };
}

/**
 * Revoca los tokens en Google
 */
export async function revokeToken(token: string): Promise<void> {
  const response = await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    console.warn("Token revocation failed:", await response.text());
    // No lanzamos error, continuamos
  }
}

/**
 * Obtiene información del usuario de Google
 */
export async function getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.status}`);
  }

  return response.json();
}

// ============================================
// GOOGLE BUSINESS PROFILE API
// ============================================

/**
 * Lista las cuentas de Google Business Profile del usuario
 * Uses: My Business Account Management API v1
 */
export async function listAccounts(accessToken: string): Promise<GoogleBusinessAccount[]> {
  const response = await fetch(`${GBP_ACCOUNT_BASE}/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("List accounts error:", error);
    throw new GoogleApiError("Failed to list accounts", response.status, error);
  }

  const data = await response.json();
  return data.accounts || [];
}

/**
 * Lista las ubicaciones de una cuenta
 * Uses: My Business Business Information API v1
 */
export async function listLocations(
  accessToken: string,
  accountName: string
): Promise<GoogleBusinessLocation[]> {
  // Nota: accountName ya viene en formato "accounts/{id}"
  const response = await fetch(
    `${GBP_INFO_BASE}/${accountName}/locations?readMask=name,title,storefrontAddress,phoneNumbers,websiteUri,metadata`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("List locations error:", error);
    throw new GoogleApiError("Failed to list locations", response.status, error);
  }

  const data = await response.json();
  return data.locations || [];
}

/**
 * Lista las reseñas de una ubicación
 * Uses: My Business API v4 (Legacy endpoint, but stable for reviews)
 * Note: While "Performance API" is the future, direct review management (list/reply) 
 * via "https://mybusiness.googleapis.com/v4" is still the standard way supported 
 * until the fully federated Reviews API is prevalent. 
 * We check if we need to account format adjustments.
 */
export async function listReviews(
  accessToken: string,
  accountName: string,
  locationName: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<{ reviews: GoogleReview[]; nextPageToken?: string; totalReviewCount?: number }> {
  // Extract simple IDs from full resource names if necessary, 
  // but v4 expects "accounts/{accountId}/locations/{locationId}/reviews"

  // Ensure names are clean. 
  // API v4 expects: "accounts/{accountId}/locations/{locationId}"
  // API v1 names are compatible but let's be safe.

  const resourceName = `${accountName}/${locationName}`;
  // WARNING: locationName from v1 is "locations/{id}", accountName is "accounts/{id}"
  // Creating the path: "accounts/{accId}/locations/{locId}/reviews"
  // If accountName="accounts/123" and locationName="locations/456", 
  // then `${accountName}/${locationName}` results in "accounts/123/locations/456". Correct.

  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
  });
  if (pageToken) {
    params.append("pageToken", pageToken);
  }

  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("List reviews error:", error);
    throw new GoogleApiError("Failed to list reviews", response.status, error);
  }

  const data = await response.json();
  return {
    reviews: data.reviews || [],
    nextPageToken: data.nextPageToken,
    totalReviewCount: data.totalReviewCount,
  };
}

/**
 * Responde a una reseña
 */
export async function replyToReview(
  accessToken: string,
  reviewName: string,
  comment: string
): Promise<void> {
  // reviewName format: accounts/{accId}/locations/{locId}/reviews/{reviewId}
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment: comment,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Reply to review error:", error);
    throw new GoogleApiError(`Failed to reply to review`, response.status, error);
  }
}

/**
 * Elimina la respuesta de una reseña
 */
export async function deleteReviewReply(
  accessToken: string,
  reviewName: string
): Promise<void> {
  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Delete review reply error:", error);
    throw new GoogleApiError(`Failed to delete review reply`, response.status, error);
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Convierte el rating de texto a número
 */
export function starRatingToNumber(rating: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[rating] || 0;
}

/**
 * Genera un state CSRF aleatorio
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Verifica si el token está próximo a expirar (menos de 5 minutos)
 */
export function isTokenExpiringSoon(expiresAt: Date): boolean {
  const fiveMinutes = 5 * 60 * 1000;
  return new Date().getTime() > expiresAt.getTime() - fiveMinutes;
}

/**
 * Formatea la dirección de una ubicación
 */
export function formatAddress(location: GoogleBusinessLocation): string {
  if (!location.storefrontAddress) return "";

  const { addressLines, locality, administrativeArea, postalCode } =
    location.storefrontAddress;

  const parts = [
    ...(addressLines || []),
    locality,
    administrativeArea,
    postalCode,
  ].filter(Boolean);

  return parts.join(", ");
}
