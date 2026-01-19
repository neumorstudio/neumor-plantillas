// ============================================
// Google Business Reviews API
// GET /api/google-business/reviews - List reviews
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
    decryptToken,
    refreshAccessToken,
    encryptToken,
    isTokenExpiringSoon,
    listReviews,
    starRatingToNumber,
    GoogleApiError,
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

async function getWebsiteForUser(
    supabase: ReturnType<typeof createServerClient>,
    userId: string
) {
    const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!client) {
        return null;
    }

    const { data: website } = await supabase
        .from("websites")
        .select("id")
        .eq("client_id", client.id)
        .single();

    return website;
}

// Helper para obtener y refrescar token si es necesario
async function getValidAccessToken(
    supabase: ReturnType<typeof createServerClient>,
    socialAccount: {
        id: string;
        access_token: string;
        refresh_token: string;
        token_expires_at: string;
    },
    forceRefresh: boolean = false
): Promise<string> {
    const expiresAt = new Date(socialAccount.token_expires_at);

    if (forceRefresh || isTokenExpiringSoon(expiresAt)) {
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
 * GET - Lista reseñas de la ubicación seleccionada
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await getSupabaseClient();
        const searchParams = request.nextUrl.searchParams;
        const forceRefresh = searchParams.get("refresh") === "true";

        // Verificar usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Obtener website
        const website = await getWebsiteForUser(supabase, user.id);

        if (!website) {
            return NextResponse.json({ error: "No website found" }, { status: 404 });
        }

        // Obtener cuenta de Google Business
        const { data: socialAccount } = await supabase
            .from("social_accounts")
            .select("id, access_token, refresh_token, token_expires_at")
            .eq("website_id", website.id)
            .eq("platform", "google_business")
            .single();

        if (!socialAccount) {
            return NextResponse.json({
                connected: false,
                reviews: [],
            });
        }

        // Obtener ubicación seleccionada
        const { data: location } = await supabase
            .from("google_business_locations")
            .select("*")
            .eq("social_account_id", socialAccount.id)
            .eq("is_selected", true)
            .single();

        if (!location) {
            return NextResponse.json({
                connected: true,
                selectedLocation: null,
                reviews: [],
                message: "No location selected",
            });
        }

        // Verificar si hay cache válido (menos de 5 minutos) y no se fuerza refresh
        if (!forceRefresh) {
            const { data: cachedReviews } = await supabase
                .from("google_reviews_cache")
                .select("*")
                .eq("location_id", location.id)
                .order("review_created_at", { ascending: false });

            if (cachedReviews && cachedReviews.length > 0) {
                const oldestCache = new Date(cachedReviews[cachedReviews.length - 1].cached_at);
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

                if (oldestCache > fiveMinutesAgo) {
                    return NextResponse.json({
                        connected: true,
                        selectedLocation: location,
                        reviews: cachedReviews,
                        fromCache: true,
                    });
                }
            }
        }

        // Obtener reseñas de Google
        let accessToken: string;
        try {
            accessToken = await getValidAccessToken(supabase, socialAccount);
        } catch (error) {
            console.error("Get access token error:", error);
            return NextResponse.json(
                { error: "Failed to get access token" },
                { status: 401 }
            );
        }

        let googleReviews;
        let totalReviewCount;
        try {
            const result = await listReviews(
                accessToken,
                location.account_name,
                location.location_name
            );
            googleReviews = result.reviews;
            totalReviewCount = result.totalReviewCount;
        } catch (error) {
            if (error instanceof GoogleApiError && error.status === 401) {
                accessToken = await getValidAccessToken(supabase, socialAccount, true);
                const result = await listReviews(
                    accessToken,
                    location.account_name,
                    location.location_name
                );
                googleReviews = result.reviews;
                totalReviewCount = result.totalReviewCount;
            } else if (error instanceof GoogleApiError) {
                return NextResponse.json(
                    { error: error.message, detail: error.body },
                    { status: error.status }
                );
            } else {
                throw error;
            }
        }

        // Actualizar cache
        // Primero eliminar cache antiguo
        await supabase
            .from("google_reviews_cache")
            .delete()
            .eq("location_id", location.id);

        // Insertar nuevas reseñas en cache
        const reviewsToInsert = googleReviews.map((review) => ({
            location_id: location.id,
            review_name: review.name,
            reviewer_name: review.reviewer?.displayName || "Anónimo",
            reviewer_photo_url: review.reviewer?.profilePhotoUrl || null,
            star_rating: starRatingToNumber(review.starRating),
            comment: review.comment || null,
            reply_comment: review.reviewReply?.comment || null,
            reply_updated_at: review.reviewReply?.updateTime || null,
            review_created_at: review.createTime,
            review_updated_at: review.updateTime,
        }));

        if (reviewsToInsert.length > 0) {
            await supabase.from("google_reviews_cache").insert(reviewsToInsert);
        }

        // Obtener reseñas del cache actualizado
        const { data: updatedReviews } = await supabase
            .from("google_reviews_cache")
            .select("*")
            .eq("location_id", location.id)
            .order("review_created_at", { ascending: false });

        return NextResponse.json({
            connected: true,
            selectedLocation: location,
            reviews: updatedReviews || [],
            totalReviewCount,
            fromCache: false,
        });
    } catch (error) {
        console.error("List reviews error:", error);
        return NextResponse.json(
            { error: "Failed to list reviews" },
            { status: 500 }
        );
    }
}
