import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminEmail } from "./lib/superadmin-emails";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<typeof supabaseResponse.cookies.set>[2];
          }>
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protected route - change-password requires authentication
  if (!user && request.nextUrl.pathname === "/change-password") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // SUPERADMIN routes - requires authentication + superadmin email
  if (request.nextUrl.pathname.startsWith("/super")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (!isSuperAdminEmail(user.email)) {
      // Usuario autenticado pero NO es superadmin -> 403 Forbidden
      return new NextResponse("Forbidden: SuperAdmin access required", {
        status: 403,
      });
    }
  }

  // Force password change on first login
  if (user?.user_metadata?.must_change_password) {
    // Allow access to change-password page
    if (request.nextUrl.pathname === "/change-password") {
      return supabaseResponse;
    }
    // Redirect any other page to change-password
    if (
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/super") ||
      request.nextUrl.pathname === "/login"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/change-password";
      return NextResponse.redirect(url);
    }
  }

  // Redirect after login based on role
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    // SuperAdmin va directo a /super, usuarios normales a /dashboard
    url.pathname = isSuperAdminEmail(user.email) ? "/super" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // SuperAdmin no deberia acceder al dashboard normal
  if (user && request.nextUrl.pathname.startsWith("/dashboard") && isSuperAdminEmail(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/super";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
