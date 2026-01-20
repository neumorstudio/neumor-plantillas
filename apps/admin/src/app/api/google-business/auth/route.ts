// ============================================
// OAuth Initiation Route
// GET /api/google-business/auth
// ============================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { generateAuthUrl, generateState } from "@/lib/google-business-service";

const googleBusinessEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_BUSINESS === "true";

export async function GET() {
    if (!googleBusinessEnabled) {
        return NextResponse.json({ error: "Google Business disabled" }, { status: 404 });
    }

    try {
        // Verificar que el usuario está autenticado
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

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Generar state CSRF y guardarlo en cookie
        const state = generateState();

        // Guardar state en cookie httpOnly (expira en 10 minutos)
        cookieStore.set("google_oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 10, // 10 minutos
            path: "/",
        });

        // Generar URL de autorización
        const authUrl = generateAuthUrl(state);

        // Redirigir a Google
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error("OAuth init error:", error);
        return NextResponse.json(
            { error: "Failed to initiate OAuth" },
            { status: 500 }
        );
    }
}
