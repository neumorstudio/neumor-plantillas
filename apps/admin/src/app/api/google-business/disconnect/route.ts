// ============================================
// Disconnect Google Business Profile
// POST /api/google-business/disconnect
// ============================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { revokeToken, decryptToken } from "@/lib/google-business-service";

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

export async function POST() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
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

        // Verificar usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Obtener website del usuario
        const website = await getWebsiteForUser(supabase, user.id);

        if (!website) {
            return NextResponse.json({ error: "No website found" }, { status: 404 });
        }

        // Obtener cuenta de Google Business
        const { data: socialAccount } = await supabase
            .from("social_accounts")
            .select("id, access_token, refresh_token")
            .eq("website_id", website.id)
            .eq("platform", "google_business")
            .single();

        if (!socialAccount) {
            return NextResponse.json(
                { error: "No Google Business account connected" },
                { status: 404 }
            );
        }

        // Intentar revocar tokens en Google
        try {
            const accessToken = decryptToken(socialAccount.access_token);
            await revokeToken(accessToken);
        } catch (revokeError) {
            console.warn("Token revocation failed:", revokeError);
            // Continuamos con la eliminación local
        }

        // Eliminar ubicaciones (cascade eliminará reviews cache)
        await supabase
            .from("google_business_locations")
            .delete()
            .eq("social_account_id", socialAccount.id);

        // Eliminar cuenta social
        const { error: deleteError } = await supabase
            .from("social_accounts")
            .delete()
            .eq("id", socialAccount.id);

        if (deleteError) {
            console.error("Delete social account error:", deleteError);
            return NextResponse.json(
                { error: "Failed to disconnect" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Disconnect error:", error);
        return NextResponse.json(
            { error: "Failed to disconnect" },
            { status: 500 }
        );
    }
}
