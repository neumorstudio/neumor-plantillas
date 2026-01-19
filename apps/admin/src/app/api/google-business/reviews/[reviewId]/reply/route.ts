// ============================================
// Reply to Google Business Review
// POST /api/google-business/reviews/[reviewId]/reply
// DELETE /api/google-business/reviews/[reviewId]/reply
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
    decryptToken,
    refreshAccessToken,
    encryptToken,
    isTokenExpiringSoon,
    replyToReview,
    deleteReviewReply,
} from "@/lib/google-business-service";

// Helper para obtener Supabase client
async function getSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                },
            },
        }
    );
}

// Helper para obtener y refrescar token si es necesario
async function getValidAccessToken(
    supabase: ReturnType<typeof createServerClient>,
    socialAccount: {
        id: string;
        access_token: string;
        refresh_token: string;
        token_expires_at: string;
    }
): Promise<string> {
    const expiresAt = new Date(socialAccount.token_expires_at);

    if (isTokenExpiringSoon(expiresAt)) {
        const refreshToken = decryptToken(socialAccount.refresh_token);
        const newTokens = await refreshAccessToken(refreshToken);

        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
        await supabase
            .from("social_accounts")
            .update({
                access_token: encryptToken(newTokens.access_token),
                token_expires_at: newExpiresAt.toISOString(),
                last_used_at: new Date().toISOString(),
            })
            .eq("id", socialAccount.id);

        return newTokens.access_token;
    }

    return decryptToken(socialAccount.access_token);
}

/**
 * POST - Responder a una reseña
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    try {
        const supabase = await getSupabaseClient();
        const { reviewId } = await params;
        const body = await request.json();
        const { comment } = body;

        if (!comment || typeof comment !== "string" || comment.trim().length === 0) {
            return NextResponse.json(
                { error: "Comment is required" },
                { status: 400 }
            );
        }

        // Verificar usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Obtener la reseña del cache para verificar pertenencia
        const { data: review } = await supabase
            .from("google_reviews_cache")
            .select(`
        id,
        review_name,
        location_id,
        google_business_locations!inner (
          id,
          social_account_id,
          social_accounts!inner (
            id,
            website_id,
            access_token,
            refresh_token,
            token_expires_at,
            websites!inner (
              client_id
            )
          )
        )
      `)
            .eq("id", reviewId)
            .single();

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Verificar que la reseña pertenece al usuario
        const location = review.google_business_locations as unknown as {
            social_accounts: {
                id: string;
                website_id: string;
                access_token: string;
                refresh_token: string;
                token_expires_at: string;
                websites: { client_id: string };
            };
        };

        if (location.social_accounts.websites.client_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Obtener token válido
        const accessToken = await getValidAccessToken(supabase, {
            id: location.social_accounts.id,
            access_token: location.social_accounts.access_token,
            refresh_token: location.social_accounts.refresh_token,
            token_expires_at: location.social_accounts.token_expires_at,
        });

        // Responder a la reseña en Google
        await replyToReview(accessToken, review.review_name, comment.trim());

        // Actualizar cache local
        await supabase
            .from("google_reviews_cache")
            .update({
                reply_comment: comment.trim(),
                reply_updated_at: new Date().toISOString(),
            })
            .eq("id", reviewId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reply to review error:", error);
        return NextResponse.json(
            { error: "Failed to reply to review" },
            { status: 500 }
        );
    }
}

/**
 * DELETE - Eliminar respuesta de una reseña
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ reviewId: string }> }
) {
    try {
        const supabase = await getSupabaseClient();
        const { reviewId } = await params;

        // Verificar usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Obtener la reseña del cache
        const { data: review } = await supabase
            .from("google_reviews_cache")
            .select(`
        id,
        review_name,
        location_id,
        google_business_locations!inner (
          id,
          social_account_id,
          social_accounts!inner (
            id,
            website_id,
            access_token,
            refresh_token,
            token_expires_at,
            websites!inner (
              client_id
            )
          )
        )
      `)
            .eq("id", reviewId)
            .single();

        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // Verificar que la reseña pertenece al usuario
        const location = review.google_business_locations as unknown as {
            social_accounts: {
                id: string;
                website_id: string;
                access_token: string;
                refresh_token: string;
                token_expires_at: string;
                websites: { client_id: string };
            };
        };

        if (location.social_accounts.websites.client_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Obtener token válido
        const accessToken = await getValidAccessToken(supabase, {
            id: location.social_accounts.id,
            access_token: location.social_accounts.access_token,
            refresh_token: location.social_accounts.refresh_token,
            token_expires_at: location.social_accounts.token_expires_at,
        });

        // Eliminar respuesta en Google
        await deleteReviewReply(accessToken, review.review_name);

        // Actualizar cache local
        await supabase
            .from("google_reviews_cache")
            .update({
                reply_comment: null,
                reply_updated_at: null,
            })
            .eq("id", reviewId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete review reply error:", error);
        return NextResponse.json(
            { error: "Failed to delete review reply" },
            { status: 500 }
        );
    }
}
